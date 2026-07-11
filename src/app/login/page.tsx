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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const [role, setRole] = useState<UserRole>("client");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.cookie = `session-role=${role}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    document.cookie = `tl-mode=demo; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    router.push(next.startsWith("/app") ? next : "/app/dashboard");
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="font-display text-2xl font-semibold">Sign in</h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Dev/demo role picker. Prefer{" "}
        <a href="/demo" className="text-tl-trust-ink underline">
          /demo
        </a>{" "}
        for sample data, or{" "}
        <a href="/login/live" className="text-tl-trust-ink underline">
          /login/live
        </a>{" "}
        for a real Frappe session.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
      >
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
          Continue
        </button>
      </form>
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
