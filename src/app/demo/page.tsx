"use client";

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

function DemoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const [role, setRole] = useState<UserRole>("community");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.cookie = `session-role=${role}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    document.cookie = `tl-mode=demo; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    router.push(next.startsWith("/app") ? next : "/app/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">TrustLedger Demo</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Try the product with sample data
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Pick a stakeholder role. Nothing here writes to a live project — use it
        to explore dashboards and AI assist, then book a real demo.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
      >
        <div>
          <label htmlFor="role" className="mb-1 block text-sm font-medium">
            Enter as
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
          className="w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Start demo
        </button>
      </form>

      <p id="book" className="mt-6 text-sm text-tl-ink-muted">
        Ready for your own projects?{" "}
        <a
          href="mailto:hello@trustledger.co.za?subject=TrustLedger%20demo%20request"
          className="font-medium text-tl-trust-ink underline"
        >
          Book a live demo
        </a>
      </p>
    </main>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">TrustLedger Demo</h1>
        </main>
      }
    >
      <DemoForm />
    </Suspense>
  );
}
