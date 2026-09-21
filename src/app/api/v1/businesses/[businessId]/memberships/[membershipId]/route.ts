import { route, uuid } from "@/server/security/route";
import { updateMember } from "@/modules/businesses/service";
export const PATCH = (
  r: Request,
  c: { params: Promise<{ businessId: string; membershipId: string }> },
) =>
  route(r, async (u, b) => {
    const p = await c.params;
    return updateMember(u.id, uuid(p.businessId), uuid(p.membershipId), b);
  });
