import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import {
  allPlaces,
  getDefaultGeoPack,
  getGeoPack,
  listGeoPackManifests,
  placeIndex,
} from "@/lib/geoSeed";
import type {
  GeoLevel,
  GeoPackFile,
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

async function seedPlaces(filters: GeoListFilters): Promise<GeoPlace[]> {
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
  return rows.slice(0, limit);
}

export const geoService = {
  async listPacks(): Promise<GeoPackManifest[]> {
    return delay(listGeoPackManifests());
  },

  async getPack(packId?: string): Promise<GeoPackFile | null> {
    return delay(packId ? getGeoPack(packId) : getDefaultGeoPack());
  },

  async listPlaces(filters: GeoListFilters = {}): Promise<GeoPlace[]> {
    if (isLiveMode()) {
      try {
        const rows = await callFrappeMethod<GeoPlace[]>(
          FRAPPE_METHODS.listGeoPlaces,
          {
            parentId: filters.parentId ?? undefined,
            level: filters.level,
            countryCode: filters.countryCode,
            query: filters.query,
            limit: filters.limit,
          },
        );
        if (Array.isArray(rows) && rows.length) return rows;
      } catch {
        /* seed pack */
      }
    }
    return delay(await seedPlaces(filters));
  },

  async getPlace(id: string, packId?: string): Promise<GeoPlace | null> {
    if (isLiveMode()) {
      try {
        const row = await callFrappeMethod<GeoPlace | null>(
          FRAPPE_METHODS.getGeoPlace,
          { name: id },
        );
        if (row) return row;
      } catch {
        /* seed */
      }
    }
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
    if (isLiveMode()) {
      try {
        const rows = await callFrappeMethod<SocioEconomicIndicator[]>(
          FRAPPE_METHODS.listSocioIndicators,
          { placeId },
        );
        if (Array.isArray(rows)) return rows;
      } catch {
        /* seed */
      }
    }
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
