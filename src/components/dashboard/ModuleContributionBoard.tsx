"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HorizontalBarChart } from "@/components/ops/charts/BarChart";
import { OverviewChartCard } from "@/components/dashboard/OverviewChartCard";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import {
  buildModuleContributions,
  resolvePlanDashboardPackaging,
} from "@/lib/planPackaging";
import {
  recordEmptyStateCta,
  recordExecutiveDrill,
} from "@/lib/planPackagingMetrics";
import type {
  PlanDashboardModuleKey,
  PlanModuleContribution,
} from "@/types/planPackaging";

type Props = {
  planId?: PlanId | null;
  vip?: boolean;
  mode?: TlMode | null;
  email?: string | null;
};

export function ModuleContributionBoard({
  planId = null,
  vip = false,
  mode = null,
  email = null,
}: Props) {
  const [aggregate, setAggregate] = useState(0);
  const [rows, setRows] = useState<PlanModuleContribution[]>(() => {
    const packaging = resolvePlanDashboardPackaging({
      planId,
      vip,
      mode,
      email,
      measureEmpty: false,
    });
    return buildModuleContributions(packaging).contributions;
  });
  const [demoSeeded, setDemoSeeded] = useState(() =>
    resolvePlanDashboardPackaging({ planId, vip, mode, email }).demoSeedAllowed,
  );
  const [suggestedNextKey, setSuggestedNextKey] =
    useState<PlanDashboardModuleKey | null>(null);

  useEffect(() => {
    const read = () => {
      const packaging = resolvePlanDashboardPackaging({
        planId,
        vip,
        mode,
        email,
        measureEmpty: true,
      });
      const next = buildModuleContributions(packaging);
      setRows(next.contributions);
      setAggregate(next.aggregateProgressPct);
      setDemoSeeded(packaging.demoSeedAllowed);
      setSuggestedNextKey(packaging.suggestedNextKey);
    };
    const handle = window.setTimeout(read, 0);
    window.addEventListener("tl-workspace-seeded", read);
    return () => {
      window.clearTimeout(handle);
      window.removeEventListener("tl-workspace-seeded", read);
    };
  }, [planId, vip, mode, email]);

  if (rows.length === 0) return null;

  const bars = rows.map((row) => ({
    label: row.label.slice(0, 22),
    value: row.scorePct,
  }));
  const nextEmpty = rows.find((row) => row.key === suggestedNextKey && row.empty);

  return (
    <OverviewChartCard
      title="Module fill"
      hint={
        demoSeeded
          ? `Aggregate ${aggregate}%. VIP showcase desks include illustrative NCGR-B rows.`
          : `Aggregate ${aggregate}%. Records here are yours.`
      }
    >
      <HorizontalBarChart bars={bars} maxHeight={180} />
      {nextEmpty ? (
        <p className="mt-3 text-xs text-tl-ink-muted">
          Next in sequence:{" "}
          <Link
            href={nextEmpty.href}
            className="text-tl-trust-ink underline"
            onClick={() => recordEmptyStateCta(nextEmpty.key)}
          >
            Open {nextEmpty.label}
          </Link>
        </p>
      ) : (
        <p className="mt-3 text-xs text-tl-ink-muted">
          {rows
            .filter((row) => !row.empty)
            .slice(0, 3)
            .map((row) => (
              <Link
                key={row.key}
                href={row.href}
                className="mr-3 text-tl-trust-ink underline"
                onClick={() => recordExecutiveDrill(row.key)}
              >
                {row.label}
              </Link>
            ))}
        </p>
      )}
    </OverviewChartCard>
  );
}
