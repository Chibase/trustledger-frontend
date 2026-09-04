"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import {
  descriptorForPath,
  resolvePlanDashboardPackaging,
} from "@/lib/planPackaging";
import { recordEmptyStateCta } from "@/lib/planPackagingMetrics";
import { PLAN_DASHBOARD_CATALOG } from "@/config/tierFlow";
import type { PlanDashboardPackaging } from "@/types/planPackaging";

type Props = {
  planId?: PlanId | null;
  vip?: boolean;
  mode?: TlMode | null;
  email?: string | null;
};

/** Guided empty state on module desks for plans that do not preload demo data. */
export function PlanModuleEmptyBanner({
  planId = null,
  vip = false,
  mode = null,
  email = null,
}: Props) {
  const pathname = usePathname() || "/app/dashboard";
  const current = descriptorForPath(pathname);
  const [packaging, setPackaging] = useState<PlanDashboardPackaging | null>(
    null,
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setPackaging(
        resolvePlanDashboardPackaging({
          planId,
          vip,
          mode,
          email,
          measureEmpty: true,
        }),
      );
    }, 0);
    return () => window.clearTimeout(handle);
  }, [planId, vip, mode, email]);

  if (!current || current.key === "executive" || !packaging) return null;
  const flag = packaging.emptyStateFlags.find((row) => row.key === current.key);
  if (!flag?.empty) return null;

  const next = packaging.moduleDashboards.find(
    (row) => row.key === packaging.suggestedNextKey,
  );
  const nextHref = next && next.key !== current.key ? next.href : null;

  return (
    <div
      className="mb-4 rounded-lg border border-dashed border-tl-line bg-tl-paper/80 p-4"
      data-testid="plan-module-empty"
    >
      <p className="text-sm font-medium text-tl-ink">
        {current.label} is empty on this plan
      </p>
      <p className="mt-1 text-sm text-tl-ink-muted">{current.emptyHint}</p>
      <p className="mt-2 text-xs text-tl-ink-muted">
        No programme is preloaded. Add the first record when the work happens.
      </p>
      {nextHref ? (
        <p className="mt-2 text-xs">
          <Link
            href={PLAN_DASHBOARD_CATALOG.executive.href}
            className="text-tl-trust-ink underline"
            onClick={() => recordEmptyStateCta(current.key)}
          >
            Return to executive view
          </Link>
          {" · "}
          <Link href={nextHref} className="text-tl-trust-ink underline">
            Next in sequence
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-xs">
          <Link
            href={PLAN_DASHBOARD_CATALOG.executive.href}
            className="text-tl-trust-ink underline"
            onClick={() => recordEmptyStateCta(current.key)}
          >
            Return to executive view
          </Link>
        </p>
      )}
    </div>
  );
}
