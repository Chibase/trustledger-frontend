"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { USER_ROLES, type UserRole } from "@/types/rbac";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const [role, setRole] = useState<UserRole>("client");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    document.cookie = `session-role=${role}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    router.push(next);
  }

  return (
    <main className="p-6 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Sign in</h1>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
            className="w-full rounded-md border px-3 py-2 text-sm"
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
          className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
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
        <main className="p-6 max-w-md">
          <h1 className="text-2xl font-bold mb-6">Sign in</h1>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
