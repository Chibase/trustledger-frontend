"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { KpiCard } from "@/components/ui/KpiCard";
import { useSepDesk } from "@/components/sep/SepDeskContext";
import {
  listEngagementPlans,
  listEngagementPlansForProject,
} from "@/lib/sepStore";
import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_SECTOR_LABELS,
  SEP_STATUS_LABELS,
} from "@/types/engagementPlan";

type Props = {
  /** When set, only plans linked to this project. */
  projectId?: string;
};

export function SepDashboardPanel({ projectId }: Props) {
  const allowed = useSepDesk();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<EngagementPlan[]>([]);

  useEffect(() => {
    if (!allowed) return;
    const frame = requestAnimationFrame(() => {
      setRows(
        projectId
          ? listEngagementPlansForProject(projectId)
          : listEngagementPlans(),
      );
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [allowed, projectId]);

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

  if (!ready) {
    return (
      <section
        id="engagement-plans"
        aria-labelledby="sep-dash-heading"
        className="rounded-lg border border-tl-trust/30 bg-tl-surface p-4"
      >
        <h2
          id="sep-dash-heading"
          className="text-base font-semibold text-tl-ink"
        >
          Stakeholder engagement plans
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">Loading plans…</p>
      </section>
    );
  }

  return (
    <section
      id="engagement-plans"
      aria-labelledby="sep-dash-heading"
      className="space-y-3 rounded-lg border border-tl-trust/30 bg-tl-surface p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="sep-dash-heading"
            className="text-base font-semibold text-tl-ink"
          >
            Stakeholder engagement plans
          </h2>
          <p className="mt-1 text-xs text-tl-ink-muted">
            {projectId
              ? "Plans linked to this project — compose from a briefing, then apply to the SRM after approval."
              : "RFP / tender / briefing mapped from inception to close-out. Open a plan for the process dashboard and presentable document."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={composeHref}
            className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            New from briefing
          </Link>
          <Link
            href="/app/engagement-plan"
            className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
          >
            All plans
          </Link>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <KpiCard label="Plans" value={String(rows.length)} tone="trust" />
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
        <p className="rounded-lg border border-dashed border-tl-line bg-tl-paper/60 px-4 py-6 text-sm text-tl-ink-muted">
          No engagement plans yet.{" "}
          <Link href={composeHref} className="text-tl-trust-ink underline">
            Compose from a briefing
          </Link>{" "}
          or pick a sector playbook.
        </p>
      ) : (
        <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-paper/40">
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
