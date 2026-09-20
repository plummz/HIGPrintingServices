import Link from "next/link";
export default function Page() {
  return (
    <main className="container">
      <h1>Check your inbox</h1>
      <p>
        Open the verification link in your email, then sign in. Trying to sign
        in again sends another verification email when needed.
      </p>
      <Link href="/login">Back to sign in</Link>
    </main>
  );
}
