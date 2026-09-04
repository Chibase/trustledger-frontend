/**
 * Shared explainable scoring for the trust layer.
 * Same thresholds TE-2 status uses — do not invent a second opaque index.
 */

import type {
  TrustLevel,
  TrustObservation,
  TrustSignalKind,
  TrustTrend,
} from "@/types/trustLayer";

/** Mean ≥ this → strong. */
export const TRUST_STRONG_MEAN = 0.34;
/** Mean ≤ this → at risk. */
export const TRUST_AT_RISK_MEAN = -0.34;
/** |later − earlier| at or above this → improving / declining. */
export const TRUST_TREND_DELTA = 0.34;
/** Scored sample below this is low-confidence (still shown, never hidden). */
export const TRUST_LOW_CONFIDENCE_SAMPLE = 3;

export const TRUST_SIGNAL_WEIGHT: Record<TrustSignalKind, number | null> = {
  positive: 1,
  neutral: 0,
  negative: -1,
  unknown: null,
};

export type TrustDirectionalMovement =
  | "improving"
  | "declining"
  | "stable"
  | "insufficient";

/** Overall movement may also be mixed when dimensions disagree. */
export type TrustMovement = TrustDirectionalMovement | "mixed";

export function trustSignalWeight(signal: TrustSignalKind): number | null {
  return TRUST_SIGNAL_WEIGHT[signal];
}

export function meanTrustScores(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, n) => sum + n, 0) / values.length;
}

export function trustLevelFromMean(
  avg: number | null,
  sampleSize: number,
): TrustLevel {
  if (sampleSize === 0 || avg == null) return "unknown";
  if (avg >= TRUST_STRONG_MEAN) return "strong";
  if (avg <= TRUST_AT_RISK_MEAN) return "at_risk";
  return "watch";
}

export function trustTrendFromHalves(chronological: number[]): TrustTrend {
  if (chronological.length < 2) return "unknown";
  const mid = Math.floor(chronological.length / 2);
  const earlier = meanTrustScores(chronological.slice(0, mid));
  const later = meanTrustScores(chronological.slice(mid));
  if (earlier == null || later == null) return "unknown";
  const delta = later - earlier;
  if (delta >= TRUST_TREND_DELTA) return "improving";
  if (delta <= -TRUST_TREND_DELTA) return "declining";
  return "stable";
}

export function trustMovementFromDelta(
  delta: number | null,
  earlierCount: number,
  laterCount: number,
): TrustDirectionalMovement {
  if (earlierCount === 0 || laterCount === 0 || delta == null) {
    return "insufficient";
  }
  if (delta >= TRUST_TREND_DELTA) return "improving";
  if (delta <= -TRUST_TREND_DELTA) return "declining";
  return "stable";
}

export function chronologicalScoredWeights(
  observations: TrustObservation[],
): { at: string; w: number; id: string }[] {
  return observations
    .slice()
    .sort((a, b) => a.observedAt.localeCompare(b.observedAt))
    .map((row) => ({
      at: row.observedAt,
      w: trustSignalWeight(row.signal),
      id: row.id,
    }))
    .filter((row): row is { at: string; w: number; id: string } => row.w != null);
}

export function formatTrustMean(value: number | null): string {
  return value == null ? "n/a" : value.toFixed(2);
}
