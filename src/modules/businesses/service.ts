import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";
import { tenant } from "@/server/tenancy/context";
import { AppError } from "@/server/security/errors";
import {
  businessSchema,
  updateBusinessSchema,
  inviteSchema,
  memberSchema,
  acceptSchema,
} from "./schemas";
const notFound = () => new AppError(404, "NOT_FOUND", "Record not found.");
const audit = (
  tx: Prisma.TransactionClient,
  businessId: string,
  actorUserId: string,
  action: string,
  resourceId: string,
  details: Prisma.InputJsonObject = {},
) =>
  tx.auditEvent.create({
    data: { businessId, actorUserId, action, resourceId, details },
  });
// Serialize administrative mutations per business; recheck caller membership AFTER lock.
async function lock(tx: Prisma.TransactionClient, businessId: string) {
  await tx.$queryRaw`SELECT id FROM "Business" WHERE id = ${businessId}::uuid FOR UPDATE`;
}
export async function listBusinesses(userId: string) {
  return db.membership.findMany({
    where: { userId, active: true },
    select: {
      role: true,
      business: { select: { id: true, name: true, currency: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}
export async function createBusiness(userId: string, input: unknown) {
  const data = businessSchema.parse(input);
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    if (
      (await tx.membership.count({
        where: { userId, role: "OWNER", active: true },
      })) >= 10
    )
      throw new AppError(
        409,
        "LIMIT",
        "A maximum of 10 owned workspaces is supported.",
      );
    const business = await tx.business.create({ data });
    await tx.membership.create({
      data: { businessId: business.id, userId, role: "OWNER" },
    });
    await audit(tx, business.id, userId, "BUSINESS_CREATED", business.id);
    return business;
  });
}
export async function readBusiness(userId: string, businessId: string) {
  return db.$transaction(async (tx) => {
    const member = await tenant(tx, userId, businessId);
    const business = await tx.business.findUniqueOrThrow({
      where: { id: businessId },
    });
    return {
      business,
      membership: {
        id: member.id,
        role: member.role,
        active: member.active,
        permissions: member.permissions,
      },
    };
  });
}
export async function updateBusiness(
  userId: string,
  businessId: string,
  input: unknown,
) {
  const { expectedVersion, ...data } = updateBusinessSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lock(tx, businessId);
    await tenant(tx, userId, businessId, "business:update");
    const before = await tx.business.findUniqueOrThrow({
      where: { id: businessId },
    });
    if (before.version !== expectedVersion)
      throw new AppError(409, "STALE", "Settings changed. Refresh and retry.");
    const business = await tx.business.update({
      where: { id: businessId },
      data: { ...data, version: { increment: 1 } },
    });
    await audit(tx, businessId, userId, "BUSINESS_UPDATED", businessId, {
      previousVersion: before.version,
      version: business.version,
    });
    return business;
  });
}
export async function listMembers(userId: string, businessId: string) {
  return db.$transaction(async (tx) => {
    await tenant(tx, userId, businessId, "members:read");
    return tx.membership.findMany({
      where: { businessId },
      select: {
        id: true,
        role: true,
        active: true,
        permissions: true,
        version: true,
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
  });
}
export async function updateMember(
  userId: string,
  businessId: string,
  id: string,
  input: unknown,
) {
  const data = memberSchema.parse(input);
  return db.$transaction(async (tx) => {
    await lock(tx, businessId);
    await tenant(tx, userId, businessId, "members:manage");
    const before = await tx.membership.findUnique({
      where: { businessId_id: { businessId, id } },
    });
    if (!before) throw notFound();
    if (before.version !== data.expectedVersion)
      throw new AppError(409, "STALE", "Member changed. Refresh and retry.");
    if (
      before.role === "OWNER" &&
      before.active &&
      (data.role !== "OWNER" || !data.active) &&
      (await tx.membership.count({
        where: { businessId, role: "OWNER", active: true },
      })) <= 1
    )
      throw new AppError(409, "LAST_OWNER", "Keep at least one active owner.");
    const result = await tx.membership.update({
      where: { businessId_id: { businessId, id } },
      data: {
        role: data.role,
        active: data.active,
        permissions:
          data.role === "OWNER" ? [] : [...new Set(data.permissions)],
        version: { increment: 1 },
      },
    });
    // Cancel outstanding invitations issued by someone whose owner authority is withdrawn.
    if (data.role !== "OWNER" || !data.active)
      await tx.invitation.updateMany({
        where: {
          businessId,
          invitedById: id,
          consumedAt: null,
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    await audit(tx, businessId, userId, "MEMBERSHIP_UPDATED", id, {
      before: {
        role: before.role,
        active: before.active,
        permissions: before.permissions,
      },
      after: {
        role: result.role,
        active: result.active,
        permissions: result.permissions,
      },
    });
    return {
      id: result.id,
      role: result.role,
      active: result.active,
      permissions: result.permissions,
      version: result.version,
    };
  });
}
export async function inviteMember(
  userId: string,
  businessId: string,
  input: unknown,
) {
  const data = inviteSchema.parse(input);
  const token = randomBytes(32).toString("hex");
  return db.$transaction(async (tx) => {
    await lock(tx, businessId);
    const actor = await tenant(tx, userId, businessId, "members:manage");
    if (
      (await tx.invitation.count({
        where: {
          businessId,
          consumedAt: null,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      })) >= 100
    )
      throw new AppError(409, "LIMIT", "Too many pending invitations.");
    await tx.invitation.updateMany({
      where: {
        businessId,
        email: data.email,
        consumedAt: null,
        revokedAt: null,
      },
      data: { revokedAt: new Date() },
    });
    const invitation = await tx.invitation.create({
      data: {
        ...data,
        businessId,
        invitedById: actor.id,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 48 * 3600_000),
      },
    });
    await audit(tx, businessId, userId, "INVITATION_CREATED", invitation.id, {
      role: data.role,
    });
    return {
      id: invitation.id,
      expiresAt: invitation.expiresAt,
      url: `${process.env.BETTER_AUTH_URL}/join#${token}`,
    };
  });
}
export async function acceptInvitation(
  user: { id: string; email: string },
  input: unknown,
) {
  const { token } = acceptSchema.parse(input);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  return db.$transaction(async (tx) => {
    const found = await tx.invitation.findUnique({ where: { tokenHash } });
    if (!found) throw notFound();
    await lock(tx, found.businessId);
    const invitation = await tx.invitation.findUniqueOrThrow({
      where: { id: found.id },
    });
    if (
      invitation.consumedAt ||
      invitation.revokedAt ||
      invitation.expiresAt <= new Date() ||
      invitation.email !== user.email.toLowerCase()
    )
      throw notFound();
    const inviter = await tx.membership.findUnique({
      where: {
        businessId_id: {
          businessId: invitation.businessId,
          id: invitation.invitedById,
        },
      },
    });
    if (!inviter?.active || inviter.role !== "OWNER") throw notFound();
    if (
      await tx.membership.findUnique({
        where: {
          businessId_userId: {
            businessId: invitation.businessId,
            userId: user.id,
          },
        },
      })
    )
      throw new AppError(
        409,
        "EXISTS",
        "Membership already exists. Ask the owner to update it.",
      );
    const membership = await tx.membership.create({
      data: {
        businessId: invitation.businessId,
        userId: user.id,
        role: invitation.role,
        permissions: invitation.permissions,
      },
    });
    await tx.invitation.update({
      where: { id: invitation.id },
      data: { consumedAt: new Date() },
    });
    await audit(
      tx,
      invitation.businessId,
      user.id,
      "INVITATION_ACCEPTED",
      membership.id,
    );
    return { businessId: invitation.businessId };
  });
}
export async function listAudit(userId: string, businessId: string) {
  return db.$transaction(async (tx) => {
    await tenant(tx, userId, businessId, "audit:read");
    return tx.auditEvent.findMany({
      where: { businessId },
      select: {
        id: true,
        action: true,
        resourceId: true,
        createdAt: true,
        details: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  });
}
export async function listInvitations(userId: string, businessId: string) {
  return db.$transaction(async (tx) => {
    await tenant(tx, userId, businessId, "members:manage");
    return tx.invitation.findMany({
      where: {
        businessId,
        consumedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, email: true, role: true, expiresAt: true },
      take: 100,
    });
  });
}
export async function revokeInvitation(
  userId: string,
  businessId: string,
  id: string,
) {
  return db.$transaction(async (tx) => {
    await lock(tx, businessId);
    await tenant(tx, userId, businessId, "members:manage");
    const invitation = await tx.invitation.findFirst({
      where: { id, businessId, consumedAt: null, revokedAt: null },
    });
    if (!invitation) throw notFound();
    await tx.invitation.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    await audit(tx, businessId, userId, "INVITATION_REVOKED", id);
    return { id };
  });
}
