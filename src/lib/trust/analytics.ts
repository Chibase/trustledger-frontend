/**
 * Deterministic trust analytics on the TE-2 layer.
 * Does not change Trust pulse, report packs, or SRM records.
 */

import { classifyAllTrustDimensions } from "@/lib/trust/status";
import {
  chronologicalScoredWeights,
  formatTrustMean,
  meanTrustScores,
  TRUST_AT_RISK_MEAN,
  TRUST_LOW_CONFIDENCE_SAMPLE,
  TRUST_STRONG_MEAN,
  TRUST_TREND_DELTA,
  trustLevelFromMean,
  trustMovementFromDelta,
  type TrustMovement,
} from "@/lib/trust/scoring";

export type { TrustMovement };
import { STAKEHOLDER_KIND_LABELS } from "@/types/stakeholder";
import type { StakeholderKind } from "@/types/stakeholder";
import type {
  TrustCommunityContext,
  TrustDimensionId,
  TrustDimensionStatus,
  TrustLevel,
  TrustObservation,
  TrustObservationSource,
} from "@/types/trustLayer";

export type TrustComparisonAxis =
  | "community"
  | "location"
  | "stakeholder_group"
  | "project_phase";

export const TRUST_COMPARISON_AXES: TrustComparisonAxis[] = [
  "community",
  "location",
  "stakeholder_group",
  "project_phase",
];

export type TrustPeriodBucket = {
  from: string | null;
  to: string | null;
  count: number;
  mean: number | null;
};

export type TrustPeriodComparison = {
  splitAt: string | null;
  earlier: TrustPeriodBucket;
  later: TrustPeriodBucket;
  delta: number | null;
  movement: Exclude<TrustMovement, "mixed">;
  rule: string;
};

export type TrustAnalyticsSlice = {
  axis: TrustComparisonAxis;
  id: string;
  label: string;
  observationCount: number;
  scoredCount: number;
  meanSignal: number | null;
  level: TrustLevel;
  movement: TrustMovement;
  evidenceIds: string[];
  observationIds: string[];
};

export type TrustRiskKind =
  | "declining_trust"
  | "at_risk_level"
  | "low_confidence"
  | "insufficient_evidence";

export type TrustRiskFlag = {
  id: string;
  kind: TrustRiskKind;
  severity: "watch" | "attention";
  dimension?: TrustDimensionId;
  sliceId?: string;
  axis?: TrustComparisonAxis;
  title: string;
  detail: string;
  evidenceIds: string[];
  observationIds: string[];
};

export type TrustAnalyticsContext = {
  community?: TrustCommunityContext[];
  stakeholders?: { id: string; kind: StakeholderKind }[];
};

export type TrustAnalyticsBundle = {
  statuses: TrustDimensionStatus[];
  period: TrustPeriodComparison;
  overallMovement: TrustMovement;
  comparisons: Record<TrustComparisonAxis, TrustAnalyticsSlice[]>;
  risks: TrustRiskFlag[];
};

const PERIOD_RULE =
  `Scored signals map to +1 / 0 / −1 (unknown dropped). ` +
  `Movement uses later vs earlier mean; improving ≥ +${TRUST_TREND_DELTA}, ` +
  `declining ≤ −${TRUST_TREND_DELTA}, else stable when both halves have scores. ` +
  `Mixed is used only when dimensions disagree.`;

const PHASE_FROM_SOURCE: Record<
  TrustObservationSource,
  { id: string; label: string }
> = {
  incident: { id: "resolution", label: "Resolution (cases)" },
  engagement: { id: "engagement", label: "Engagement" },
  commitment: { id: "delivery", label: "Delivery (commitments)" },
  evidence: { id: "assurance", label: "Assurance (evidence)" },
  stakeholder: { id: "relationship", label: "Relationship" },
  derived: { id: "derived", label: "Derived" },
};

const EMPTY_BUCKET: TrustPeriodBucket = {
  from: null,
  to: null,
  count: 0,
  mean: null,
};

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(Boolean))];
}

function contextForPlace(
  community: TrustCommunityContext[] | undefined,
  placeId: string | null | undefined,
): TrustCommunityContext | undefined {
  if (!placeId || !community?.length) return undefined;
  return community.find((row) => row.placeId === placeId);
}

export function mergeObservationsById(
  ...lists: TrustObservation[][]
): TrustObservation[] {
  const map = new Map<string, TrustObservation>();
  for (const list of lists) {
    for (const row of list) {
      if (!map.has(row.id)) map.set(row.id, row);
    }
  }
  return [...map.values()].sort((a, b) =>
    a.observedAt.localeCompare(b.observedAt),
  );
}

function bucketFromRows(
  rows: { at: string; w: number }[],
): TrustPeriodBucket {
  if (!rows.length) return EMPTY_BUCKET;
  return {
    from: rows[0]!.at,
    to: rows[rows.length - 1]!.at,
    count: rows.length,
    mean: meanTrustScores(rows.map((row) => row.w)),
  };
}

export function compareTrustPeriods(
  observations: TrustObservation[],
  splitAtIso?: string,
): TrustPeriodComparison {
  const scored = chronologicalScoredWeights(observations);
  if (!scored.length) {
    return {
      splitAt: splitAtIso ?? null,
      earlier: EMPTY_BUCKET,
      later: EMPTY_BUCKET,
      delta: null,
      movement: "insufficient",
      rule: PERIOD_RULE,
    };
  }

  let earlierRows: { at: string; w: number }[];
  let laterRows: { at: string; w: number }[];
  let splitAt: string | null;

  if (splitAtIso) {
    splitAt = splitAtIso;
    earlierRows = scored.filter((row) => row.at < splitAtIso);
    laterRows = scored.filter((row) => row.at >= splitAtIso);
  } else {
    const mid = Math.floor(scored.length / 2);
    earlierRows = scored.slice(0, mid);
    laterRows = scored.slice(mid);
    splitAt = laterRows[0]?.at ?? null;
  }

  const earlier = bucketFromRows(earlierRows);
  const later = bucketFromRows(laterRows);
  const delta =
    earlier.mean == null || later.mean == null
      ? null
      : later.mean - earlier.mean;

  return {
    splitAt,
    earlier,
    later,
    delta,
    movement: trustMovementFromDelta(delta, earlier.count, later.count),
    rule: PERIOD_RULE,
  };
}

export function classifyOverallTrustMovement(
  statuses: TrustDimensionStatus[],
  period: TrustPeriodComparison,
): TrustMovement {
  const active = statuses.filter((row) => row.sampleSize > 0);
  if (!active.length) return "insufficient";

  const improving = active.filter((row) => row.trend === "improving").length;
  const declining = active.filter((row) => row.trend === "declining").length;

  if (improving > 0 && declining > 0) return "mixed";
  if (period.movement === "improving" && declining > 0) return "mixed";
  if (period.movement === "declining" && improving > 0) return "mixed";
  if (declining > 0) return "declining";
  if (improving > 0) return "improving";

  if (period.movement === "improving" || period.movement === "declining") {
    return period.movement;
  }

  const anyStable = active.some((row) => row.trend === "stable");
  if (period.movement === "stable" || anyStable) return "stable";
  return "insufficient";
}

function sliceKey(
  axis: TrustComparisonAxis,
  observation: TrustObservation,
  context: TrustAnalyticsContext,
): { id: string; label: string } {
  if (axis === "project_phase") {
    return PHASE_FROM_SOURCE[observation.source];
  }

  if (axis === "stakeholder_group") {
    const id = observation.stakeholderId;
    if (!id) return { id: "ungrouped", label: "Ungrouped" };
    const kind = context.stakeholders?.find((row) => row.id === id)?.kind;
    if (!kind) return { id: "ungrouped", label: "Ungrouped" };
    return { id: kind, label: STAKEHOLDER_KIND_LABELS[kind] };
  }

  const placeId = observation.communityPlaceId || null;
  const ctx = contextForPlace(context.community, placeId);

  if (axis === "community") {
    if (!placeId && !ctx) {
      return { id: "unspecified_community", label: "Unspecified community" };
    }
    const id = placeId || ctx?.placeId || ctx?.communityRef || "unspecified_community";
    const label =
      ctx?.communityRef ||
      ctx?.placeLabel ||
      ctx?.ward ||
      placeId ||
      "Unspecified community";
    return { id, label };
  }

  if (!placeId && !ctx) {
    return { id: "unspecified_location", label: "Unspecified location" };
  }
  const id =
    ctx?.municipality ||
    ctx?.ward ||
    placeId ||
    ctx?.placeId ||
    "unspecified_location";
  const label =
    ctx?.municipality ||
    ctx?.ward ||
    ctx?.placeLabel ||
    placeId ||
    "Unspecified location";
  return { id, label };
}

function sliceFromRows(
  axis: TrustComparisonAxis,
  id: string,
  label: string,
  rows: TrustObservation[],
): TrustAnalyticsSlice {
  const period = compareTrustPeriods(rows);
  const scored = chronologicalScoredWeights(rows);
  const meanSignal = meanTrustScores(scored.map((row) => row.w));
  const statuses = classifyAllTrustDimensions(rows);
  const movement = classifyOverallTrustMovement(statuses, period);
  return {
    axis,
    id,
    label,
    observationCount: rows.length,
    scoredCount: scored.length,
    meanSignal,
    level: trustLevelFromMean(meanSignal, scored.length),
    movement,
    evidenceIds: uniqueIds(rows.flatMap((row) => row.evidenceIds)),
    observationIds: rows.map((row) => row.id),
  };
}

export function compareTrustByAxis(
  observations: TrustObservation[],
  axis: TrustComparisonAxis,
  context: TrustAnalyticsContext = {},
): TrustAnalyticsSlice[] {
  const groups = new Map<string, { label: string; rows: TrustObservation[] }>();
  for (const row of observations) {
    const key = sliceKey(axis, row, context);
    const current = groups.get(key.id);
    if (current) {
      current.rows.push(row);
    } else {
      groups.set(key.id, { label: key.label, rows: [row] });
    }
  }
  return [...groups.entries()]
    .map(([id, group]) => sliceFromRows(axis, id, group.label, group.rows))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function compareTrustAcrossAxes(
  observations: TrustObservation[],
  context: TrustAnalyticsContext = {},
): Record<TrustComparisonAxis, TrustAnalyticsSlice[]> {
  return {
    community: compareTrustByAxis(observations, "community", context),
    location: compareTrustByAxis(observations, "location", context),
    stakeholder_group: compareTrustByAxis(
      observations,
      "stakeholder_group",
      context,
    ),
    project_phase: compareTrustByAxis(observations, "project_phase", context),
  };
}

function evidenceForDimension(
  observations: TrustObservation[],
  dimension: TrustDimensionId,
): { evidenceIds: string[]; observationIds: string[] } {
  const rows = observations.filter((row) => row.dimension === dimension);
  return {
    evidenceIds: uniqueIds(rows.flatMap((row) => row.evidenceIds)),
    observationIds: rows.map((row) => row.id),
  };
}

export function detectTrustRisks(input: {
  observations: TrustObservation[];
  statuses?: TrustDimensionStatus[];
  comparisons?: Record<TrustComparisonAxis, TrustAnalyticsSlice[]>;
}): TrustRiskFlag[] {
  const statuses =
    input.statuses || classifyAllTrustDimensions(input.observations);
  const flags: TrustRiskFlag[] = [];

  for (const status of statuses) {
    const linked = evidenceForDimension(input.observations, status.dimension);
    if (status.trend === "declining") {
      flags.push({
        id: `declining_trust:${status.dimension}`,
        kind: "declining_trust",
        severity: "attention",
        dimension: status.dimension,
        title: `${status.dimension.replaceAll("_", " ")} trust is declining`,
        detail: status.rationale,
        evidenceIds: linked.evidenceIds,
        observationIds: linked.observationIds,
      });
    }
    if (status.level === "at_risk") {
      flags.push({
        id: `at_risk_level:${status.dimension}`,
        kind: "at_risk_level",
        severity: "attention",
        dimension: status.dimension,
        title: `${status.dimension.replaceAll("_", " ")} trust is at risk`,
        detail: `Mean is at or below ${TRUST_AT_RISK_MEAN} (strong ≥ ${TRUST_STRONG_MEAN}). ${status.rationale}`,
        evidenceIds: linked.evidenceIds,
        observationIds: linked.observationIds,
      });
    }
    if (status.sampleSize > 0 && status.sampleSize < TRUST_LOW_CONFIDENCE_SAMPLE) {
      flags.push({
        id: `low_confidence:${status.dimension}`,
        kind: "low_confidence",
        severity: "watch",
        dimension: status.dimension,
        title: `${status.dimension.replaceAll("_", " ")} has a small sample`,
        detail: `${status.sampleSize} scored observation(s); below ${TRUST_LOW_CONFIDENCE_SAMPLE} is low confidence. The reading is still shown.`,
        evidenceIds: linked.evidenceIds,
        observationIds: linked.observationIds,
      });
    }
    if (
      (status.trend === "declining" || status.level === "at_risk") &&
      linked.evidenceIds.length === 0 &&
      status.sampleSize > 0
    ) {
      flags.push({
        id: `insufficient_evidence:${status.dimension}`,
        kind: "insufficient_evidence",
        severity: "attention",
        dimension: status.dimension,
        title: `${status.dimension.replaceAll("_", " ")} lacks linked evidence`,
        detail:
          "This dimension is declining or at risk and none of its observations cite evidence ids.",
        evidenceIds: [],
        observationIds: linked.observationIds,
      });
    }
  }

  const communitySlices =
    input.comparisons?.community ||
    compareTrustByAxis(input.observations, "community");
  for (const slice of communitySlices) {
    if (slice.scoredCount > 0 && slice.scoredCount < TRUST_LOW_CONFIDENCE_SAMPLE) {
      flags.push({
        id: `low_confidence:community:${slice.id}`,
        kind: "low_confidence",
        severity: "watch",
        axis: "community",
        sliceId: slice.id,
        title: `${slice.label} has insufficient sample`,
        detail: `${slice.scoredCount} scored observation(s) in this community (need ${TRUST_LOW_CONFIDENCE_SAMPLE} for confidence).`,
        evidenceIds: slice.evidenceIds,
        observationIds: slice.observationIds,
      });
    }
    if (slice.scoredCount > 0 && slice.evidenceIds.length === 0) {
      flags.push({
        id: `insufficient_evidence:community:${slice.id}`,
        kind: "insufficient_evidence",
        severity: "watch",
        axis: "community",
        sliceId: slice.id,
        title: `${slice.label} has no linked evidence`,
        detail:
          "This community has scored trust observations but none cite evidence ids.",
        evidenceIds: [],
        observationIds: slice.observationIds,
      });
    }
  }

  return flags.sort((a, b) => {
    const severityRank = { attention: 0, watch: 1 };
    const bySeverity = severityRank[a.severity] - severityRank[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return a.id.localeCompare(b.id);
  });
}

export function analyzeTrust(
  observations: TrustObservation[],
  context: TrustAnalyticsContext = {},
): TrustAnalyticsBundle {
  const statuses = classifyAllTrustDimensions(observations);
  const period = compareTrustPeriods(observations);
  const overallMovement = classifyOverallTrustMovement(statuses, period);
  const comparisons = compareTrustAcrossAxes(observations, context);
  const risks = detectTrustRisks({ observations, statuses, comparisons });
  return {
    statuses,
    period,
    overallMovement,
    comparisons,
    risks,
  };
}

export function describeTrustMovement(movement: TrustMovement): string {
  if (movement === "improving") {
    return "Trust is improving: the later period (or later half of observations) scored higher by at least the 0.34 threshold, and no dimension is moving the other way.";
  }
  if (movement === "declining") {
    return "Trust is declining: the later period scored lower by at least the 0.34 threshold, or a dimension trend is declining without an offsetting improvement.";
  }
  if (movement === "mixed") {
    return "Trust is mixed: at least one dimension is improving while another is declining, or the overall period conflicts with a dimension trend.";
  }
  if (movement === "stable") {
    return "Trust is stable: later vs earlier means stayed inside ±0.34, and no dimension is classified as improving or declining.";
  }
  return "Trust movement is insufficient to classify: there are not enough scored observations in both halves of the timeline.";
}

export function analyticsRuleSummary(): string {
  return (
    `Level uses mean of +1 / 0 / −1 (unknown dropped): strong ≥ ${TRUST_STRONG_MEAN}, ` +
    `at risk ≤ ${TRUST_AT_RISK_MEAN}, else watch. ` +
    `Trend and period movement use later vs earlier mean with delta ±${TRUST_TREND_DELTA}. ` +
    `Low confidence is a scored sample below ${TRUST_LOW_CONFIDENCE_SAMPLE}. ` +
    `This is not the incident Trust pulse.`
  );
}

export { formatTrustMean };
