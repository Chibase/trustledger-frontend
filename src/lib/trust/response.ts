import type {
  StakeholderTrustResponse,
  TrustAttitude,
} from "@/types/trustOverlay";

const ATTITUDES: TrustAttitude[] = ["high", "medium", "low", "unknown"];

export function emptyTrustResponse(): StakeholderTrustResponse {
  return {
    trustSentiment: null,
    willingnessToParticipate: "unknown",
    willingnessToContribute: "unknown",
    confidenceInProcess: "unknown",
    confidenceInImplementer: "unknown",
  };
}

function asAttitude(value: unknown): TrustAttitude {
  return ATTITUDES.includes(value as TrustAttitude)
    ? (value as TrustAttitude)
    : "unknown";
}

/** Fill missing overlay keys without inventing a sentiment label. */
export function normalizeTrustResponse(
  raw?: StakeholderTrustResponse | null,
): StakeholderTrustResponse {
  const base = emptyTrustResponse();
  if (!raw) return base;
  const sentiment = raw.trustSentiment;
  return {
    trustSentiment:
      sentiment === "positive" ||
      sentiment === "neutral" ||
      sentiment === "negative"
        ? sentiment
        : null,
    willingnessToParticipate: asAttitude(raw.willingnessToParticipate),
    willingnessToContribute: asAttitude(raw.willingnessToContribute),
    confidenceInProcess: asAttitude(raw.confidenceInProcess),
    confidenceInImplementer: asAttitude(raw.confidenceInImplementer),
    capturedAt: raw.capturedAt,
  };
}

export function isTrustResponseBlank(
  raw?: StakeholderTrustResponse | null,
): boolean {
  if (!raw) return true;
  const n = normalizeTrustResponse(raw);
  return (
    n.trustSentiment == null &&
    n.willingnessToParticipate === "unknown" &&
    n.willingnessToContribute === "unknown" &&
    n.confidenceInProcess === "unknown" &&
    n.confidenceInImplementer === "unknown"
  );
}
