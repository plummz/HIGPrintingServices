import { auth } from "@/server/auth/config";
import { assertOrigin, readJson } from "@/server/security/http";
import { AppError } from "@/server/security/errors";
import { db } from "@/server/db/client";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handler(request: Request) {
  try {
    if (request.method === "POST") {
      assertOrigin(request);
      const body = await readJson(request);
      request = new Request(request.url, {
        method: "POST",
        headers: request.headers,
        body: JSON.stringify(body),
      });
    }
    const response = await auth().handler(request);
    response.headers.set("Cache-Control", "private, no-store");
    if (response.status >= 400) {
      await db.securityEvent.create({
        data: { action: "AUTH_REQUEST_DENIED" },
      });
    }
    return response;
  } catch (error) {
    const status = error instanceof AppError ? error.status : 503;
    return Response.json(
      {
        message:
          status === 503
            ? "Authentication is temporarily unavailable."
            : "Request not allowed.",
      },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
export { handler as GET, handler as POST };
