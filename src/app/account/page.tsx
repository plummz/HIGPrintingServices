import Link from "next/link";
import { pageUser } from "@/server/auth/page-user";
import { AccountSettings } from "@/components/account-settings";
export default async function Page() {
  const user = await pageUser();
  return (
    <>
      <header className="topbar">
        <Link className="wordmark" href="/workspaces">
          ▧ PrintFlow
        </Link>
        <Link href="/workspaces">← Workspaces</Link>
      </header>
      <main className="container">
        <span className="eyebrow">YOUR ACCOUNT</span>
        <h1>A place for your profile.</h1>
        <section className="panel">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <span className="badge green">Email verified</span>
          <p className="feedback">
            Your account is stored in the database. Signing out or changing
            devices does not delete it.
          </p>
        </section>
        <AccountSettings />
      </main>
    </>
  );
}
