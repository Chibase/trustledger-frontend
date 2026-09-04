/**
 * Load TE-3 proof for the signed-in workspace (own-data lists).
 * Shared by the reports panel and the dashboard hub.
 */

import { commitmentService } from "@/services/commitmentService";
import { engagementService } from "@/services/engagementService";
import { stakeholderService } from "@/services/stakeholderService";
import { canonicalTrustDimensionId } from "@/lib/trust/dimensions";
import { getActiveOrgId } from "@/lib/orgStore";
import { getTrustLayerBucket } from "@/lib/trust/layerStore";
import {
  buildTrustProofFromSrm,
  type TrustProofReport,
} from "@/lib/trust/proofReport";
import {
  listWorkspaceEvidence,
  listWorkspaceIncidents,
} from "@/lib/workspaceData";
import {
  TRUST_COMPARISON_AXES,
  type TrustAnalyticsSlice,
  type TrustComparisonAxis,
  type TrustPeriodComparison,
} from "@/lib/trust/analytics";
import { meanTrustScores, trustSignalWeight } from "@/lib/trust/scoring";
import {
  TRUST_DIMENSION_LABELS,
  type TrustDimensionId,
  type TrustLevel,
  type TrustTrend,
} from "@/types/trustLayer";

export type TrustWorkspaceDimensionRow = {
  dimension: TrustDimensionId;
  label: string;
  level: TrustLevel;
  trend: TrustTrend;
  sampleSize: number;
  mean: number | null;
};

export type TrustWorkspacePeriodSummary = {
  movement: TrustPeriodComparison["movement"];
  earlierMean: number | null;
  laterMean: number | null;
  earlierCount: number;
  laterCount: number;
  delta: number | null;
};

export type TrustWorkspaceSummary = {
  movement: TrustProofReport["overallMovement"];
  scoredObservations: number;
  riskCount: number;
  attentionRiskCount: number;
  evidenceBackedClaims: number;
  comparisonSlices: TrustAnalyticsSlice[];
  comparisonAxis: (typeof TRUST_COMPARISON_AXES)[number] | null;
  comparisons: Record<TrustComparisonAxis, TrustAnalyticsSlice[]>;
  period: TrustWorkspacePeriodSummary;
  dimensions: TrustWorkspaceDimensionRow[];
};

/** Map mean −1…+1 onto 0–100 for charts. 50 = watch. Not Trust pulse. */
export function trustMeanToDisplay(mean: number | null): number | null {
  if (mean == null) return null;
  return Math.round((mean + 1) * 50);
}

export async function loadWorkspaceTrustProof(): Promise<TrustProofReport> {
  const [engagements, commitments, stakeholders] = await Promise.all([
    engagementService.list(),
    commitmentService.list(),
    stakeholderService.list(),
  ]);
  const orgId = getActiveOrgId();
  const stored = orgId ? getTrustLayerBucket(orgId) : null;
  return buildTrustProofFromSrm(
    {
      incidents: listWorkspaceIncidents(),
      engagements,
      commitments,
      evidence: listWorkspaceEvidence(),
      stakeholders,
    },
    {
      storedObservations: stored?.observations,
      storedParticipation: stored?.participation,
      storedCommunity: stored?.community,
    },
  );
}

export function summarizeTrustWorkspace(
  report: TrustProofReport,
): TrustWorkspaceSummary {
  const scoredObservations = report.history.filter(
    (row) => row.signal !== "unknown",
  ).length;
  const evidenceBackedClaims = report.claims.filter(
    (row) => row.evidenceIds.length > 0,
  ).length;
  const attentionRiskCount = report.risks.filter(
    (row) => row.severity === "attention",
  ).length;

  let comparisonAxis: TrustWorkspaceSummary["comparisonAxis"] = null;
  let comparisonSlices: TrustAnalyticsSlice[] = [];
  for (const axis of TRUST_COMPARISON_AXES) {
    const slices = report.comparisons[axis] || [];
    if (slices.some((row) => row.scoredCount > 0)) {
      comparisonAxis = axis;
      comparisonSlices = slices;
      break;
    }
  }

  const comparisons = {} as Record<TrustComparisonAxis, TrustAnalyticsSlice[]>;
  for (const axis of TRUST_COMPARISON_AXES) {
    comparisons[axis] = report.comparisons[axis] || [];
  }

  const dimensions: TrustWorkspaceDimensionRow[] = report.claims.map(
    (claim) => {
      const weights = report.history
        .filter(
          (row) =>
            canonicalTrustDimensionId(row.dimension) === claim.dimension,
        )
        .map((row) => trustSignalWeight(row.signal))
        .filter((w): w is number => w != null);
      return {
        dimension: claim.dimension,
        label: TRUST_DIMENSION_LABELS[claim.dimension],
        level: claim.level,
        trend: claim.trend,
        sampleSize: claim.sampleSize,
        mean: meanTrustScores(weights),
      };
    },
  );

  return {
    movement: report.overallMovement,
    scoredObservations,
    riskCount: report.risks.length,
    attentionRiskCount,
    evidenceBackedClaims,
    comparisonSlices,
    comparisonAxis,
    comparisons,
    period: {
      movement: report.period.movement,
      earlierMean: report.period.earlier.mean,
      laterMean: report.period.later.mean,
      earlierCount: report.period.earlier.count,
      laterCount: report.period.later.count,
      delta: report.period.delta,
    },
    dimensions,
  };
}
