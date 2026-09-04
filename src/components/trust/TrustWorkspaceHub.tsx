"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { KpiCard } from "@/components/ui/KpiCard";
import {
  TRUST_COMPARISON_AXES,
  type TrustComparisonAxis,
} from "@/lib/trust/analytics";
import { formatTrustMean } from "@/lib/trust/scoring";
import {
  loadWorkspaceTrustProof,
  summarizeTrustWorkspace,
  trustMeanToDisplay,
} from "@/lib/trust/workspaceProof";
import type { TrustProofReport } from "@/lib/trust/proofReport";

const AXIS_LABEL: Record<TrustComparisonAxis, string> = {
  community: "Community",
  location: "Location",
  stakeholder_group: "Stakeholder group",
  project_phase: "Phase proxy",
};

const DIMENSION_SHORT: Record<string, string> = {
  project: "Project",
  implementing_entity: "Implementing entity",
  process: "Process",
  people: "People",
  fairness: "Fairness",
  concerns_acted_upon: "Concerns acted upon",
};

function movementTone(
  movement: TrustProofReport["overallMovement"],
): "default" | "attention" | "danger" | "trust" {
  if (movement === "declining") return "danger";
  if (movement === "mixed") return "attention";
  if (movement === "improving") return "trust";
  return "default";
}

function displayBars(
  rows: { label: string; mean: number | null }[],
): { label: string; value: number }[] {
  return rows
    .map((row) => ({
      label: row.label.slice(0, 28),
      value: trustMeanToDisplay(row.mean),
    }))
    .filter((row): row is { label: string; value: number } => row.value != null);
}

/**
 * Workspace hub for TE-3: trend, comparison, risk, proof narrative, shortcuts.
 * Not impact-trend / SLA charts. Does not change Trust pulse or report packs.
 */
export function TrustWorkspaceHub() {
  const [report, setReport] = useState<TrustProofReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [axisOverride, setAxisOverride] = useState<TrustComparisonAxis | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await loadWorkspaceTrustProof());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not compose trust proof.",
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Compose on mount so the desk is not an empty workspace shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async TE-3 load
    void load();
  }, [load]);

  const summary = useMemo(
    () => (report ? summarizeTrustWorkspace(report) : null),
    [report],
  );

  const selectedAxis =
    axisOverride ?? summary?.comparisonAxis ?? "community";
  const comparisonSlices = (
    summary?.comparisons[selectedAxis] || []
  ).filter((row) => row.scoredCount > 0);
  const comparisonBars = displayBars(
    comparisonSlices.map((row) => ({
      label: row.label,
      mean: row.meanSignal,
    })),
  );
  const trendBars = displayBars([
    { label: "Earlier", mean: summary?.period.earlierMean ?? null },
    { label: "Later", mean: summary?.period.laterMean ?? null },
  ]);
  const dimensionBars = displayBars(
    (summary?.dimensions || [])
      .filter((row) => row.mean != null)
      .map((row) => ({
        label: DIMENSION_SHORT[row.dimension] || row.label,
        mean: row.mean,
      })),
  );

  return (
    <section className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-tl-ink">
          Trust proof workspace
        </h2>
        <p className="text-xs text-tl-ink-muted">
          Trend, comparison, risk, and a proof narrative from the trust layer —
          not Trust pulse, not SLA or impact-trend charts
        </p>
      </div>

      <nav aria-label="Trust workspace shortcuts" className="flex flex-wrap gap-2">
        <Link
          href="/app/reports"
          className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Full proof
        </Link>
        <Link
          href="/app/incidents"
          className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
        >
          Cases
        </Link>
        <Link
          href="/app/engagements"
          className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
        >
          Engagements
        </Link>
        <Link
          href="/app/capture"
          className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
        >
          Evidence
        </Link>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
        >
          Refresh
        </button>
      </nav>

      {loading ? (
        <p className="text-sm text-tl-ink-muted">Composing trust proof…</p>
      ) : null}
      {error ? <p className="text-sm text-tl-danger">{error}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Trust movement"
          value={
            summary
              ? summary.movement.replaceAll("_", " ")
              : loading
                ? "…"
                : "—"
          }
          hint="Later vs earlier half of scored observations (±0.34)"
          tone={summary ? movementTone(summary.movement) : "default"}
        />
        <KpiCard
          label="Scored observations"
          value={summary ? String(summary.scoredObservations) : loading ? "…" : "0"}
          hint="Trust-layer signals — not case sentiment"
        />
        <KpiCard
          label="Risk flags"
          value={summary ? String(summary.riskCount) : loading ? "…" : "0"}
          hint={
            summary?.attentionRiskCount
              ? `${summary.attentionRiskCount} need attention`
              : "Declining, at-risk, low confidence, thin evidence"
          }
          tone={
            summary && summary.attentionRiskCount > 0
              ? "danger"
              : summary && summary.riskCount > 0
                ? "attention"
                : "default"
          }
        />
        <KpiCard
          label="Evidence-backed claims"
          value={
            summary ? String(summary.evidenceBackedClaims) : loading ? "…" : "0"
          }
          hint="Dimension claims that cite evidence ids"
          tone={
            summary && summary.evidenceBackedClaims > 0 ? "trust" : "default"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-tl-ink">Trust trend</h3>
          <p className="mb-3 text-xs text-tl-ink-muted">
            Earlier vs later mean on a 0–100 map of −1…+1. Not Trust pulse.
            {summary?.period.delta != null
              ? ` Delta ${formatTrustMean(summary.period.delta)} (${summary.period.movement.replaceAll("_", " ")}).`
              : ""}
          </p>
          {trendBars.length === 2 ? (
            <VerticalBarChart bars={trendBars} />
          ) : (
            <p className="text-sm text-tl-ink-muted">
              Need scored observations on both halves of the period to chart
              movement.
            </p>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-tl-ink">
            Dimensions
          </h3>
          <p className="mb-3 text-xs text-tl-ink-muted">
            Six blueprint dimensions. Same −1…+1 mean, shown 0–100.
          </p>
          {dimensionBars.length ? (
            <HorizontalBarChart bars={dimensionBars} maxHeight={180} />
          ) : (
            <p className="text-sm text-tl-ink-muted">
              No scored dimensions yet.
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-tl-ink">Comparison</h3>
        <div
          role="tablist"
          aria-label="Comparison axis"
          className="mb-3 flex flex-wrap gap-2"
        >
          {TRUST_COMPARISON_AXES.map((axis) => (
            <button
              key={axis}
              type="button"
              role="tab"
              aria-selected={selectedAxis === axis}
              onClick={() => setAxisOverride(axis)}
              className={
                selectedAxis === axis
                  ? "rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white"
                  : "rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
              }
            >
              {AXIS_LABEL[axis]}
            </button>
          ))}
        </div>
        {comparisonBars.length ? (
          <HorizontalBarChart bars={comparisonBars} maxHeight={180} />
        ) : (
          <p className="text-sm text-tl-ink-muted">
            No {AXIS_LABEL[selectedAxis].toLowerCase()} slices yet. Community,
            location, group, and phase proxies appear when trust observations
            have place or source.
          </p>
        )}
      </div>

      <details className="rounded-md border border-tl-line p-3">
        <summary className="cursor-pointer text-sm font-semibold text-tl-ink">
          Comparison detail, risks, and proof narrative
        </summary>
        {comparisonBars.length ? (
          <ul className="mt-3 divide-y divide-tl-line overflow-hidden rounded-md border border-tl-line">
            {comparisonSlices.slice(0, 8).map((row) => (
              <li
                key={`${selectedAxis}-${row.id}`}
                className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="font-medium text-tl-ink">{row.label}</span>
                <span className="text-xs text-tl-ink-muted">
                  mean {formatTrustMean(row.meanSignal)} ·{" "}
                  {row.level.replaceAll("_", " ")} ·{" "}
                  {row.movement.replaceAll("_", " ")} · {row.scoredCount}{" "}
                  scored
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-tl-ink">Trust risks</h3>
          {report?.risks.length ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-tl-ink">
              {report.risks.slice(0, 6).map((flag) => (
                <li key={flag.id}>
                  <span className="font-medium">{flag.title}</span>
                  <span className="text-tl-ink-muted"> — {flag.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-tl-ink-muted">
              No trust-risk flags on the current rules.
            </p>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-tl-ink">
            Proof narrative
          </h3>
          <p className="text-sm text-tl-ink">
            {report?.narrative ||
              "No scored trust observations yet. Keep or break a promise, add evidence support, or capture overlay attitudes — then refresh. Case sentiment is not a trust observation."}
          </p>
        </div>
      </div>
      </details>
    </section>
  );
}
