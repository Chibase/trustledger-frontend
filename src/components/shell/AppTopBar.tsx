"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { hasCapability } from "@/lib/entitlements";
import { userInitials } from "@/lib/executiveOverview";
import type { PlanId } from "@/config/plans";
import type { DeskTier } from "@/types/deskTier";
import { DESK_TIER_LABELS } from "@/types/deskTier";
import type { UserRole } from "@/types/rbac";

type Props = {
  userName: string;
  role: UserRole;
  deskTier?: DeskTier | null;
  planId?: PlanId | null;
};

export function AppTopBar({
  userName,
  role,
  deskTier = null,
  planId = null,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const deskLabel = deskTier ? DESK_TIER_LABELS[deskTier] : role;
  const searchHref = hasCapability("stakeholdersCrm", planId)
    ? "/app/stakeholders"
    : "/app/projects";

  return (
    <header className="sticky top-0 z-10 hidden border-b border-tl-line bg-tl-surface md:block">
      <div className="flex items-center gap-3 px-4 py-3 md:px-8">
        <form
          className="min-w-0 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            const q = query.trim();
            if (!q) {
              router.push(searchHref);
              return;
            }
            router.push(`${searchHref}?q=${encodeURIComponent(q)}`);
          }}
        >
          <label className="sr-only" htmlFor="app-global-search">
            Search workspace
          </label>
          <input
            id="app-global-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, stakeholders, communities…"
            className="w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink placeholder:text-tl-ink-muted"
          />
        </form>
        <Link
          href="/app/guide"
          className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          Help
        </Link>
        <Link
          href="/app/settings"
          className="flex min-w-0 items-center gap-2 rounded-md px-1 py-1 hover:bg-tl-paper"
        >
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tl-trust text-xs font-semibold text-white"
            aria-hidden
          >
            {userInitials(userName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-tl-ink">
              {userName}
            </span>
            <span className="block truncate text-xs text-tl-ink-muted">
              {deskLabel}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
