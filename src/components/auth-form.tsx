"use client";
import Link from "next/link";
import { useState } from "react";
import { authClient } from "./auth-client";
type Mode = "login" | "register" | "forgot-password" | "reset-password";
export function AuthForm({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const titles = {
    login: "Welcome back",
    register: "Start your workspace",
    "forgot-password": "Reset your password",
    "reset-password": "Choose a new password",
  };
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || ""),
      password = String(form.get("password") || "");
    try {
      if (mode === "login") {
        const r = await authClient.signIn.email({ email, password });
        if (r.error)
          throw new Error(
            "Unable to sign in. Check your details and verify your email.",
          );
        window.location.assign("/workspaces");
      }
      if (mode === "register") {
        const r = await authClient.signUp.email({
          email,
          password,
          name: String(form.get("name")),
          callbackURL: "/login",
        });
        if (r.error)
          throw new Error(
            "Unable to create account. Check your details or try signing in.",
          );
        setMessage("Check your email to verify your account, then sign in.");
      }
      if (mode === "forgot-password") {
        await authClient.requestPasswordReset({
          email,
          redirectTo: "/reset-password",
        });
        setMessage("If this email has an account, a reset link will be sent.");
      }
      if (mode === "reset-password") {
        const token =
          new URLSearchParams(window.location.search).get("token") || "";
        const r = await authClient.resetPassword({
          newPassword: password,
          token,
        });
        if (r.error)
          throw new Error(
            "This reset link is invalid or expired. Request a new one.",
          );
        setMessage("Password updated. You can now sign in.");
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="auth-grid">
      <div className="auth-story">
        <span className="eyebrow">MADE FOR PRINTING BUSINESSES</span>
        <h1>
          A better day
          <br />
          at the print shop.
        </h1>
        <p>One place for your team. A clear starting point for every job.</p>
        <div className="paper-stack">
          <div>
            PRINTFLOW <span>01 / WORKSPACE</span>
            <strong>
              Good work starts
              <br />
              with a clear plan.
            </strong>
            <i>From first idea to final print.</i>
          </div>
        </div>
      </div>
      <div className="auth-panel">
        <Link href="/" className="wordmark">
          ▧ PrintFlow
        </Link>
        <h2>{titles[mode]}</h2>
        <p className="muted">
          {mode === "register"
            ? "Create your account. Set up your business after email verification."
            : "Your account stays with you. Your next print starts here."}
        </p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>
              Your name
              <input name="name" required maxLength={100} autoComplete="name" />
            </label>
          )}
          {mode !== "reset-password" && (
            <label>
              Email address
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
              />
            </label>
          )}
          {mode !== "forgot-password" && (
            <label>
              Password
              <input
                name="password"
                aria-label="Password"
                aria-describedby={
                  mode !== "login" ? "password-hint" : undefined
                }
                type="password"
                required
                minLength={mode === "login" ? 1 : 12}
                maxLength={128}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
              {mode !== "login" && (
                <small id="password-hint">Use at least 12 characters.</small>
              )}
            </label>
          )}
          <button disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "login"
                ? "Sign in →"
                : mode === "register"
                  ? "Create account →"
                  : mode === "forgot-password"
                    ? "Send reset link"
                    : "Update password"}
          </button>
          <p role="status" className="feedback">
            {message}
          </p>
        </form>
        <div className="auth-links">
          {mode === "login" ? (
            <>
              <Link href="/forgot-password">Forgot password?</Link>
              <Link href="/register">Create an account</Link>
            </>
          ) : (
            <Link href="/login">Back to sign in</Link>
          )}
        </div>
      </div>
    </section>
  );
}
