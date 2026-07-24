"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/app/dashboard";
}

function LoginForm() {
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const signedOut = searchParams.get("signedOut") === "1";
  const repaired = searchParams.get("repaired") === "1";

  const liveHref =
    next.startsWith("/app") || next.startsWith("/ops")
      ? `/login/live?next=${encodeURIComponent(next)}`
      : "/login/live";

  return (
    <main className="mx-auto max-w-md p-6">
      <p className="font-display text-sm font-semibold tracking-wide text-tl-trust-ink">
        TrustLedger
      </p>
      <h1 className="mt-1 font-display text-2xl font-semibold text-tl-ink">
        {signedOut || repaired ? "Signed out" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        {signedOut || repaired
          ? "Your session is cleared. Sign in again, or use a different email on the live form to switch accounts."
          : "Choose how you want to enter TrustLedger."}
      </p>

      <div className="mt-6 space-y-3">
        <Link
          href={liveHref}
          className="block w-full rounded-md bg-tl-trust px-4 py-3 text-center text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          {signedOut || repaired
            ? "Sign in again / different account"
            : "Sign in with live account"}
        </Link>
        <Link
          href="/login/trial"
          className="block w-full rounded-md border border-tl-line bg-tl-surface px-4 py-3 text-center text-sm font-medium text-tl-ink hover:border-tl-trust hover:text-tl-trust-ink"
        >
          Continue trial
        </Link>
        <Link
          href="/product"
          className="block w-full rounded-md border border-tl-line bg-tl-surface px-4 py-3 text-center text-sm font-medium text-tl-ink hover:border-tl-trust hover:text-tl-trust-ink"
        >
          Product &amp; onboarding
        </Link>
      </div>

      <p className="mt-8 text-xs text-tl-ink-muted">
        New here?{" "}
        <Link href="/trial" className="text-tl-trust-ink underline">
          Start a 14-day trial
        </Link>{" "}
        with your own workspace — sample preview is retired.
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Sign in</h1>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
