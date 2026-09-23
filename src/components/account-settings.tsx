"use client";
import { useState } from "react";
import { api } from "./api";
export function AccountSettings() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  async function remove(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      await api("/api/v1/account", "DELETE", {
        password: data.get("password"),
        confirmation: data.get("confirmation"),
      });
      window.location.assign("/login?deleted=1");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="panel account-danger">
      <span className="eyebrow">YOU’RE IN CONTROL</span>
      <h2>Delete your profile</h2>
      <p>
        This permanently removes your profile, password credentials, sessions,
        and workspace memberships. Your team’s business records remain. Business
        history will show a deleted user.
      </p>
      <p>
        If you’re a workspace’s last active owner, add another owner in Team &
        access first.
      </p>
      {!open ? (
        <button className="secondary" onClick={() => setOpen(true)}>
          Delete my profile…
        </button>
      ) : (
        <form onSubmit={remove}>
          <label>
            Current password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </label>
          <label>
            Type DELETE to confirm
            <input
              name="confirmation"
              autoComplete="off"
              required
              pattern="DELETE"
            />
          </label>
          <div className="inline-actions">
            <button disabled={busy} type="submit">
              {busy ? "Deleting…" : "Permanently delete my profile"}
            </button>
            <button
              className="secondary"
              type="button"
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
          <p role="status" className="feedback">
            {message}
          </p>
        </form>
      )}
    </section>
  );
}
