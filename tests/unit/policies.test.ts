import { describe, it, expect } from "vitest";
import { can, enforce, type Permission } from "@/server/tenancy/policy";
import {
  businessSchema,
  inviteSchema,
  memberSchema,
  acceptSchema,
} from "@/modules/businesses/schemas";
const actions: Permission[] = [
  "business:read",
  "business:update",
  "members:read",
  "members:manage",
  "audit:read",
];
describe("permission boundaries", () => {
  for (const role of ["OWNER", "ADMIN", "STAFF", "CUSTOMER"])
    it(`${role} cannot act when inactive`, () => {
      for (const action of actions)
        expect(can({ role, active: false, permissions: actions }, action)).toBe(
          false,
        );
    });
  it("owner has full tenant-local rights", () => {
    for (const a of actions)
      expect(can({ role: "OWNER", active: true, permissions: [] }, a)).toBe(
        true,
      );
  });
  it("admin cannot manage memberships even with malicious grant", () => {
    expect(
      can(
        { role: "ADMIN", active: true, permissions: actions },
        "members:manage",
      ),
    ).toBe(false);
  });
  it("admin grants are explicit", () => {
    expect(
      can({ role: "ADMIN", active: true, permissions: [] }, "business:update"),
    ).toBe(false);
    expect(
      can(
        { role: "ADMIN", active: true, permissions: ["business:update"] },
        "business:update",
      ),
    ).toBe(true);
  });
  for (const role of ["STAFF", "CUSTOMER"])
    it(`${role} cannot use injected admin grants`, () => {
      expect(() =>
        enforce({ role, active: true, permissions: actions }, "audit:read"),
      ).toThrow();
    });
});
describe("input boundaries", () => {
  it("rejects mass-assigned business ownership", () => {
    expect(() =>
      businessSchema.parse({ name: "Print Shop", ownerId: "attacker" }),
    ).toThrow();
  });
  it("rejects invalid timezone", () => {
    expect(() =>
      businessSchema.parse({ name: "Print Shop", timeZone: "bogus" }),
    ).toThrow();
  });
  it("rejects owner invitation", () => {
    expect(() =>
      inviteSchema.parse({ email: "a@example.com", role: "OWNER" }),
    ).toThrow();
  });
  it("rejects customer administrative grants", () => {
    expect(() =>
      inviteSchema.parse({
        email: "a@example.com",
        role: "CUSTOMER",
        permissions: ["audit:read"],
      }),
    ).toThrow();
  });
  it("requires version to change membership", () => {
    expect(() =>
      memberSchema.parse({ role: "STAFF", active: true, permissions: [] }),
    ).toThrow();
  });
  it("rejects predictable and malformed invitation tokens", () => {
    for (const token of ["1", "../file", "x".repeat(64)])
      expect(() => acceptSchema.parse({ token })).toThrow();
  });
});
