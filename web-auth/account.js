import { createClient } from "@supabase/supabase-js";
const $ = (id) => document.getElementById(id);
const status = $("status");
const config = window.HIGP_CONFIG || {};
let client;
let recovery = false;
let user;
const redirectTo = new URL("account.html", location.href).href.split("?")[0];
function message(text) {
  status.textContent = text;
}
function view(mode) {
  document.querySelectorAll("[data-panel]").forEach((el) => {
    el.hidden = el.dataset.panel !== mode;
  });
  $("title").textContent =
    {
      login: "Welcome back.",
      register: "Make it yours.",
      forgot: "Reset your password.",
      password: "Choose a new password.",
      profile: "Your account.",
    }[mode] || "Your account.";
}
function render(next) {
  user = next;
  if (user) {
    $("email-label").textContent = user.email;
    view(recovery ? "password" : "profile");
  } else
    view(
      new URLSearchParams(location.search).get("mode") === "register"
        ? "register"
        : "login",
    );
}
async function run(form, action) {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((b) => {
    b.disabled = true;
  });
  message("Please wait…");
  try {
    await action(new FormData(form));
  } catch (error) {
    message(error.message || "Unable to connect. Please try again.");
  } finally {
    buttons.forEach((b) => {
      b.disabled = false;
    });
    form.querySelectorAll("input[type=password]").forEach((i) => {
      i.value = "";
    });
  }
}
try {
  const url = new URL(config.supabaseUrl);
  const key = config.supabasePublishableKey;
  if (
    url.protocol !== "https:" ||
    !/^[a-z0-9]+\.supabase\.co$/.test(url.hostname) ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.username ||
    url.password ||
    typeof key !== "string"
  )
    throw Error("Not configured");
  // Only public publishable/legacy anon keys belong in the browser.
  if (!key.startsWith("sb_publishable_")) {
    const payload = JSON.parse(
      atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (payload.role !== "anon") throw Error("Not a public key");
  }
  client = createClient(url.origin, key, {
    auth: {
      flowType: "pkce",
      storage: localStorage,
      persistSession: true,
      detectSessionInUrl: true,
      autoRefreshToken: true,
    },
  });
  client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") recovery = true;
    if (event === "SIGNED_OUT") recovery = false;
    render(session?.user);
  });
  const { data, error } = await client.auth.getUser();
  if (error && !error.message.includes("Auth session missing"))
    message("Please sign in again, or request a fresh email link.");
  else message("");
  render(data.user);
  $("ready").hidden = false;
  $("setup").hidden = true;
} catch {
  message("Online accounts are being connected. Please check back soon.");
}
document.querySelectorAll("[data-view]").forEach((button) =>
  button.addEventListener("click", () => {
    message("");
    view(button.dataset.view);
  }),
);
for (const form of document.forms)
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!client) return;
    run(form, async (fields) => {
      const email = String(fields.get("email") || "").trim();
      const password = String(fields.get("password") || "");
      let result;
      switch (form.id) {
        case "login":
          result = await client.auth.signInWithPassword({ email, password });
          if (result.error)
            throw Error(
              "Sign-in failed. Check your details and confirm your email.",
            );
          message("Signed in.");
          break;
        case "register":
          result = await client.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: redirectTo,
              data: { display_name: String(fields.get("name")).trim() },
            },
          });
          if (result.error) throw result.error;
          message(
            "Check your email for the next step. Open the link in this browser.",
          );
          break;
        case "forgot":
          result = await client.auth.resetPasswordForEmail(email, {
            redirectTo,
          });
          if (result.error) throw result.error;
          message(
            "If an account matches, a reset link will arrive by email. Open it in this browser.",
          );
          break;
        case "password":
          result = await client.auth.updateUser({ password });
          if (result.error) throw result.error;
          recovery = false;
          view("profile");
          message("Password updated.");
          break;
        case "delete": {
          if (fields.get("confirmation") !== "DELETE")
            throw Error("Type DELETE to confirm.");
          result = await client.functions.invoke("delete-account", {
            body: { password, confirmation: "DELETE" },
          });
          if (result.error || result.data?.deleted !== true)
            throw Error("Deletion failed. Check your password and try again.");
          await client.auth.signOut({ scope: "local" });
          render(null);
          message("Your account has been deleted.");
          break;
        }
      }
    });
  });
$("logout").addEventListener("click", () =>
  run($("login"), async () => {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    render(null);
    message("Signed out. Your account remains saved.");
  }),
);
