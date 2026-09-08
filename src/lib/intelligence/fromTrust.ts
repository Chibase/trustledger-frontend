/**
 * Read-only adapters from existing TE-4 trust intelligence onto I-01 contracts.
 * Does not change Trust layer types, persistence, or UI.
 */

import { createIntelligenceProvenance } from "@/lib/intelligence/foundation";
import type { TrustRecommendation, TrustTrace } from "@/lib/trust/rules";
import type {
  IntelligenceProvenance,
  IntelligenceRecommendationRecord,
  IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";

export function recordRefsFromTrustTrace(trace: TrustTrace): IntelligenceRecordRef[] {
  const refs: IntelligenceRecordRef[] = [];
  for (const id of trace.observationIds) {
    refs.push({ kind: "observation", id });
  }
  for (const id of trace.evidenceIds) {
    refs.push({ kind: "evidence", id });
  }
  for (const id of trace.incidentIds) {
    refs.push({ kind: "incident", id });
  }
  return refs;
}

export function provenanceFromTrustTrace(trace: TrustTrace): IntelligenceProvenance {
  return createIntelligenceProvenance({
    producer: "rule",
    recordRefs: recordRefsFromTrustTrace(trace),
    method: {
      kind: "rule",
      id: trace.ruleId,
      summary: trace.ruleSummary,
    },
    humanReviewed: false,
  });
}

export function commonRecommendationFromTrust(
  rec: TrustRecommendation,
): IntelligenceRecommendationRecord {
  return {
    id: rec.id,
    stage: "recommendation",
    domain: "trust",
    title: rec.title,
    action: rec.action,
    rationale: rec.rationale,
    provenance: provenanceFromTrustTrace(rec.trace),
    governance: {
      decision: rec.decision,
      humanApplyRequired: rec.humanApplyRequired,
      autonomous: rec.autonomous,
    },
  };
}
