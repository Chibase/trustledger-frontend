import { isTrustDimensionId } from "@/lib/trust/dimensions";
import type {
  TrustObservation,
  TrustObservationSource,
  TrustSignalKind,
} from "@/types/trustLayer";

const SOURCES: TrustObservationSource[] = [
  "incident",
  "engagement",
  "commitment",
  "evidence",
  "stakeholder",
  "derived",
];

const SIGNALS: TrustSignalKind[] = [
  "positive",
  "neutral",
  "negative",
  "unknown",
];

export function newTrustObservationId(): string {
  return `TRO-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function asSignal(value: unknown): TrustSignalKind {
  return SIGNALS.includes(value as TrustSignalKind)
    ? (value as TrustSignalKind)
    : "unknown";
}

function asSource(value: unknown): TrustObservationSource {
  return SOURCES.includes(value as TrustObservationSource)
    ? (value as TrustObservationSource)
    : "derived";
}

export type TrustObservationDraft = Omit<
  TrustObservation,
  "id" | "layer" | "evidenceIds" | "observedAt"
> & {
  id?: string;
  observedAt?: string;
  evidenceIds?: string[];
};

export function createTrustObservation(
  draft: TrustObservationDraft,
): TrustObservation {
  if (!isTrustDimensionId(draft.dimension)) {
    throw new Error("createTrustObservation: unknown trust dimension");
  }
  const evidenceIds = Array.isArray(draft.evidenceIds)
    ? draft.evidenceIds.map(String).filter(Boolean)
    : [];
  return {
    id: draft.id || newTrustObservationId(),
    layer: "trust",
    observedAt: draft.observedAt || new Date().toISOString(),
    dimension: draft.dimension,
    signal: asSignal(draft.signal),
    signalScore:
      typeof draft.signalScore === "number" ? draft.signalScore : null,
    source: asSource(draft.source),
    sourceId: draft.sourceId,
    projectId: draft.projectId ?? null,
    communityPlaceId: draft.communityPlaceId ?? null,
    stakeholderId: draft.stakeholderId ?? null,
    evidenceIds,
    note: draft.note,
  };
}

export function normalizeTrustObservation(
  raw: Partial<TrustObservation> | null | undefined,
): TrustObservation | null {
  if (!raw || !isTrustDimensionId(raw.dimension)) return null;
  return createTrustObservation({
    id: raw.id,
    observedAt: raw.observedAt,
    dimension: raw.dimension,
    signal: raw.signal ?? "unknown",
    signalScore: raw.signalScore,
    source: raw.source ?? "derived",
    sourceId: raw.sourceId,
    projectId: raw.projectId,
    communityPlaceId: raw.communityPlaceId,
    stakeholderId: raw.stakeholderId,
    evidenceIds: raw.evidenceIds,
    note: raw.note,
  });
}
