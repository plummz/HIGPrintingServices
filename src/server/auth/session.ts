import "server-only";
import { auth } from "./config";
import { AppError } from "@/server/security/errors";
export async function requireUser(headers: Headers) {
  const session = await auth().api.getSession({ headers });
  if (!session) throw new AppError(401, "UNAUTHENTICATED", "Please sign in.");
  if (!session.user.emailVerified)
    throw new AppError(403, "UNVERIFIED", "Please verify your email.");
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
