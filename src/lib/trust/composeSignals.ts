import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import {
  relationshipHealthFromLabels,
  sentimentLabelFromScore,
} from "@/lib/sentimentAnalysis";
import type { Commitment, CommitmentStatus } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { SentimentLabel } from "@/types/ai";
import { listEvidenceSupportingTrustClaims } from "@/lib/trust/evidence";
import type { EvidenceStub } from "@/types/engagement";

export type PromiseHealth = {
  fulfilled: number;
  broken: number;
  overdue: number;
  open: number;
  in_progress: number;
  cancelled: number;
  sampleSize: number;
  label: "Strong" | "Watch" | "At risk" | "Unknown";
};

export type TrustSignalSnapshot = {
  /** Canonical desk index — same function the Trust pulse widget uses. */
  incidentPulse: ReturnType<typeof trustIndexFromIncidents>;
  relationshipHealth: ReturnType<typeof relationshipHealthFromLabels> | null;
  promiseHealth: PromiseHealth | null;
  evidenceClaimCount: number;
  overlayNote: string;
};

export type ComposeTrustSignalsInput = {
  incidents: Incident[];
  engagements?: Engagement[];
  commitments?: Commitment[];
  evidence?: EvidenceStub[];
  /** When false, skip even if arrays are passed (e.g. Solo). */
  includeRelationshipHealth?: boolean;
  includePromiseHealth?: boolean;
};

const EMPTY_PROMISE: Omit<PromiseHealth, "sampleSize" | "label"> = {
  fulfilled: 0,
  broken: 0,
  overdue: 0,
  open: 0,
  in_progress: 0,
  cancelled: 0,
};

export function promiseHealthFromCommitments(
  rows: Commitment[],
): PromiseHealth {
  const counts = { ...EMPTY_PROMISE };
  for (const row of rows) {
    const status: CommitmentStatus = row.status;
    if (status in counts) {
      counts[status] += 1;
    }
  }
  const sampleSize = rows.length;
  let label: PromiseHealth["label"] = "Unknown";
  if (sampleSize > 0) {
    const strain = counts.broken + counts.overdue;
    if (strain >= Math.max(1, Math.ceil(sampleSize * 0.34))) {
      label = "At risk";
    } else if (
      counts.fulfilled >=
      counts.open + counts.in_progress + counts.overdue + counts.broken
    ) {
      label = "Strong";
    } else {
      label = "Watch";
    }
  }
  return { ...counts, sampleSize, label };
}

function engagementLabel(row: Engagement): SentimentLabel | null {
  if (row.sentimentLabel) return row.sentimentLabel;
  if (typeof row.sentimentScore === "number") {
    return sentimentLabelFromScore(row.sentimentScore);
  }
  return null;
}

/**
 * Derived overlay. Does not write records or change Trust pulse / report numbers.
 * Solo (no SI slices passed) returns only the existing incident pulse.
 */
export function composeTrustSignals(
  input: ComposeTrustSignalsInput,
): TrustSignalSnapshot {
  const incidentPulse = trustIndexFromIncidents(input.incidents);

  const includeRelationship =
    input.includeRelationshipHealth !== false &&
    input.engagements !== undefined;
  const relationshipHealth = includeRelationship
    ? relationshipHealthFromLabels(
        input.engagements!.map(engagementLabel),
        input.engagements!.map((row) =>
          typeof row.sentimentScore === "number" ? row.sentimentScore : null,
        ),
      )
    : null;

  const includePromise =
    input.includePromiseHealth !== false && input.commitments !== undefined;
  const promiseHealth = includePromise
    ? promiseHealthFromCommitments(input.commitments!)
    : null;

  const evidenceClaimCount = input.evidence
    ? listEvidenceSupportingTrustClaims(input.evidence).length
    : 0;

  const overlayNote = [
    "Incident trust index is the existing case-sentiment formula — unchanged.",
    relationshipHealth
      ? "Relationship health is overlay-only (engagement notes)."
      : "Relationship health omitted (not entitled or not supplied).",
    promiseHealth
      ? "Promise health is overlay-only (commitment statuses)."
      : "Promise health omitted (not entitled or not supplied).",
  ].join(" ");

  return {
    incidentPulse,
    relationshipHealth,
    promiseHealth,
    evidenceClaimCount,
    overlayNote,
  };
}
