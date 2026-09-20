import { route, uuid } from "@/server/security/route";
import { inviteMember } from "@/modules/businesses/service";
export const POST = (
  r: Request,
  c: { params: Promise<{ businessId: string }> },
) =>
  route(
    r,
    async (u, b) => inviteMember(u.id, uuid((await c.params).businessId), b),
    201,
  );
import { listInvitations } from "@/modules/businesses/service";
export const GET = (
  r: Request,
  c: { params: Promise<{ businessId: string }> },
) =>
  route(r, async (u) =>
    listInvitations(u.id, uuid((await c.params).businessId)),
  );
