/**
 * Trust-barrier tags for community context.
 * Optional, open-ended — not a single global template.
 */

import {
  TRUST_BARRIER_IDS,
  type TrustBarrierId,
} from "@/types/trustLayer";

export const TRUST_BARRIER_LABELS: Record<TrustBarrierId, string> = {
  connectivity: "Connectivity / airtime / signal",
  literacy: "Literacy / written forms",
  language: "Language / translation",
  distance: "Distance / travel",
  time_season: "Time of day / season",
  customary_protocol: "Customary protocol",
  gender_access: "Gendered access",
  distrust: "Distrust of the process or actor",
  other: "Other (describe in notes)",
};

export function isTrustBarrierId(value: unknown): value is TrustBarrierId {
  return TRUST_BARRIER_IDS.includes(value as TrustBarrierId);
}

export function normalizeBarrierTags(values: unknown): TrustBarrierId[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<TrustBarrierId>();
  for (const value of values) {
    if (isTrustBarrierId(value)) seen.add(value);
  }
  return TRUST_BARRIER_IDS.filter((id) => seen.has(id));
}

const NOTE_HINTS: { id: TrustBarrierId; pattern: RegExp }[] = [
  { id: "connectivity", pattern: /\b(connectivity|airtime|signal|offline|low[- ]connectivity)\b/i },
  { id: "literacy", pattern: /\b(literacy|illitera|written form)\b/i },
  { id: "language", pattern: /\b(language|translat|interpreter|isiZulu|isiXhosa|Sesotho)\b/i },
  { id: "distance", pattern: /\b(distance|travel|far from|transport)\b/i },
  { id: "time_season", pattern: /\b(season|planting|harvest|after dark|time of day)\b/i },
  { id: "customary_protocol", pattern: /\b(customary|protocol|traditional council|imbizo)\b/i },
  { id: "gender_access", pattern: /\b(gender|women only|men only)\b/i },
  { id: "distrust", pattern: /\b(distrust|mistrust|no confidence)\b/i },
];

/** Conservative hints from free text. Never replaces the notes themselves. */
export function inferBarrierTagsFromNotes(notes?: string): TrustBarrierId[] {
  const text = (notes || "").trim();
  if (!text) return [];
  return NOTE_HINTS.filter((row) => row.pattern.test(text)).map((row) => row.id);
}
