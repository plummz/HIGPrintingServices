"use client";
import { useState } from "react";
import { api } from "./api";
export function Invitations({
  items,
  businessId,
}: {
  items: { id: string; email: string; role: string }[];
  businessId: string;
}) {
  const [message, setMessage] = useState("");
  async function revoke(id: string) {
    if (!confirm("Revoke this invitation?")) return;
    try {
      await api(
        `/api/v1/businesses/${businessId}/invitations/${id}`,
        "DELETE",
        {},
      );
      window.location.reload();
    } catch (e) {
      setMessage((e as Error).message);
    }
  }
  return (
    <section>
      <h3>Pending invitations</h3>
      {items.length === 0 ? (
        <p className="muted">No pending invitations.</p>
      ) : (
        items.map((i) => (
          <div className="member" key={i.id}>
            <div>
              <strong>{i.email}</strong>
              <small>{i.role}</small>
            </div>
            <button className="secondary" onClick={() => revoke(i.id)}>
              Revoke invitation
            </button>
          </div>
        ))
      )}
      <p role="status">{message}</p>
    </section>
  );
}
