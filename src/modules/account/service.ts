import "server-only";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { verifyPassword } from "better-auth/crypto";
import { db } from "@/server/db/client";
import { AppError } from "@/server/security/errors";

const deletionSchema = z
  .object({
    password: z.string().min(1).max(128),
    confirmation: z.literal("DELETE"),
  })
  .strict();

// No expiration or cleanup job deletes User records. This explicit operation is
// the supported self-service deletion path; it never accepts a target user ID.
export async function deleteOwnAccount(userId: string, input: unknown) {
  const { password } = deletionSchema.parse(input);
  const key = `account-delete:${userId}:${Math.floor(Date.now() / 60000)}`;
  const attempts = await db.rateLimit.upsert({
    where: { key },
    create: {
      id: crypto.randomUUID(),
      key,
      count: 1,
      lastRequest: BigInt(Date.now()),
    },
    update: { count: { increment: 1 } },
  });
  if (attempts.count > 5)
    throw new AppError(
      429,
      "RATE_LIMIT",
      "Too many attempts. Try again in a minute.",
    );
  return db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
      await tx.$queryRaw`SELECT id FROM "Account" WHERE "userId" = ${userId} FOR UPDATE`;
      const user = await tx.user.findUnique({ where: { id: userId } });
      const account = await tx.account.findFirst({
        where: { userId, providerId: "credential" },
      });
      if (
        !user ||
        !account?.password ||
        !(await verifyPassword({ hash: account.password, password }))
      ) {
        throw new AppError(
          400,
          "PASSWORD_REQUIRED",
          "Your current password is incorrect.",
        );
      }
      const memberships = await tx.membership.findMany({
        where: { userId },
        orderBy: { businessId: "asc" },
      });
      for (const member of memberships) {
        await tx.$queryRaw`SELECT id FROM "Business" WHERE id = ${member.businessId}::uuid FOR UPDATE`;
      }
      // Recheck under the same business locks used by all membership mutations.
      for (const member of await tx.membership.findMany({
        where: { userId },
      })) {
        if (
          member.active &&
          member.role === "OWNER" &&
          (await tx.membership.count({
            where: {
              businessId: member.businessId,
              active: true,
              role: "OWNER",
              userId: { not: userId },
            },
          })) === 0
        ) {
          throw new AppError(
            409,
            "LAST_OWNER",
            "Add another active owner to each workspace before deleting your profile. This protects your team's workspace.",
          );
        }
      }
      await tx.invitation.deleteMany({
        where: { OR: [{ invitedBy: { userId } }, { email: user.email }] },
      });
      await tx.membership.deleteMany({ where: { userId } });
      // Preserve business event history without retaining the deleted user's ID.
      await tx.auditEvent.updateMany({
        where: { actorUserId: userId },
        data: { actorUserId: "deleted-user" },
      });
      await tx.securityEvent.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } }); // Cascades to credentials and every session.
      return { deleted: true };
    },
    {
      timeout: 15000,
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    },
  );
}
