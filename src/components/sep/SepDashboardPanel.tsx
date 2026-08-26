"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import { hasCapability } from "@/lib/entitlements";
import {
  listEngagementPlans,
  listEngagementPlansForProject,
} from "@/lib/sepStore";
import type { PlanId } from "@/config/plans";
import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_SECTOR_LABELS,
  SEP_STATUS_LABELS,
} from "@/types/engagementPlan";

type Props = {
  planId?: PlanId | null;
  /** When set, only plans linked to this project. */
  projectId?: string;
};

export function SepDashboardPanel({ planId = null, projectId }: Props) {
  const [allowed, setAllowed] = useState(false);
  const [rows, setRows] = useState<EngagementPlan[]>([]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setAllowed(hasCapability("engagements", planId));
      setRows(
        projectId
          ? listEngagementPlansForProject(projectId)
          : listEngagementPlans(),
      );
    }, 0);
    return () => window.clearTimeout(handle);
  }, [planId, projectId]);

  const applied = useMemo(
    () => rows.filter((row) => row.status === "applied").length,
    [rows],
  );
  const awaiting = rows.length - applied;
  const recent = rows.slice(0, 5);
  const composeHref = projectId
    ? `/app/engagement-plan/new?project=${encodeURIComponent(projectId)}`
    : "/app/engagement-plan/new";

  if (!allowed) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-tl-ink">
            Stakeholder engagement plans
          </h2>
          <p className="mt-1 text-xs text-tl-ink-muted">
            {projectId
              ? "Plans linked to this project — compose from a briefing, then apply to the SRM after approval."
              : "RFP / tender / briefing mapped from inception to close-out. Open a plan for the process dashboard and presentable document."}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={composeHref}
            className="text-xs font-medium text-tl-trust-ink hover:underline"
          >
            New from briefing
          </Link>
          <Link
            href="/app/engagement-plan"
            className="text-xs font-medium text-tl-trust-ink hover:underline"
          >
            All plans
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Plans" value={String(rows.length)} />
        <KpiCard
          label="Applied to SRM"
          value={String(applied)}
          hint="Registry, engagements, commitments seeded"
        />
        <KpiCard
          label="Awaiting apply"
          value={String(awaiting)}
          hint="Saved suggestions not yet written to the desk"
          tone={awaiting > 0 ? "attention" : "default"}
        />
      </div>

      {recent.length === 0 ? (
        <p className="rounded-lg border border-dashed border-tl-line bg-tl-surface px-4 py-6 text-sm text-tl-ink-muted">
          No engagement plans yet.{" "}
          <Link href={composeHref} className="text-tl-trust-ink underline">
            Compose from a briefing
          </Link>{" "}
          or pick a sector playbook.
        </p>
      ) : (
        <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
          {recent.map((row) => (
            <li key={row.id}>
              <Link
                href={`/app/engagement-plan/${row.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm hover:bg-tl-paper"
              >
                <div className="min-w-0">
                  <p className="font-medium text-tl-ink">{row.title}</p>
                  <p className="text-xs text-tl-ink-muted">
                    {SEP_SECTOR_LABELS[row.sectorId]} ·{" "}
                    {SEP_STATUS_LABELS[row.status]}
                    {row.placeHint ? ` · ${row.placeHint}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-medium text-tl-trust-ink">
                  Open plan →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
