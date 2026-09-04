import { TRUST_DIMENSION_LABELS } from "@/types/trustLayer";
import type {
  TrustDimensionId,
  TrustDimensionStatus,
  TrustLevel,
  TrustObservation,
  TrustSignalKind,
  TrustTrend,
} from "@/types/trustLayer";

const SIGNAL_WEIGHT: Record<TrustSignalKind, number | null> = {
  positive: 1,
  neutral: 0,
  negative: -1,
  unknown: null,
};

function weight(signal: TrustSignalKind): number | null {
  return SIGNAL_WEIGHT[signal];
}

function mean(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

function levelFromMean(avg: number | null, sampleSize: number): TrustLevel {
  if (sampleSize === 0 || avg == null) return "unknown";
  if (avg >= 0.34) return "strong";
  if (avg <= -0.34) return "at_risk";
  return "watch";
}

function trendFromHalves(
  chronological: number[],
): TrustTrend {
  if (chronological.length < 2) return "unknown";
  const mid = Math.floor(chronological.length / 2);
  const earlier = mean(chronological.slice(0, mid));
  const later = mean(chronological.slice(mid));
  if (earlier == null || later == null) return "unknown";
  const delta = later - earlier;
  if (delta >= 0.34) return "improving";
  if (delta <= -0.34) return "declining";
  return "stable";
}

/**
 * Explainable per-dimension status. Does not change Trust pulse numbers.
 * Rules: mean of +1 / 0 / −1 signals; unknown dropped.
 * strong ≥ 0.34, at_risk ≤ −0.34, else watch. Trend = later half vs earlier half.
 */
export function classifyTrustDimension(
  dimension: TrustDimensionId,
  observations: TrustObservation[],
): TrustDimensionStatus {
  const rows = observations
    .filter((row) => row.dimension === dimension)
    .slice()
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt));
  const scored = rows
    .map((row) => ({ at: row.observedAt, w: weight(row.signal) }))
    .filter((row): row is { at: string; w: number } => row.w != null);

  const avg = mean(scored.map((row) => row.w));
  const level = levelFromMean(avg, scored.length);
  const trend = trendFromHalves(scored.map((row) => row.w));
  const lastObservedAt = rows.length ? rows[rows.length - 1]!.observedAt : null;

  const avgBit =
    avg == null ? "no scored signals" : `mean ${avg.toFixed(2)} on −1…+1`;
  const rationale = `${TRUST_DIMENSION_LABELS[dimension]}: ${scored.length} scored of ${rows.length} observations (${avgBit}). Level ${level} (strong ≥ 0.34, at risk ≤ −0.34). Trend ${trend} from later vs earlier half.`;

  return {
    dimension,
    level,
    trend,
    sampleSize: scored.length,
    lastObservedAt,
    rationale,
  };
}

export function classifyAllTrustDimensions(
  observations: TrustObservation[],
): TrustDimensionStatus[] {
  const dims: TrustDimensionId[] = [
    "project",
    "implementing_entity",
    "process",
    "people",
    "intentions",
  ];
  return dims.map((dimension) =>
    classifyTrustDimension(dimension, observations),
  );
}
