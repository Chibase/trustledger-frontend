"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
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

  return (
    <section
      aria-labelledby="module-contrib-heading"
      className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2
            id="module-contrib-heading"
            className="text-base font-semibold text-tl-ink"
          >
            Module contribution
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Each included desk contributes equally to strategy progress.{" "}
            {demoSeeded
              ? "VIP showcase desks include illustrative NCGR-B rows."
              : "Nothing is preloaded on this plan — records here are yours."}
          </p>
        </div>
        <KpiCard
          label="Aggregate progress"
          value={`${aggregate}%`}
          hint="Mean module fill"
          tone="trust"
        />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="rounded-md border border-tl-line px-3 py-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-sm font-medium text-tl-ink">{row.label}</p>
              <p className="text-xs tabular-nums text-tl-ink-muted">
                {row.contributionPct}% of roll-up · {row.scorePct}% fill
                {row.key === suggestedNextKey && row.empty
                  ? " · next in sequence"
                  : ""}
              </p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-sm bg-tl-paper">
              <div
                className="h-full bg-tl-trust"
                style={{ width: `${row.scorePct}%` }}
              />
            </div>
            {row.empty ? (
              <p className="mt-2 text-xs text-tl-ink-muted">
                Empty.{" "}
                <Link
                  href={row.href}
                  className="text-tl-trust-ink underline"
                  onClick={() => recordEmptyStateCta(row.key)}
                >
                  Open {row.label}
                </Link>{" "}
                and add the first record.
              </p>
            ) : (
              <p className="mt-2 text-xs text-tl-ink-muted">
                {row.count} record{row.count === 1 ? "" : "s"}.{" "}
                <Link
                  href={row.href}
                  className="text-tl-trust-ink underline"
                  onClick={() => recordExecutiveDrill(row.key)}
                >
                  Show this module only
                </Link>
              </p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
