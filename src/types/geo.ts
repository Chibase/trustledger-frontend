/**
 * Geographic intelligence — multi-country packs (Version 002).
 * Default demo pack: South Africa MDB 2020. Additional packs (BW, NA, …)
 * drop in as sibling JSON under data/geo/.
 */

export type GeoLevel =
  | "country"
  | "province"
  | "region"
  | "district"
  | "local_municipality"
  | "metro"
  | "traditional_council"
  | "ward"
  | "village"
  | "custom";

export type GeoPlaceMeta = Record<string, string | number | boolean | null>;

export type GeoPlace = {
  id: string;
  code: string;
  name: string;
  level: GeoLevel;
  parentId: string | null;
  /** ISO 3166-1 alpha-2 */
  countryCode: string;
  /** Dataset pack, e.g. za-mdb-2020 */
  packId: string;
  lat?: number;
  lng?: number;
  meta?: GeoPlaceMeta;
};

export type SocioEconomicIndicator = {
  placeId: string;
  key: string;
  label: string;
  value: number;
  unit: string;
  year?: number;
  source?: string;
  countryCode?: string;
};

export type GeoPackManifest = {
  id: string;
  countryCode: string;
  countryName: string;
  label: string;
  levels: GeoLevel[];
  sources: string[];
  notes?: string;
};

export type GeoPackFile = {
  pack: GeoPackManifest;
  places: GeoPlace[];
  indicators: SocioEconomicIndicator[];
};
