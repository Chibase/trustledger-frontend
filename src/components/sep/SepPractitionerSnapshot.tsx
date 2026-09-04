"use client";

import { KpiCard } from "@/components/ui/KpiCard";
import type { SepPlanSnapshot } from "@/types/sepExecution";
import type { SepExecutionOverlay } from "@/types/sepExecution";
import { SEP_HEALTH_LABELS } from "@/types/sepExecution";
import { recentChangesSince } from "@/lib/sepExecutionDesk";

export function SepPractitionerSnapshot({
  snapshot,
  overlay,
}: {
  snapshot: SepPlanSnapshot;
  overlay: SepExecutionOverlay;
}) {
  const changes = recentChangesSince(overlay, overlay.lastReviewAt);
  const open = overlay.events.filter(
    (ev) => ev.status === "open" || ev.status === "watching",
  );

  return (
    <section
      aria-labelledby="sep-prac-snap"
      className="space-y-4 rounded-lg border border-tl-trust/40 bg-tl-surface p-4"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
          Practitioner snapshot
        </p>
        <h2
          id="sep-prac-snap"
          className="font-display text-lg font-semibold text-tl-ink"
        >
          Client / superior briefing
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Concise status for this plan only. Share this view; it does not
          include other programmes.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Progress vs goal"
          value={`${snapshot.kpis.goalAttainmentPct}%`}
          hint={SEP_HEALTH_LABELS[snapshot.health]}
          tone="trust"
        />
        <KpiCard
          label="Completion confidence"
          value={`${snapshot.kpis.completionConfidenceIndex}`}
          hint="Index 0–100 (see formula in sepKpis)"
        />
        <KpiCard
          label="Schedule variance"
          value={`${snapshot.kpis.scheduleVarianceDays}d`}
          hint="Worst milestone slip"
          tone={
            snapshot.kpis.scheduleVarianceDays > 7 ? "attention" : "default"
          }
        />
        <KpiCard
          label="Mitigation success"
          value={`${snapshot.kpis.mitigationSuccessRatePct}%`}
          hint={`${overlay.interventions.length} interventions`}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold">Recent changes since last review</h3>
          {changes.length === 0 ? (
            <p className="mt-2 text-sm text-tl-ink-muted">
              No logged changes since the last review stamp.
            </p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-tl-ink">
              {changes.map((row) => (
                <li key={row}>{row}</li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold">Top risks and mitigations</h3>
          {open.length === 0 ? (
            <p className="mt-2 text-sm text-tl-ink-muted">
              No open hurdles or failures on this plan.
            </p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {open.slice(0, 5).map((ev) => {
                const mits = overlay.interventions.filter(
                  (row) => row.eventId === ev.id,
                );
                return (
                  <li key={ev.id}>
                    <span className="font-medium">{ev.title}</span>
                    <span className="text-tl-ink-muted">
                      {" "}
                      · {ev.kind}
                      {mits.length
                        ? ` · ${mits.map((m) => m.status).join(", ")}`
                        : " · no intervention yet"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
