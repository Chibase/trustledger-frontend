"use client";

import { useRouter } from "next/navigation";
import { SESSION_MAX_AGE_SECONDS } from "@/lib/auth.constants";
import { USER_ROLES, type UserRole } from "@/types/rbac";

type TrialRoleSwitcherProps = {
  currentRole: UserRole;
};

export function TrialRoleSwitcher({ currentRole }: TrialRoleSwitcherProps) {
  const router = useRouter();

  function onChange(role: UserRole) {
    document.cookie = `session-role=${role}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    router.refresh();
  }

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
      <h2 className="font-semibold">View as role</h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Trial is open — switch stakeholder lens without logging in.
      </p>
      <label htmlFor="trial-role" className="mt-3 mb-1 block text-sm font-medium">
        Role
      </label>
      <select
        id="trial-role"
        value={currentRole}
        onChange={(e) => onChange(e.target.value as UserRole)}
        className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
      >
        {USER_ROLES.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </section>
  );
}
