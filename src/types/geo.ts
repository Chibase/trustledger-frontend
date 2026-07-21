/**
 * Geographic hierarchy for SA stakeholder context (Version 002).
 * Aligns with TEDS Domain 1 — Geographic Intelligence.
 */

export type GeoLevel =
  | "country"
  | "province"
  | "district"
  | "local_municipality"
  | "metro"
  | "traditional_council"
  | "ward"
  | "village";

export type GeoPlace = {
  id: string;
  code: string;
  name: string;
  level: GeoLevel;
  parentId: string | null;
  /** Optional WGS84 */
  lat?: number;
  lng?: number;
};

/** Socio-economic indicator attached to a place (ingest from CSV later). */
export type SocioEconomicIndicator = {
  placeId: string;
  key: string;
  label: string;
  value: number;
  unit: string;
  year?: number;
  source?: string;
};
