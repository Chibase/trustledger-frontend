import { allTrustDimensions } from "@/lib/trust/dimensions";
import {
  chronologicalScoredWeights,
  meanTrustScores,
  TRUST_AT_RISK_MEAN,
  TRUST_STRONG_MEAN,
  trustLevelFromMean,
  trustTrendFromHalves,
} from "@/lib/trust/scoring";
import { TRUST_DIMENSION_LABELS } from "@/types/trustLayer";
import type {
  TrustDimensionId,
  TrustDimensionStatus,
  TrustObservation,
} from "@/types/trustLayer";

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
  const scored = chronologicalScoredWeights(rows);

  const avg = meanTrustScores(scored.map((row) => row.w));
  const level = trustLevelFromMean(avg, scored.length);
  const trend = trustTrendFromHalves(scored.map((row) => row.w));
  const lastObservedAt = rows.length ? rows[rows.length - 1]!.observedAt : null;

  const avgBit =
    avg == null ? "no scored signals" : `mean ${avg.toFixed(2)} on −1…+1`;
  const rationale = `${TRUST_DIMENSION_LABELS[dimension]}: ${scored.length} scored of ${rows.length} observations (${avgBit}). Level ${level} (strong ≥ ${TRUST_STRONG_MEAN}, at risk ≤ ${TRUST_AT_RISK_MEAN}). Trend ${trend} from later vs earlier half.`;

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
  return allTrustDimensions().map((dimension) =>
    classifyTrustDimension(dimension, observations),
  );
}
