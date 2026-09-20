"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container">
      <h1>We couldn’t open this page.</h1>
      <p>
        Please try again. If the problem continues, contact your workspace
        owner.
      </p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
