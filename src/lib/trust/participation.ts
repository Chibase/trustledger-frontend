import { normalizeTrustResponse } from "@/lib/trust/response";
import type {
  StakeholderTrustResponse,
  TrustAttitude,
} from "@/types/trustOverlay";
import type {
  TrustObservationSource,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export function newTrustParticipationId(): string {
  return `TRP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function asAttitude(value: unknown): TrustAttitude {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "unknown";
}

export function participationLooksTrustDriven(
  willingnessToParticipate: TrustAttitude,
  confidenceInProcess: TrustAttitude,
  confidenceInImplementer: TrustAttitude,
): boolean | "unknown" {
  const confidenceHigh =
    confidenceInProcess === "high" || confidenceInImplementer === "high";
  const confidenceLow =
    confidenceInProcess === "low" || confidenceInImplementer === "low";
  if (willingnessToParticipate === "high" && confidenceHigh) return true;
  if (willingnessToParticipate === "high" && confidenceLow) return false;
  if (
    willingnessToParticipate === "unknown" &&
    confidenceInProcess === "unknown" &&
    confidenceInImplementer === "unknown"
  ) {
    return "unknown";
  }
  if (willingnessToParticipate === "low") return false;
  return "unknown";
}

export function createTrustParticipation(input: {
  id?: string;
  observedAt?: string;
  source: TrustObservationSource;
  sourceId?: string;
  projectId?: string | null;
  stakeholderId?: string | null;
  willingnessToParticipate?: TrustAttitude;
  willingnessToContribute?: TrustAttitude;
  trustDriven?: boolean | "unknown";
  confidenceInProcess?: TrustAttitude;
  confidenceInImplementer?: TrustAttitude;
  note?: string;
}): TrustParticipationRecord {
  const willingnessToParticipate = asAttitude(input.willingnessToParticipate);
  const willingnessToContribute = asAttitude(input.willingnessToContribute);
  const trustDriven =
    input.trustDriven !== undefined
      ? input.trustDriven
      : participationLooksTrustDriven(
          willingnessToParticipate,
          asAttitude(input.confidenceInProcess),
          asAttitude(input.confidenceInImplementer),
        );
  return {
    id: input.id || newTrustParticipationId(),
    layer: "trust",
    observedAt: input.observedAt || new Date().toISOString(),
    source: input.source,
    sourceId: input.sourceId,
    projectId: input.projectId ?? null,
    stakeholderId: input.stakeholderId ?? null,
    willingnessToParticipate,
    willingnessToContribute,
    trustDriven,
    note: input.note,
  };
}

/** Build a participation row from a TE-1 overlay if any attitude is present. */
export function participationFromTrustResponse(
  response: StakeholderTrustResponse | null | undefined,
  meta: {
    id?: string;
    source: TrustObservationSource;
    sourceId?: string;
    projectId?: string | null;
    stakeholderId?: string | null;
    observedAt?: string;
  },
): TrustParticipationRecord | null {
  if (!response) return null;
  const n = normalizeTrustResponse(response);
  const blank =
    n.willingnessToParticipate === "unknown" &&
    n.willingnessToContribute === "unknown" &&
    n.confidenceInProcess === "unknown" &&
    n.confidenceInImplementer === "unknown";
  if (blank && n.trustSentiment == null) return null;
  return createTrustParticipation({
    id: meta.id,
    ...meta,
    observedAt: meta.observedAt || n.capturedAt,
    willingnessToParticipate: n.willingnessToParticipate,
    willingnessToContribute: n.willingnessToContribute,
    confidenceInProcess: n.confidenceInProcess,
    confidenceInImplementer: n.confidenceInImplementer,
  });
}
