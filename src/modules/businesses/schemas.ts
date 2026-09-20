import { z } from "zod";
export const permissions = [
  "business:update",
  "members:read",
  "audit:read",
] as const;
export const roleSchema = z.enum(["OWNER", "ADMIN", "STAFF", "CUSTOMER"]);
export const businessSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    currency: z.literal("PHP").default("PHP"),
    timeZone: z
      .string()
      .max(80)
      .refine((v) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: v });
          return true;
        } catch {
          return false;
        }
      }, "Invalid time zone")
      .default("Asia/Manila"),
    contact: z.string().trim().max(150).default(""),
    address: z.string().trim().max(300).default(""),
    hours: z.string().trim().max(300).default(""),
  })
  .strict();
export const updateBusinessSchema = businessSchema.extend({
  expectedVersion: z.number().int().positive(),
});
export const inviteSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((v) => v.toLowerCase()),
    role: z.enum(["ADMIN", "STAFF", "CUSTOMER"]),
    permissions: z.array(z.enum(permissions)).max(3).default([]),
  })
  .strict()
  .refine(
    (v) => v.role === "ADMIN" || v.permissions.length === 0,
    "Only admins can receive these administrative grants",
  );
export const memberSchema = z
  .object({
    role: roleSchema,
    active: z.boolean(),
    permissions: z.array(z.enum(permissions)).max(3),
    expectedVersion: z.number().int().positive(),
  })
  .strict()
  .refine(
    (v) => ["ADMIN", "OWNER"].includes(v.role) || v.permissions.length === 0,
    "Administrative grants require admin role",
  );
export const acceptSchema = z
  .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
  .strict();
