/**
 * TE-1 trust overlay — optional, frontend-only shapes.
 * Not Cloud DocTypes. Existing sentiment / evidence / geo fields stay canonical.
 * Cloud mappers must omit these keys (see productCloud / siCloud).
 */

/** Same scale as existing SentimentLabel; kept local to avoid import cycles. */
export type TrustSentimentLabel = "positive" | "neutral" | "negative";

export type TrustAttitude = "high" | "medium" | "low" | "unknown";

/**
 * Later capture on engagements, incidents, or stakeholders.
 * Does not replace `sentimentLabel` / `sentimentScore`.
 */
export type StakeholderTrustResponse = {
  trustSentiment?: TrustSentimentLabel | null;
  willingnessToParticipate?: TrustAttitude;
  willingnessToContribute?: TrustAttitude;
  confidenceInProcess?: TrustAttitude;
  confidenceInImplementer?: TrustAttitude;
  /** Blueprint: trust in fairness of treatment / allocation. */
  confidenceInFairness?: TrustAttitude;
  /** Blueprint: trust that concerns will be acted upon. */
  confidenceConcernsActedUpon?: TrustAttitude;
  capturedAt?: string;
};

export type TrustClaimKind =
  | "promise_kept"
  | "promise_broken"
  | "repair_complete"
  | "consultation_held"
  | "identity"
  | "other";

/** Optional annotation on existing evidence rows — does not change status/workflow. */
export type EvidenceTrustSupport = {
  supportsTrustClaim?: boolean;
  claimKind?: TrustClaimKind;
  relatedCommitmentId?: string | null;
  relatedEngagementId?: string | null;
  note?: string;
};

export type TrustSocialLicenceRisk = "low" | "medium" | "high";

export type TrustTriageOverlay = {
  socialLicenceRisk: TrustSocialLicenceRisk;
  rationale: string;
};

export type TrustDraftOverlay = {
  trustSensitive: boolean;
  notes: string[];
};

export type TrustReportSummaryOverlay = {
  citedCaseCount: number;
  headline: string;
};

/** Domain keys that must never be posted to Frappe resource APIs. */
export const TRUST_OVERLAY_CLOUD_OMIT = [
  "trustResponse",
  "trustSupport",
] as const;

/** Strip overlay keys from a Cloud SI / resource payload. Mapper still posts explicit fields only. */
export function omitCloudTrustOverlay<T extends object>(
  row: T,
): Omit<T, "trustResponse" | "trustSupport"> {
  const next = { ...row } as T & {
    trustResponse?: unknown;
    trustSupport?: unknown;
  };
  delete next.trustResponse;
  delete next.trustSupport;
  return next;
}
