import {
  allPlaces,
  getDefaultGeoPack,
  getGeoPack,
  listGeoPackManifests,
  placeIndex,
} from "@/lib/geoSeed";
import type {
  GeoLevel,
  GeoPackManifest,
  GeoPlace,
  SocioEconomicIndicator,
} from "@/types/geo";

function delay<T>(value: T, ms = 40): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export type GeoListFilters = {
  packId?: string;
  parentId?: string | null;
  level?: GeoLevel;
  countryCode?: string;
  query?: string;
  limit?: number;
};

export const geoService = {
  async listPacks(): Promise<GeoPackManifest[]> {
    return delay(listGeoPackManifests());
  },

  async getPack(packId?: string) {
    return delay(packId ? getGeoPack(packId) : getDefaultGeoPack());
  },

  async listPlaces(filters: GeoListFilters = {}): Promise<GeoPlace[]> {
    const packId = filters.packId;
    let rows = packId ? allPlaces(packId) : allPlaces();
    if (filters.countryCode) {
      rows = rows.filter((p) => p.countryCode === filters.countryCode);
    }
    if (filters.parentId !== undefined) {
      rows = rows.filter((p) => p.parentId === filters.parentId);
    }
    if (filters.level) {
      rows = rows.filter((p) => p.level === filters.level);
    }
    if (filters.query?.trim()) {
      const q = filters.query.trim().toLowerCase();
      rows = rows.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.code.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      );
    }
    const limit = filters.limit ?? 500;
    return delay(rows.slice(0, limit));
  },

  async getPlace(id: string, packId?: string): Promise<GeoPlace | null> {
    return delay(placeIndex(packId).get(id) ?? null);
  },

  async listWards(packId?: string, parentMuniId?: string): Promise<GeoPlace[]> {
    return this.listPlaces({
      packId,
      level: "ward",
      parentId: parentMuniId,
      limit: 5000,
    });
  },

  async indicatorsForPlace(placeId: string): Promise<SocioEconomicIndicator[]> {
    const pack = getDefaultGeoPack();
    const rows = (pack?.indicators ?? []).filter((i) => i.placeId === placeId);
    return delay(rows);
  },

  async breadcrumbs(placeId: string, packId?: string): Promise<GeoPlace[]> {
    const byId = placeIndex(packId);
    const chain: GeoPlace[] = [];
    let current = byId.get(placeId);
    while (current) {
      chain.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return delay(chain);
  },

  async countsByLevel(packId?: string): Promise<Record<string, number>> {
    const rows = packId ? allPlaces(packId) : allPlaces();
    const out: Record<string, number> = {};
    for (const p of rows) {
      out[p.level] = (out[p.level] ?? 0) + 1;
    }
    return delay(out);
  },
};
