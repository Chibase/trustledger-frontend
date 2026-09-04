import {
  TRUST_DIMENSIONS,
  TRUST_DIMENSION_ALIASES,
  TRUST_DIMENSION_LABELS,
  type TrustDimensionId,
} from "@/types/trustLayer";

/** Canonical id, including the retired `intentions` alias. */
export function canonicalTrustDimensionId(
  value: unknown,
): TrustDimensionId | null {
  if (typeof value !== "string" || !value) return null;
  if ((TRUST_DIMENSIONS as readonly string[]).includes(value)) {
    return value as TrustDimensionId;
  }
  return TRUST_DIMENSION_ALIASES[value] ?? null;
}

export function isTrustDimensionId(value: unknown): value is TrustDimensionId {
  return canonicalTrustDimensionId(value) != null;
}

export function trustDimensionLabel(id: TrustDimensionId): string {
  return TRUST_DIMENSION_LABELS[id];
}

export function allTrustDimensions(): TrustDimensionId[] {
  return [...TRUST_DIMENSIONS];
}
