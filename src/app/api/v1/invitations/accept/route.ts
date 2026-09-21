import { route } from "@/server/security/route";
import { acceptInvitation } from "@/modules/businesses/service";
export const POST = (r: Request) => route(r, (u, b) => acceptInvitation(u, b));
