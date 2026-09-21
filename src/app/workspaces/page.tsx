import Link from "next/link";
import { pageUser } from "@/server/auth/page-user";
import { listBusinesses } from "@/modules/businesses/service";
import { BusinessForm } from "@/components/business-form";
import { SignOut } from "@/components/sign-out";
export default async function Page() {
  const user = await pageUser();
  const memberships = await listBusinesses(user.id);
  return (
    <>
      <header className="topbar">
        <Link href="/workspaces" className="wordmark">
          ▧ PrintFlow
        </Link>
        <div className="top-actions">
          <span>{user.name}</span>
          <SignOut />
        </div>
      </header>
      <main className="container">
        <span className="eyebrow">YOUR WORKSPACES</span>
        <h1>Make room for good work.</h1>
        <p className="lead">
          Choose a business, or set up a new printing workspace.
        </p>
        <div className="workspace-grid">
          {memberships.map(({ business, role }) => (
            <Link
              className="workspace-card"
              key={business.id}
              href={"/workspaces/" + business.id}
            >
              <span className="business-icon">{business.name.slice(0, 1)}</span>
              <span className="badge">{role}</span>
              <h2>{business.name}</h2>
              <p>
                Open workspace <span>↗</span>
              </p>
            </Link>
          ))}
        </div>
        {memberships.length === 0 && (
          <div className="empty">
            <h2>Your next chapter starts here.</h2>
            <p>
              No workspaces yet. Create your business below, or open an
              invitation link from your owner.
            </p>
          </div>
        )}
        <section className="panel">
          <div className="section-heading">
            <div>
              <span className="eyebrow">GET STARTED</span>
              <h2>Create a workspace</h2>
            </div>
            <span className="badge">You’ll be the owner</span>
          </div>
          <BusinessForm />
        </section>
      </main>
    </>
  );
}
