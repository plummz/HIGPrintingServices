import { route, uuid } from "@/server/security/route";
import { revokeInvitation } from "@/modules/businesses/service";
export const DELETE = (
  r: Request,
  c: { params: Promise<{ businessId: string; invitationId: string }> },
) =>
  route(r, async (u) => {
    const p = await c.params;
    return revokeInvitation(u.id, uuid(p.businessId), uuid(p.invitationId));
  });
