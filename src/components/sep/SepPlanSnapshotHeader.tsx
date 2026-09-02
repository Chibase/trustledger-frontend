"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import type { SepPlanSnapshot } from "@/types/sepExecution";
import { SEP_HEALTH_LABELS } from "@/types/sepExecution";

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-ZA");
}

export function SepPlanSnapshotHeader({
  snapshot,
}: {
  snapshot: SepPlanSnapshot;
}) {
  const healthTone =
    snapshot.health === "red"
      ? "danger"
      : snapshot.health === "amber"
        ? "attention"
        : "trust";

  return (
    <section aria-labelledby="sep-exec-snapshot">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            Plan snapshot
          </p>
          <h2
            id="sep-exec-snapshot"
            className="font-display text-xl font-semibold text-tl-ink"
          >
            {snapshot.title}
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            <span className="font-mono text-xs">{snapshot.planId}</span>
            {" · Submitted "}
            {fmtDate(snapshot.submittedAt)}
            {" · Owner "}
            {snapshot.ownerName}
          </p>
        </div>
        <p
          className={
            snapshot.health === "red"
              ? "text-sm font-medium text-tl-danger"
              : snapshot.health === "amber"
                ? "text-sm font-medium text-tl-amber"
                : "text-sm font-medium text-tl-trust-ink"
          }
        >
          Health: {SEP_HEALTH_LABELS[snapshot.health]}
        </p>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Stage"
          value={snapshot.stageLabel}
          hint={`Phase ${snapshot.phaseId}`}
        />
        <KpiCard
          label="Progress"
          value={`${snapshot.progressPct}%`}
          hint={`Goal attainment ${snapshot.kpis.goalAttainmentPct}%`}
          tone="trust"
        />
        <KpiCard
          label="Next milestone"
          value={fmtDate(snapshot.nextMilestoneOn)}
          hint={snapshot.nextMilestoneTitle || "None remaining"}
        />
        <KpiCard
          label="Open critical"
          value={String(snapshot.openCriticalCount)}
          hint="Hurdles and failures still open"
          tone={snapshot.openCriticalCount > 0 ? "danger" : healthTone}
        />
      </div>
    </section>
  );
}
