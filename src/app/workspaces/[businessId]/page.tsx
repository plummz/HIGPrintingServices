import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { pageUser } from "@/server/auth/page-user";
import {
  readBusiness,
  listMembers,
  listAudit,
  listInvitations,
} from "@/modules/businesses/service";
import { can } from "@/server/tenancy/policy";
import { AppError } from "@/server/security/errors";
import { BusinessForm } from "@/components/business-form";
import { Team } from "@/components/team";
import { Invitations } from "@/components/invitations";
import { SignOut } from "@/components/sign-out";
export default async function Page({
  params,
}: {
  params: Promise<{ businessId: string }>;
}) {
  const user = await pageUser();
  const { businessId } = await params;
  if (!z.uuid().safeParse(businessId).success) notFound();
  let workspace;
  try {
    workspace = await readBusiness(user.id, businessId);
  } catch (e) {
    if (e instanceof AppError && e.status === 404) notFound();
    throw e;
  }
  const { business, membership } = workspace;
  const members = can(membership, "members:read")
    ? await listMembers(user.id, businessId)
    : null;
  const invitations = can(membership, "members:manage")
    ? await listInvitations(user.id, businessId)
    : null;
  const events = can(membership, "audit:read")
    ? await listAudit(user.id, businessId)
    : null;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="wordmark" href="/workspaces">
          ▧ PrintFlow
        </Link>
        <div className="sidebar-business">
          <span className="business-icon">{business.name.slice(0, 1)}</span>
          <strong>{business.name}</strong>
          <small>{membership.role}</small>
        </div>
        <nav>
          <a href="#overview">◫ Overview</a>
          {can(membership, "business:update") && (
            <a href="#settings">⚙ Business settings</a>
          )}
          {members && <a href="#team">♧ Team & access</a>}
          {events && <a href="#activity">↺ Activity</a>}
          <Link href="/workspaces">↔ Switch workspace</Link>
        </nav>
        <div className="sidebar-bottom">
          <span>{user.name}</span>
          <SignOut />
        </div>
      </aside>
      <main className="workspace-main">
        <header id="overview" className="page-heading">
          <div>
            <span className="eyebrow">WORKSPACE OVERVIEW</span>
            <h1>{business.name}</h1>
            <p className="muted">
              A shared space. The right access for every person.
            </p>
          </div>
          <span className="badge green">Workspace active</span>
        </header>
        <section className="welcome-banner">
          <div>
            <span className="eyebrow">LET’S GET YOU SET UP</span>
            <h2>
              Good work starts
              <br />
              with your people.
            </h2>
            <p>
              Keep your business details up to date and give your team the
              access they need.
            </p>
          </div>
          <div className="banner-mark" aria-hidden="true">
            ▧
          </div>
        </section>
        <div className="summary-grid">
          <article className="panel compact">
            <span className="eyebrow">YOUR ROLE</span>
            <h2>{membership.role}</h2>
            <p>Permissions are checked for every request.</p>
          </article>
          <article className="panel compact">
            <span className="eyebrow">BUSINESS TIME</span>
            <h2>{business.timeZone}</h2>
            <p>{business.currency} · Philippine peso</p>
          </article>
        </div>
        {can(membership, "business:update") ? (
          <section id="settings" className="panel">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE DETAILS</span>
                <h2>Business settings</h2>
              </div>
            </div>
            <BusinessForm business={business} />
          </section>
        ) : (
          <section className="panel">
            <h2>Business information</h2>
            <p>{business.contact || "No contact details added."}</p>
            <p>{business.address}</p>
            <p>{business.hours}</p>
          </section>
        )}
        {members && (
          <section id="team" className="panel">
            <span className="eyebrow">YOUR PEOPLE</span>
            <h2>Team & access</h2>
            <Team
              members={members}
              businessId={businessId}
              manage={can(membership, "members:manage")}
            />
            {invitations && (
              <Invitations items={invitations} businessId={businessId} />
            )}
          </section>
        )}
        {events && (
          <section id="activity" className="panel">
            <span className="eyebrow">WORKSPACE HISTORY</span>
            <h2>Recent activity</h2>
            <ul className="activity-list">
              {events.map((e) => (
                <li key={e.id}>
                  <span>{e.action.toLowerCase().replaceAll("_", " ")}</span>
                  <time>
                    {new Intl.DateTimeFormat("en-PH", {
                      timeZone: business.timeZone,
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(e.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          </section>
        )}
        <footer className="muted">
          PrintFlow foundation · Orders and production tools will arrive in the
          next modules.
        </footer>
      </main>
    </div>
  );
}
