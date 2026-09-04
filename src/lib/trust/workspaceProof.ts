/**
 * Load TE-3 proof for the signed-in workspace (own-data lists).
 * Shared by the reports panel and the dashboard hub.
 */

import { commitmentService } from "@/services/commitmentService";
import { engagementService } from "@/services/engagementService";
import { stakeholderService } from "@/services/stakeholderService";
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
import type { TrustAnalyticsSlice } from "@/lib/trust/analytics";
import { TRUST_COMPARISON_AXES } from "@/lib/trust/analytics";

export type TrustWorkspaceSummary = {
  movement: TrustProofReport["overallMovement"];
  scoredObservations: number;
  riskCount: number;
  attentionRiskCount: number;
  evidenceBackedClaims: number;
  comparisonSlices: TrustAnalyticsSlice[];
  comparisonAxis: (typeof TRUST_COMPARISON_AXES)[number] | null;
};

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

  return {
    movement: report.overallMovement,
    scoredObservations,
    riskCount: report.risks.length,
    attentionRiskCount,
    evidenceBackedClaims,
    comparisonSlices,
    comparisonAxis,
  };
}
