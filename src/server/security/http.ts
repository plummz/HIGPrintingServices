import "server-only";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "./errors";
export function assertOrigin(request: Request) {
  const expected = new URL(process.env.BETTER_AUTH_URL!).origin;
  if (request.headers.get("origin") !== expected)
    throw new AppError(403, "BAD_ORIGIN", "Request origin is not allowed.");
}
export async function readJson(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError(415, "JSON_REQUIRED", "Use JSON.");
  const reader = request.body?.getReader();
  if (!reader)
    throw new AppError(400, "BODY_REQUIRED", "Request body required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 16384) {
      await reader.cancel();
      throw new AppError(413, "BODY_TOO_LARGE", "Request is too large.");
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError(400, "INVALID_JSON", "Invalid JSON.");
  }
}
export async function endpoint(run: () => Promise<unknown>, status = 200) {
  try {
    return Response.json(
      { data: await run() },
      { status, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    const id = crypto.randomUUID();
    let problem =
      error instanceof AppError
        ? error
        : new AppError(500, "INTERNAL", "Something went wrong. Please retry.");
    if (error instanceof ZodError)
      problem = new AppError(400, "VALIDATION", "Check the submitted fields.");
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    )
      problem = new AppError(
        409,
        "CONFLICT",
        "This record changed or already exists. Refresh and retry.",
      );
    if (problem.status === 500)
      console.error("Request failed", { requestId: id });
    return Response.json(
      {
        error: { code: problem.code, message: problem.message, requestId: id },
      },
      {
        status: problem.status,
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }
}
