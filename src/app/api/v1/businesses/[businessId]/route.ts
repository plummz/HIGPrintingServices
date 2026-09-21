import { route, uuid } from "@/server/security/route";
import { readBusiness, updateBusiness } from "@/modules/businesses/service";
type Context = { params: Promise<{ businessId: string }> };
export const GET = (r: Request, c: Context) =>
  route(r, async (u) => readBusiness(u.id, uuid((await c.params).businessId)));
export const PATCH = (r: Request, c: Context) =>
  route(r, async (u, b) =>
    updateBusiness(u.id, uuid((await c.params).businessId), b),
  );
