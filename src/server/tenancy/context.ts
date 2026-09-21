import "server-only";
import type { Prisma } from "@prisma/client";
import { AppError } from "@/server/security/errors";
import { enforce, type Permission } from "./policy";
export async function tenant(
  tx: Prisma.TransactionClient,
  userId: string,
  businessId: string,
  action: Permission = "business:read",
) {
  const member = await tx.membership.findUnique({
    where: { businessId_userId: { businessId, userId } },
  });
  if (!member?.active)
    throw new AppError(404, "NOT_FOUND", "Workspace not found.");
  enforce(member, action);
  return member;
}
