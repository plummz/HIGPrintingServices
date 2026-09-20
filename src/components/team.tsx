"use client";
import { useState } from "react";
import { api } from "./api";
import { permissions } from "@/modules/businesses/schemas";
type Member = {
  id: string;
  role: string;
  active: boolean;
  permissions: string[];
  version: number;
  user: { name: string; email: string };
};
function MemberRow({
  member,
  businessId,
  manage,
}: {
  member: Member;
  businessId: string;
  manage: boolean;
}) {
  const [role, setRole] = useState(member.role),
    [active, setActive] = useState(member.active),
    [grants, setGrants] = useState(member.permissions),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function save() {
    if (!confirm("Apply these access changes?")) return;
    setBusy(true);
    try {
      await api(
        `/api/v1/businesses/${businessId}/memberships/${member.id}`,
        "PATCH",
        {
          role,
          active,
          permissions: role === "ADMIN" ? grants : [],
          expectedVersion: member.version,
        },
      );
      window.location.reload();
    } catch (e) {
      setMessage((e as Error).message);
      setBusy(false);
    }
  }
  return (
    <div className="member">
      <div>
        <strong>{member.user.name}</strong>
        <small>{member.user.email}</small>
      </div>
      {manage ? (
        <>
          <select
            aria-label={`Role for ${member.user.name}`}
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            {["OWNER", "ADMIN", "STAFF", "CUSTOMER"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <label className="check">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            Active
          </label>
          {role === "ADMIN" && (
            <fieldset>
              <legend>Admin permissions</legend>
              {permissions.map((p) => (
                <label className="check" key={p}>
                  <input
                    type="checkbox"
                    checked={grants.includes(p)}
                    onChange={(e) =>
                      setGrants(
                        e.target.checked
                          ? [...grants, p]
                          : grants.filter((v) => v !== p),
                      )
                    }
                  />
                  {p}
                </label>
              ))}
            </fieldset>
          )}
          <button className="secondary" disabled={busy} onClick={save}>
            Save access
          </button>
        </>
      ) : (
        <span className="badge">
          {member.role} · {member.active ? "Active" : "Inactive"}
        </span>
      )}
      <p role="status">{message}</p>
    </div>
  );
}
export function Team({
  members,
  businessId,
  manage,
}: {
  members: Member[];
  businessId: string;
  manage: boolean;
}) {
  const [message, setMessage] = useState(""),
    [url, setUrl] = useState(""),
    [busy, setBusy] = useState(false);
  async function invite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setUrl("");
    const f = new FormData(e.currentTarget);
    try {
      const r = await api(
        `/api/v1/businesses/${businessId}/invitations`,
        "POST",
        { email: f.get("email"), role: f.get("role"), permissions: [] },
      );
      setUrl(r.url);
      setMessage(
        "Invitation created. Share this link privately with the invited person. It expires in 48 hours.",
      );
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div>
        {members.map((m) => (
          <MemberRow
            key={m.id}
            member={m}
            businessId={businessId}
            manage={manage}
          />
        ))}
      </div>
      {manage && (
        <form onSubmit={invite} className="invite-form">
          <h3>Invite someone</h3>
          <div className="form-grid">
            <label>
              Email
              <input name="email" type="email" required />
            </label>
            <label>
              Role
              <select name="role" defaultValue="STAFF">
                <option>ADMIN</option>
                <option>STAFF</option>
                <option>CUSTOMER</option>
              </select>
            </label>
          </div>
          <p className="muted">
            New admins have no extra permissions until you grant them. Invitees
            must verify this email address.
          </p>
          <button disabled={busy}>
            {busy ? "Creating…" : "Create invitation link"}
          </button>
          <p role="status">{message}</p>
          {url && (
            <label>
              Private invitation link
              <input readOnly value={url} onFocus={(e) => e.target.select()} />
            </label>
          )}
        </form>
      )}
    </>
  );
}
