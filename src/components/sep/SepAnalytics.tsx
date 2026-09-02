"use client";

import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { TrendChart } from "@/components/ops/charts/TrendChart";
import type { SepExecutionOverlay } from "@/types/sepExecution";
import {
  mitigationTrend,
  outcomeDistribution,
  plannedVsActual,
  taskCompletionTrend,
} from "@/lib/sepExecutionDesk";

export function SepAnalytics({
  overlay,
  onSelectLabel,
  onSelectOutcome,
}: {
  overlay: SepExecutionOverlay;
  onSelectLabel?: (label: string) => void;
  onSelectOutcome?: (label: "Success" | "Hurdle" | "Failure") => void;
}) {
  const trend = taskCompletionTrend(overlay);
  const planned = plannedVsActual(overlay);
  const outcomes = outcomeDistribution(overlay);
  const mit = mitigationTrend(overlay);
  const slipped = overlay.milestones.filter((m) => m.status === "slipped").length;
  const doneMiles = overlay.milestones.filter((m) => m.status === "done").length;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h3 className="text-sm font-semibold text-tl-ink">
          Task completion trend
        </h3>
        {trend.every((p) => p.value === 0) ? (
          <p className="mt-2 text-sm text-tl-ink-muted">
            No completed tasks yet for this plan.
          </p>
        ) : (
          <div className="mt-2">
            <TrendChart points={trend} />
          </div>
        )}
      </section>
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h3 className="text-sm font-semibold text-tl-ink">
          Planned vs actual activities
        </h3>
        {planned.length === 0 ? (
          <p className="mt-2 text-sm text-tl-ink-muted">No activities on this plan.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {planned.map((row) => (
              <li key={row.label}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onSelectLabel?.(row.label)}
                >
                  <p className="text-xs text-tl-ink-muted">{row.label}</p>
                  <p className="text-sm">
                    Planned {row.planned} · Done {row.actual}
                  </p>
                  <div className="mt-1 h-2 overflow-hidden rounded-sm bg-tl-paper">
                    <div
                      className="h-full bg-tl-trust"
                      style={{
                        width: `${row.planned ? Math.round((row.actual / row.planned) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h3 className="text-sm font-semibold text-tl-ink">
          Milestone completion / slippage
        </h3>
        {overlay.milestones.length === 0 ? (
          <p className="mt-2 text-sm text-tl-ink-muted">
            No milestones on this plan yet.
          </p>
        ) : (
          <VerticalBarChart
            bars={[
              { label: "Done", value: doneMiles },
              { label: "Slipped", value: slipped },
              {
                label: "Open",
                value: overlay.milestones.length - doneMiles - slipped,
              },
            ]}
          />
        )}
      </section>
      <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
        <h3 className="text-sm font-semibold text-tl-ink">
          Outcomes and mitigation effectiveness
        </h3>
        {outcomes.every((row) => row.value === 0) ? (
          <p className="mt-2 text-sm text-tl-ink-muted">
            No success, hurdle, or failure events on this plan yet.
          </p>
        ) : (
          <>
            <HorizontalBarChart bars={outcomes} />
            <div className="mt-2 flex flex-wrap gap-2">
              {outcomes.map((row) => (
                <button
                  key={row.label}
                  type="button"
                  className="rounded-md border border-tl-line px-2 py-1 text-xs hover:bg-tl-paper"
                  onClick={() =>
                    onSelectOutcome?.(row.label as "Success" | "Hurdle" | "Failure")
                  }
                >
                  Show {row.label.toLowerCase()} ({row.value})
                </button>
              ))}
            </div>
          </>
        )}
        <p className="mt-3 text-xs text-tl-ink-muted">
          Mitigation success % by month
        </p>
        {mit.every((p) => p.value === 0) ? (
          <p className="mt-1 text-sm text-tl-ink-muted">
            No closed interventions yet.
          </p>
        ) : (
          <TrendChart points={mit} height={140} />
        )}
      </section>
    </div>
  );
}
