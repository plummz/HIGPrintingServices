"use client";
import Link from "next/link";
import { useState } from "react";
import { api } from "@/components/api";
export default function Join() {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function accept() {
    setBusy(true);
    try {
      const token = window.location.hash.slice(1);
      const r = await api("/api/v1/invitations/accept", "POST", { token });
      history.replaceState(null, "", "/join");
      window.location.assign("/workspaces/" + r.businessId);
    } catch (e) {
      setMessage((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <main className="container">
      <div className="panel">
        <span className="wordmark">▧ PrintFlow</span>
        <h1>You’re invited.</h1>
        <p>
          Sign in with the verified email address your workspace owner invited,
          then return to this link to join.
        </p>
        <div className="inline-actions">
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create account</Link>
          <button disabled={busy} onClick={accept}>
            {busy ? "Joining…" : "Accept invitation"}
          </button>
        </div>
        <p role="status">{message}</p>
      </div>
    </main>
  );
}
