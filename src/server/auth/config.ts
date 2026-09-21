import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { randomUUID } from "node:crypto";
import { db } from "@/server/db/client";
import { sendAuthMail } from "./mail";
export function getAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (
    !secret ||
    secret.length < 32 ||
    secret.startsWith("REPLACE_") ||
    !baseURL
  )
    throw new Error("Authentication environment is not configured");
  if (
    process.env.NODE_ENV === "production" &&
    (!baseURL.startsWith("https://") || process.env.MAIL_TRANSPORT !== "smtp")
  )
    throw new Error("Production requires HTTPS and SMTP");
  return betterAuth({
    appName: "PrintFlow",
    baseURL,
    secret,
    logger: { disabled: true },
    database: prismaAdapter(db, { provider: "postgresql" }),
    trustedOrigins: [baseURL],
    advanced: {
      database: { generateId: () => randomUUID() },
      ipAddress: {
        ipAddressHeaders: [process.env.TRUSTED_IP_HEADER || "x-real-ip"],
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 12,
      maxPasswordLength: 128,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) =>
        sendAuthMail(user.email, "Reset your PrintFlow password", url),
      onPasswordReset: async ({ user }) => {
        await db.securityEvent.create({
          data: { userId: user.id, action: "PASSWORD_RESET" },
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) =>
        sendAuthMail(user.email, "Verify your PrintFlow email", url),
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: false },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 5 },
        "/sign-up/email": { window: 60, max: 5 },
        "/request-password-reset": { window: 60, max: 3 },
        "/send-verification-email": { window: 60, max: 3 },
      },
    },
    databaseHooks: {
      session: {
        create: {
          after: async (session) => {
            await db.securityEvent.create({
              data: { userId: session.userId, action: "SESSION_CREATED" },
            });
          },
        },
        delete: {
          after: async (session) => {
            await db.securityEvent.create({
              data: { userId: session.userId, action: "SESSION_REVOKED" },
            });
          },
        },
      },
    },
  });
}
let instance: ReturnType<typeof getAuth> | undefined;
export const auth = () => (instance ??= getAuth());
