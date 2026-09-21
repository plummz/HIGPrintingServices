import "server-only";
import { z } from "zod";
import { requireUser } from "@/server/auth/session";
import { assertOrigin, endpoint, readJson } from "./http";
import { db } from "@/server/db/client";
import { AppError } from "./errors";
export type User = Awaited<ReturnType<typeof requireUser>>;
export const uuid = (value: string) => z.uuid().parse(value);
export function route(
  request: Request,
  run: (user: User, body: unknown) => Promise<unknown>,
  status = 200,
) {
  return endpoint(async () => {
    const mutation = !["GET", "HEAD"].includes(request.method);
    if (mutation) assertOrigin(request);
    const user = await requireUser(request.headers);
    if (mutation) {
      const key = `app:${user.id}:${Math.floor(Date.now() / 60000)}`;
      const bucket = await db.rateLimit.upsert({
        where: { key },
        create: {
          id: crypto.randomUUID(),
          key,
          count: 1,
          lastRequest: BigInt(Date.now()),
        },
        update: { count: { increment: 1 } },
      });
      if (bucket.count > 30)
        throw new AppError(
          429,
          "RATE_LIMIT",
          "Too many requests. Try again in a minute.",
        );
    }
    return run(user, mutation ? await readJson(request) : undefined);
  }, status);
}
