import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container">
      <h1>Workspace not available</h1>
      <p>It may not exist, or you may not have access.</p>
      <Link href="/workspaces">Back to your workspaces</Link>
    </main>
  );
}
