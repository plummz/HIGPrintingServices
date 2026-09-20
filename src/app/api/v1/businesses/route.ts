import { route } from "@/server/security/route";
import { createBusiness, listBusinesses } from "@/modules/businesses/service";
export const GET = (request: Request) =>
  route(request, (user) => listBusinesses(user.id));
export const POST = (request: Request) =>
  route(request, (user, body) => createBusiness(user.id, body), 201);
