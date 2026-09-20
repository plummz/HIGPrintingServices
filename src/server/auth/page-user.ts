import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "./session";
import { AppError } from "@/server/security/errors";
export async function pageUser() {
  try {
    return await requireUser(await headers());
  } catch (e) {
    if (e instanceof AppError && e.status === 401) redirect("/login");
    if (e instanceof AppError && e.code === "UNVERIFIED")
      redirect("/verify-email");
    throw e;
  }
}
