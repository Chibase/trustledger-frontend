import {
  TRUST_DIMENSIONS,
  TRUST_DIMENSION_LABELS,
  type TrustDimensionId,
} from "@/types/trustLayer";

export function isTrustDimensionId(value: unknown): value is TrustDimensionId {
  return (
    typeof value === "string" &&
    (TRUST_DIMENSIONS as readonly string[]).includes(value)
  );
}

export function trustDimensionLabel(id: TrustDimensionId): string {
  return TRUST_DIMENSION_LABELS[id];
}

export function allTrustDimensions(): TrustDimensionId[] {
  return [...TRUST_DIMENSIONS];
}
