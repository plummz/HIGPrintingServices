import { route, uuid } from "@/server/security/route";
import { listMembers } from "@/modules/businesses/service";
export const GET = (
  r: Request,
  c: { params: Promise<{ businessId: string }> },
) =>
  route(r, async (u) => listMembers(u.id, uuid((await c.params).businessId)));
