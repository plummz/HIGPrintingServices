import { route } from "@/server/security/route";
import { deleteOwnAccount } from "@/modules/account/service";
export const runtime = "nodejs";
export async function DELETE(request: Request) {
  return route(request, (user, body) => deleteOwnAccount(user.id, body));
}
