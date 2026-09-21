"use client";
import { authClient } from "./auth-client";
export function SignOut() {
  return (
    <button
      className="secondary"
      onClick={async () => {
        const r = await authClient.signOut();
        if (!r.error) window.location.assign("/login");
      }}
    >
      Sign out
    </button>
  );
}
