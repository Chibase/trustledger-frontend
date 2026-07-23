"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { USER_ROLES, type UserRole } from "@/types/rbac";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/app/dashboard";
}

function setDemoSessionCookies(role: UserRole) {
  const cookieStore = globalThis.document;
  if (!cookieStore) return;
  cookieStore.cookie = `session-role=${role}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
  cookieStore.cookie = `tl-mode=demo; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const signedOut = searchParams.get("signedOut") === "1";
  const repaired = searchParams.get("repaired") === "1";
  const [role, setRole] = useState<UserRole>("client");
  const [showDemoPicker, setShowDemoPicker] = useState(false);

  function handleDemoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDemoSessionCookies(role);
    router.push(next.startsWith("/app") ? next : "/app/dashboard");
  }

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
          href="/demo"
          className="block w-full rounded-md border border-tl-line bg-tl-surface px-4 py-3 text-center text-sm font-medium text-tl-ink hover:border-tl-trust hover:text-tl-trust-ink"
        >
          Explore demo
        </Link>
      </div>

      <div className="mt-8 border-t border-tl-line pt-6">
        <button
          type="button"
          onClick={() => setShowDemoPicker((open) => !open)}
          className="text-sm font-medium text-tl-ink-muted hover:text-tl-trust-ink"
          aria-expanded={showDemoPicker}
        >
          {showDemoPicker ? "Hide quick demo role" : "Quick demo role (dev)"}
        </button>

        {showDemoPicker ? (
          <form
            onSubmit={handleDemoSubmit}
            className="mt-4 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
          >
            <p className="text-xs text-tl-ink-muted">
              Sets a demo session cookie and opens the app shell. Prefer{" "}
              <Link href="/demo" className="text-tl-trust-ink underline">
                /demo
              </Link>{" "}
              for the guided entry.
            </p>
            <div>
              <label htmlFor="role" className="mb-1 block text-sm font-medium">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                {USER_ROLES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Continue as demo role
            </button>
          </form>
        ) : null}
      </div>
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
