"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { PlanId } from "@/config/plans";
import { PLAN_DASHBOARD_CATALOG } from "@/config/tierFlow";
import { hasCapability, resolveClientPlanId } from "@/lib/entitlements";
import {
  descriptorForPath,
  resolvePlanDashboardPackaging,
} from "@/lib/planPackaging";
import {
  recordExecutiveDrill,
  recordModuleVisit,
} from "@/lib/planPackagingMetrics";
import type { TlMode } from "@/lib/auth.constants";

type Props = {
  planId?: PlanId | null;
  vip?: boolean;
  mode?: TlMode | null;
};

export function PlanModuleSwitcher({
  planId = null,
  vip = false,
  mode = null,
}: Props) {
  const pathname = usePathname() || "/app/dashboard";
  const [packaging, setPackaging] = useState(() =>
    resolvePlanDashboardPackaging({
      planId,
      vip,
      mode,
    }),
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = resolvePlanDashboardPackaging({
        planId,
        vip,
        mode,
        measureEmpty: true,
      });
      const resolved =
        next.planId === "demo" ? resolveClientPlanId(planId) : next.planId;
      next.moduleDashboards = next.moduleDashboards.filter((row) =>
        hasCapability(row.capability, resolved),
      );
      setPackaging(next);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [planId, vip, mode]);

  const current = useMemo(() => descriptorForPath(pathname), [pathname]);

  useEffect(() => {
    if (current) recordModuleVisit(current.key);
  }, [current]);

  const items = [packaging.executiveDashboard, ...packaging.moduleDashboards];
  const onModule =
    current && current.key !== "executive" ? current : null;

  return (
    <div className="mb-4 space-y-2 print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-tl-ink-muted">
          Plan modules
        </p>
        {onModule ? (
          <Link
            href={PLAN_DASHBOARD_CATALOG.executive.href}
            className="text-xs font-medium text-tl-trust-ink underline"
          >
            Return to executive view
          </Link>
        ) : (
          <span className="text-xs text-tl-ink-muted">
            Executive roll-up — open a module for evidence
          </span>
        )}
      </div>
      <nav
        aria-label="Plan module dashboards"
        className="flex gap-1 overflow-x-auto pb-1"
      >
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.key !== "executive" && pathname.startsWith(`${item.href}/`));
          const suggested =
            packaging.suggestedNextKey === item.key && !packaging.demoSeedAllowed;
          return (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => {
                if (item.key !== "executive") recordExecutiveDrill(item.key);
              }}
              className={
                active
                  ? "shrink-0 rounded-md bg-tl-trust px-3 py-1.5 text-xs font-medium text-white"
                  : "shrink-0 rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-xs font-medium text-tl-ink hover:bg-tl-paper"
              }
            >
              {item.label}
              {suggested ? (
                <span className="ml-1 font-normal opacity-80">· next</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
