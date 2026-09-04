/**
 * TE-10 trust-claim verification reading.
 * Linked evidence is not approval. Attendance, participation quality, and
 * Trust pulse never verify a claim. Human apply is required to mark verified.
 */

import type { TrustProofClaim } from "@/lib/trust/proofReport";
import type { TrustDimensionId } from "@/types/trustLayer";

export const TRUST_CLAIM_VERIFICATION_STATUSES = [
  "unevidenced",
  "evidenced",
  "verified",
] as const;

export type TrustClaimVerificationStatus =
  (typeof TRUST_CLAIM_VERIFICATION_STATUSES)[number];

export const TRUST_CLAIM_VERIFICATION_LABELS: Record<
  TrustClaimVerificationStatus,
  string
> = {
  unevidenced: "Unevidenced",
  evidenced: "Evidenced",
  verified: "Verified",
};

export type TrustClaimVerificationStamp = {
  id: string;
  dimension: TrustDimensionId;
  fingerprint: string;
  verifiedAt: string;
  source: "human_apply";
};

export type TrustClaimVerificationReading = {
  dimension: TrustDimensionId;
  status: TrustClaimVerificationStatus;
  fingerprint: string;
  evidenceIds: string[];
  observationIds: string[];
  verifiedAt?: string;
  notes: string[];
};

export type TrustClaimVerificationIndex = {
  total: number;
  byStatus: Record<TrustClaimVerificationStatus, number>;
  linkedEvidenceIsNotVerified: true;
  attendanceDoesNotVerify: true;
  trustPulseUsed: false;
  notes: string[];
};

function uniqueNotes(notes: string[]): string[] {
  return [...new Set(notes.filter((line) => line.length > 0))];
}

export function claimVerificationFingerprint(
  claim: Pick<TrustProofClaim, "dimension" | "evidenceIds" | "observationIds">,
): string {
  const evidence = [...claim.evidenceIds].filter(Boolean).sort();
  const observations = [...claim.observationIds].filter(Boolean).sort();
  return [claim.dimension, ...evidence, ...observations].join("|");
}

function stampFor(
  fingerprint: string,
  stamps: TrustClaimVerificationStamp[],
): TrustClaimVerificationStamp | undefined {
  return stamps.find(
    (row) => row.fingerprint === fingerprint && row.source === "human_apply",
  );
}

/**
 * Linked evidenceIds make a claim evidenced, not verified.
 * Verified only when a human-apply stamp matches this fingerprint.
 */
export function classifyClaimVerification(
  claim: Pick<
    TrustProofClaim,
    "dimension" | "evidenceIds" | "observationIds" | "sampleSize"
  >,
  stamps: TrustClaimVerificationStamp[] = [],
): TrustClaimVerificationReading {
  const fingerprint = claimVerificationFingerprint(claim);
  const notes: string[] = [];
  const stamp = stampFor(fingerprint, stamps);

  if (claim.sampleSize === 0) {
    notes.push("No scored observations; nothing to verify.");
    return {
      dimension: claim.dimension,
      status: "unevidenced",
      fingerprint,
      evidenceIds: claim.evidenceIds,
      observationIds: claim.observationIds,
      notes,
    };
  }

  if (stamp && claim.evidenceIds.length === 0) {
    notes.push(
      "A verification stamp cannot stand without linked evidence. Linked evidence is still required.",
    );
    return {
      dimension: claim.dimension,
      status: "unevidenced",
      fingerprint,
      evidenceIds: claim.evidenceIds,
      observationIds: claim.observationIds,
      notes,
    };
  }

  if (stamp && claim.evidenceIds.length > 0) {
    notes.push(
      "Verified by human apply. Linked evidence is cited; this is not Trust pulse and not a sealed ledger claim.",
    );
    return {
      dimension: claim.dimension,
      status: "verified",
      fingerprint,
      evidenceIds: claim.evidenceIds,
      observationIds: claim.observationIds,
      verifiedAt: stamp.verifiedAt,
      notes,
    };
  }

  if (claim.evidenceIds.length > 0) {
    notes.push(
      "Linked evidence is not verification. A person must apply before this claim is treated as verified.",
    );
    return {
      dimension: claim.dimension,
      status: "evidenced",
      fingerprint,
      evidenceIds: claim.evidenceIds,
      observationIds: claim.observationIds,
      notes,
    };
  }

  notes.push("No evidence ids are linked. Attendance and participation do not verify a trust claim.");
  return {
    dimension: claim.dimension,
    status: "unevidenced",
    fingerprint,
    evidenceIds: claim.evidenceIds,
    observationIds: claim.observationIds,
    notes,
  };
}

export function formatClaimVerificationMix(
  index: Pick<TrustClaimVerificationIndex, "byStatus" | "total">,
): string {
  if (index.total === 0) return "none to verify";
  return TRUST_CLAIM_VERIFICATION_STATUSES.map(
    (key) =>
      `${TRUST_CLAIM_VERIFICATION_LABELS[key].toLowerCase()} ${index.byStatus[key]}`,
  ).join(" · ");
}

export function summarizeClaimVerification(
  claims: Array<
    Pick<
      TrustProofClaim,
      "dimension" | "evidenceIds" | "observationIds" | "sampleSize"
    > & { verification?: TrustClaimVerificationReading }
  >,
  stamps: TrustClaimVerificationStamp[] = [],
): TrustClaimVerificationIndex {
  const scored = claims.filter((row) => row.sampleSize > 0);
  const byStatus: Record<TrustClaimVerificationStatus, number> = {
    unevidenced: 0,
    evidenced: 0,
    verified: 0,
  };
  if (!scored.length) {
    return {
      total: 0,
      byStatus,
      linkedEvidenceIsNotVerified: true,
      attendanceDoesNotVerify: true,
      trustPulseUsed: false,
      notes: [],
    };
  }
  const notes: string[] = [
    "Trust-claim verification is unevidenced / evidenced / verified. Linked evidence is not verification. Attendance does not verify. This is not Trust pulse.",
  ];
  for (const claim of scored) {
    const reading: TrustClaimVerificationReading =
      claim.verification || classifyClaimVerification(claim, stamps);
    byStatus[reading.status] += 1;
  }
  return {
    total: scored.length,
    byStatus,
    linkedEvidenceIsNotVerified: true,
    attendanceDoesNotVerify: true,
    trustPulseUsed: false,
    notes: uniqueNotes(notes),
  };
}

export function summarizeClaimVerificationForIntel(
  claims: Array<
    Pick<
      TrustProofClaim,
      "dimension" | "evidenceIds" | "observationIds" | "sampleSize"
    > & { verification?: TrustClaimVerificationReading }
  >,
  stamps: TrustClaimVerificationStamp[] = [],
): string[] {
  const index = summarizeClaimVerification(claims, stamps);
  if (!index.total) return [];
  return uniqueNotes([
    `Trust-claim verification: ${formatClaimVerificationMix(index)}. Linked evidence is not verification. Attendance does not verify. This mix is not Trust pulse.`,
    ...index.notes.filter(
      (line) => !line.startsWith("Trust-claim verification is unevidenced"),
    ),
  ]);
}

export function newClaimVerificationId(): string {
  return `TCV-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function stampFromClaim(
  claim: Pick<TrustProofClaim, "dimension" | "evidenceIds" | "observationIds">,
  verifiedAt?: string,
): TrustClaimVerificationStamp {
  return {
    id: newClaimVerificationId(),
    dimension: claim.dimension,
    fingerprint: claimVerificationFingerprint(claim),
    verifiedAt: verifiedAt || new Date().toISOString(),
    source: "human_apply",
  };
}
