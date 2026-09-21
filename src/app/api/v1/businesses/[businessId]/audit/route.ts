import { route, uuid } from "@/server/security/route";
import { listAudit } from "@/modules/businesses/service";
export const GET = (
  r: Request,
  c: { params: Promise<{ businessId: string }> },
) => route(r, async (u) => listAudit(u.id, uuid((await c.params).businessId)));
