import { createClient } from "npm:@supabase/supabase-js@2.117.1";
const origin = "https://plummz.github.io";
Deno.serve(async (request: Request) => {
  const cors = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
  const reply = (status: number, body: object) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  if (request.headers.get("origin") !== origin)
    return reply(403, { error: "Forbidden" });
  if (request.method === "OPTIONS")
    return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST")
    return reply(405, { error: "Method not allowed" });
  try {
    const token = request.headers
      .get("authorization")
      ?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return reply(401, { error: "Unauthorized" });
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_ANON_KEY")!;
    const auth = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error,
    } = await auth.auth.getUser(token);
    if (error || !user?.email || !user.email_confirmed_at)
      return reply(401, { error: "Unauthorized" });
    const raw = await request.text();
    if (raw.length > 2048) return reply(413, { error: "Request too large" });
    const body = JSON.parse(raw);
    if (
      Object.keys(body).some(
        (k) => !["password", "confirmation"].includes(k),
      ) ||
      body.confirmation !== "DELETE" ||
      typeof body.password !== "string" ||
      !body.password ||
      body.password.length > 128
    )
      return reply(400, { error: "Invalid confirmation" });
    // Supabase Auth applies its password sign-in rate limits to reauthentication.
    const verified = await auth.auth.signInWithPassword({
      email: user.email,
      password: body.password,
    });
    if (verified.error || verified.data.user?.id !== user.id)
      return reply(403, { error: "Unable to verify" });
    await auth.auth.signOut();
    const admin = createClient(
      url,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const deleted = await admin.auth.admin.deleteUser(user.id);
    if (deleted.error) return reply(500, { error: "Unable to delete account" });
    return reply(200, { deleted: true });
  } catch {
    return reply(400, { error: "Unable to process request" });
  }
});
