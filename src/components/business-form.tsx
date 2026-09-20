"use client";
import { useState } from "react";
import { api } from "./api";
type Business = {
  id: string;
  name: string;
  currency: string;
  timeZone: string;
  contact: string;
  address: string;
  hours: string;
  version: number;
};
export function BusinessForm({ business }: { business?: Business }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const f = new FormData(e.currentTarget);
    const data = {
      name: f.get("name"),
      currency: "PHP",
      timeZone: f.get("timeZone"),
      contact: f.get("contact"),
      address: f.get("address"),
      hours: f.get("hours"),
      ...(business ? { expectedVersion: business.version } : {}),
    };
    try {
      const b = await api(
        "/api/v1/businesses" + (business ? "/" + business.id : ""),
        business ? "PATCH" : "POST",
        data,
      );
      window.location.assign("/workspaces/" + b.id);
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save}>
      <div className="form-grid">
        <label>
          Business name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            defaultValue={business?.name}
            placeholder="Your printing business"
          />
        </label>
        <label>
          Time zone
          <input
            name="timeZone"
            required
            defaultValue={business?.timeZone || "Asia/Manila"}
          />
        </label>
        <label>
          Contact details
          <input
            name="contact"
            maxLength={150}
            defaultValue={business?.contact}
          />
        </label>
        <label>
          Business hours
          <input
            name="hours"
            maxLength={300}
            defaultValue={business?.hours}
            placeholder="e.g. Monday–Saturday, 7 AM–6 PM"
          />
        </label>
        <label className="wide">
          Address
          <input
            name="address"
            maxLength={300}
            defaultValue={business?.address}
          />
        </label>
      </div>
      <div className="form-footer">
        <small>Currency: Philippine peso (PHP)</small>
        <button disabled={busy}>
          {busy ? "Saving…" : business ? "Save settings" : "Create workspace →"}
        </button>
      </div>
      <p role="status" className="feedback">
        {message}
      </p>
    </form>
  );
}
