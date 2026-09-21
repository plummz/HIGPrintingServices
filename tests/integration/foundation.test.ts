import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { config } from "dotenv";
import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
config({ quiet: true });
const url = process.env.TEST_DATABASE_URL;
if (!url)
  throw new Error(
    "TEST_DATABASE_URL is required. Use a dedicated test database.",
  );
const parsed = new URL(url);
if (
  !parsed.pathname.endsWith("_test") &&
  !(parsed.hostname === "127.0.0.1" && parsed.port === "54329")
)
  throw new Error("Refusing tests outside a dedicated test database.");
process.env.DATABASE_URL = url;
process.env.MAIL_TRANSPORT = "file";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.BETTER_AUTH_SECRET = "test-only-" + randomUUID() + randomUUID();
const { db } = await import("@/server/db/client");
const { auth } = await import("@/server/auth/config");
const svc = await import("@/modules/businesses/service");
const { requireUser } = await import("@/server/auth/session");
const { POST: createRoute } = await import("@/app/api/v1/businesses/route");
const { GET: readRoute, PATCH: updateRoute } =
  await import("@/app/api/v1/businesses/[businessId]/route");
const password = "Correct-printflow-test-password-492!";
const emails: string[] = [];
const users: { id: string; email: string }[] = [];
const businesses: string[] = [];
let owner: { id: string; email: string },
  other: { id: string; email: string },
  staff: { id: string; email: string },
  customer: { id: string; email: string },
  admin: { id: string; email: string };
let a: string, b: string;
async function fixture(prefix: string) {
  const email = `${prefix}-${randomUUID()}@example.test`;
  emails.push(email);
  const result = await auth().api.signUpEmail({
    body: { email, password, name: prefix },
  });
  await db.user.update({
    where: { id: result.user.id },
    data: { emailVerified: true },
  });
  const u = { id: result.user.id, email };
  users.push(u);
  return u;
}
let requestNumber = 1;
function request(
  path: string,
  body?: unknown,
  cookie = "",
  origin = "http://localhost:3000",
) {
  return new Request("http://localhost:3000" + path, {
    method: body ? "POST" : "GET",
    headers: {
      "content-type": "application/json",
      "x-real-ip": `192.0.2.${requestNumber++}`,
      origin,
      cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function signIn(email: string, pass = password) {
  return auth().handler(
    request("/api/auth/sign-in/email", { email, password: pass }),
  );
}
function cookies(r: Response) {
  return r.headers
    .getSetCookie()
    .map((s) => s.split(";")[0])
    .join("; ");
}
async function mailFor(email: string, subject: string) {
  for (const file of (await readdir(".local/mail")).reverse()) {
    const item = JSON.parse(await readFile(".local/mail/" + file, "utf8"));
    if (item.to === email && item.subject.includes(subject))
      return item.url as string;
  }
  throw new Error("Mail not delivered");
}
beforeAll(async () => {
  owner = await fixture("owner");
  other = await fixture("other");
  staff = await fixture("staff");
  customer = await fixture("customer");
  admin = await fixture("admin");
  a = (await svc.createBusiness(owner.id, { name: "Tenant A" })).id;
  b = (await svc.createBusiness(other.id, { name: "Tenant B" })).id;
  businesses.push(a, b);
  for (const [user, role] of [
    [staff, "STAFF"],
    [customer, "CUSTOMER"],
    [admin, "ADMIN"],
  ] as const) {
    const invite = await svc.inviteMember(owner.id, a, {
      email: user.email,
      role,
    });
    await svc.acceptInvitation(user, { token: invite.url.split("#")[1] });
  }
});
afterAll(async () => {
  for (const businessId of businesses) {
    await db.auditEvent.deleteMany({ where: { businessId } });
    await db.invitation.deleteMany({ where: { businessId } });
    await db.membership.deleteMany({ where: { businessId } });
    await db.business.delete({ where: { id: businessId } });
  }
  await db.securityEvent.deleteMany({
    where: { userId: { in: users.map((u) => u.id) } },
  });
  await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
  await db.$disconnect();
});
describe("tenant and role integration", () => {
  it("denies foreign tenant reads and updates", async () => {
    await expect(svc.readBusiness(owner.id, b)).rejects.toMatchObject({
      status: 404,
    });
    await expect(
      svc.updateBusiness(owner.id, b, { name: "Hijacked", expectedVersion: 1 }),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("does not list foreign business", async () => {
    expect(
      (await svc.listBusinesses(owner.id)).map((m) => m.business.id),
    ).toEqual([a]);
  });
  it("denies customer member and audit access", async () => {
    await expect(svc.listMembers(customer.id, a)).rejects.toMatchObject({
      status: 403,
    });
    await expect(svc.listAudit(customer.id, a)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("denies staff settings and invitations", async () => {
    await expect(
      svc.updateBusiness(staff.id, a, { name: "Changed", expectedVersion: 1 }),
    ).rejects.toMatchObject({ status: 403 });
    await expect(
      svc.inviteMember(staff.id, a, { email: "x@example.test", role: "ADMIN" }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("enforces explicit admin permissions", async () => {
    await expect(svc.listAudit(admin.id, a)).rejects.toMatchObject({
      status: 403,
    });
    const m = await db.membership.findUniqueOrThrow({
      where: { businessId_userId: { businessId: a, userId: admin.id } },
    });
    await svc.updateMember(owner.id, a, m.id, {
      role: "ADMIN",
      active: true,
      permissions: ["audit:read"],
      expectedVersion: m.version,
    });
    expect((await svc.listAudit(admin.id, a)).length).toBeGreaterThan(0);
    await expect(
      svc.inviteMember(admin.id, a, { email: "x@example.test", role: "STAFF" }),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("protects the last owner", async () => {
    const m = await db.membership.findUniqueOrThrow({
      where: { businessId_userId: { businessId: a, userId: owner.id } },
    });
    await expect(
      svc.updateMember(owner.id, a, m.id, {
        role: "STAFF",
        active: true,
        permissions: [],
        expectedVersion: m.version,
      }),
    ).rejects.toMatchObject({ code: "LAST_OWNER" });
  });
  it("revocation immediately removes access even with valid session", async () => {
    const signed = await signIn(staff.email);
    expect(signed.status).toBe(200);
    const header = new Headers({ cookie: cookies(signed) });
    const m = await db.membership.findUniqueOrThrow({
      where: { businessId_userId: { businessId: a, userId: staff.id } },
    });
    await svc.updateMember(owner.id, a, m.id, {
      role: "STAFF",
      active: false,
      permissions: [],
      expectedVersion: m.version,
    });
    const u = await requireUser(header);
    await expect(svc.readBusiness(u.id, a)).rejects.toMatchObject({
      status: 404,
    });
  });
  it("rejects stale settings and records only successful changes", async () => {
    const initial = await svc.readBusiness(owner.id, a);
    await svc.updateBusiness(owner.id, a, {
      name: "Updated tenant A",
      expectedVersion: initial.business.version,
    });
    await expect(
      svc.updateBusiness(owner.id, a, {
        name: "Stale",
        expectedVersion: initial.business.version,
      }),
    ).rejects.toMatchObject({ code: "STALE" });
    expect(
      await db.auditEvent.count({
        where: { businessId: a, action: "BUSINESS_UPDATED" },
      }),
    ).toBe(1);
  });
  it("composite FK rejects an invitation linked to another tenant member", async () => {
    const m = await db.membership.findUniqueOrThrow({
      where: { businessId_userId: { businessId: b, userId: other.id } },
    });
    await expect(
      db.invitation.create({
        data: {
          businessId: a,
          invitedById: m.id,
          email: "x@example.test",
          role: "STAFF",
          tokenHash: randomUUID(),
          expiresAt: new Date(Date.now() + 10000),
        },
      }),
    ).rejects.toThrow();
    await db.$disconnect();
  });
  it("checks matching email, expiry and one-time acceptance", async () => {
    const invite = await svc.inviteMember(owner.id, a, {
      email: other.email,
      role: "STAFF",
    });
    const token = invite.url.split("#")[1];
    await expect(
      svc.acceptInvitation(customer, { token }),
    ).rejects.toMatchObject({ status: 404 });
    await db.invitation.update({
      where: { id: invite.id },
      data: { expiresAt: new Date(0) },
    });
    await expect(svc.acceptInvitation(other, { token })).rejects.toMatchObject({
      status: 404,
    });
    const fresh = await svc.inviteMember(owner.id, a, {
      email: other.email,
      role: "STAFF",
    });
    await svc.acceptInvitation(other, { token: fresh.url.split("#")[1] });
    await expect(
      svc.acceptInvitation(other, { token: fresh.url.split("#")[1] }),
    ).rejects.toMatchObject({ status: 404 });
    expect(
      await db.invitation.findUnique({ where: { id: fresh.id } }),
    ).not.toHaveProperty("token");
  });
  it("revokes invitations without changing memberships", async () => {
    const invite = await svc.inviteMember(owner.id, a, {
      email: "revoked@example.test",
      role: "STAFF",
    });
    await svc.revokeInvitation(owner.id, a, invite.id);
    expect(
      (await svc.listInvitations(owner.id, a)).some((i) => i.id === invite.id),
    ).toBe(false);
    await expect(
      svc.acceptInvitation(
        { id: other.id, email: "revoked@example.test" },
        { token: invite.url.split("#")[1] },
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("serializes competing owner demotions", async () => {
    const om = await db.membership.findUniqueOrThrow({
      where: { businessId_userId: { businessId: a, userId: other.id } },
    });
    await svc.updateMember(owner.id, a, om.id, {
      role: "OWNER",
      active: true,
      permissions: [],
      expectedVersion: om.version,
    });
    const m1 = await db.membership.findUniqueOrThrow({
      where: { businessId_userId: { businessId: a, userId: owner.id } },
    });
    const m2 = await db.membership.findUniqueOrThrow({
      where: { businessId_userId: { businessId: a, userId: other.id } },
    });
    const results = await Promise.allSettled([
      svc.updateMember(owner.id, a, m1.id, {
        role: "ADMIN",
        active: true,
        permissions: [],
        expectedVersion: m1.version,
      }),
      svc.updateMember(other.id, a, m2.id, {
        role: "ADMIN",
        active: true,
        permissions: [],
        expectedVersion: m2.version,
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(
      await db.membership.count({
        where: { businessId: a, role: "OWNER", active: true },
      }),
    ).toBe(1);
  });
});
describe("HTTP and authentication", () => {
  it("rejects missing session, foreign tenant and forged origin", async () => {
    expect(
      (
        await readRoute(request("/api/v1/businesses/" + b), {
          params: Promise.resolve({ businessId: b }),
        })
      ).status,
    ).toBe(401);
    const login = await signIn(customer.email);
    const cookie = cookies(login);
    expect(
      (
        await readRoute(request("/api/v1/businesses/" + b, undefined, cookie), {
          params: Promise.resolve({ businessId: b }),
        })
      ).status,
    ).toBe(404);
    expect(
      (
        await createRoute(
          request(
            "/api/v1/businesses",
            { name: "Forged" },
            cookie,
            "https://evil.test",
          ),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await updateRoute(
          new Request("http://localhost:3000/api/v1/businesses/" + a, {
            method: "PATCH",
            headers: {
              origin: "http://localhost:3000",
              cookie,
              "content-type": "application/json",
            },
            body: JSON.stringify({ name: "Unauthorized", expectedVersion: 2 }),
          }),
          { params: Promise.resolve({ businessId: a }) },
        )
      ).status,
    ).toBe(403);
  });
  it("rejects wrong password and invalidates signed-out sessions", async () => {
    expect((await signIn(customer.email, "not-the-password")).status).toBe(401);
    const response = await signIn(customer.email);
    expect(response.status).toBe(200);
    const cookie = cookies(response);
    expect((await requireUser(new Headers({ cookie }))).id).toBe(customer.id);
    const out = await auth().handler(request("/api/auth/sign-out", {}, cookie));
    expect(out.status).toBe(200);
    await expect(requireUser(new Headers({ cookie }))).rejects.toMatchObject({
      status: 401,
    });
  });
  it("requires email verification and supports reset with session revocation", async () => {
    const email = `verify-${randomUUID()}@example.test`;
    emails.push(email);
    const signup = await auth().api.signUpEmail({
      body: { email, password, name: "Verification Test" },
    });
    const user = { id: signup.user.id, email };
    users.push(user);
    expect((await signIn(email)).status).toBe(403);
    const verifyUrl = await mailFor(email, "Verify");
    const verified = await auth().handler(new Request(verifyUrl));
    expect(verified.status).toBeLessThan(400);
    const login = await signIn(email);
    expect(login.status).toBe(200);
    const cookie = cookies(login);
    await auth().api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
    });
    const resetUrl = await mailFor(email, "Reset");
    const token = new URL(resetUrl).pathname.split("/").at(-1)!;
    const reset = await auth().api.resetPassword({
      body: { token, newPassword: password + "new" },
    });
    expect(reset.status).toBe(true);
    await expect(requireUser(new Headers({ cookie }))).rejects.toMatchObject({
      status: 401,
    });
    await expect(
      auth().api.resetPassword({
        body: { token, newPassword: password + "again" },
      }),
    ).rejects.toThrow();
    expect((await signIn(email, password + "new")).status).toBe(200);
  });
});

describe("abuse protection", () => {
  it("rate limits repeated failed sign-in attempts", async () => {
    const statuses = [];
    for (let i = 0; i < 7; i++) {
      const req = request("/api/auth/sign-in/email", {
        email: "unknown@example.test",
        password: "wrong-password-value",
      });
      req.headers.set("x-real-ip", "198.51.100.200");
      statuses.push((await auth().handler(req)).status);
    }
    expect(statuses).toContain(429);
  });
});
