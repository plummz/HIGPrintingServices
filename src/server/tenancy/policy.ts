import { AppError } from "@/server/security/errors";
export type Permission =
  | "business:read"
  | "business:update"
  | "members:read"
  | "members:manage"
  | "audit:read";
export type Member = { role: string; active: boolean; permissions: string[] };
export function can(member: Member, action: Permission) {
  if (!member.active) return false;
  if (member.role === "OWNER") return true;
  if (action === "business:read") return true;
  return (
    member.role === "ADMIN" &&
    action !== "members:manage" &&
    member.permissions.includes(action)
  );
}
export function enforce(member: Member, action: Permission) {
  if (!can(member, action))
    throw new AppError(
      403,
      "FORBIDDEN",
      "You do not have permission for this action.",
    );
}
