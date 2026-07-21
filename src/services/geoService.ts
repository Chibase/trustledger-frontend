import {
  mockGeoPlaces,
  mockSocioEconomicIndicators,
} from "@/data/mock/geo";
import type { GeoPlace, SocioEconomicIndicator } from "@/types/geo";

function delay<T>(value: T, ms = 80): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const geoService = {
  async listPlaces(parentId?: string | null): Promise<GeoPlace[]> {
    const rows =
      parentId === undefined
        ? mockGeoPlaces
        : mockGeoPlaces.filter((p) => p.parentId === parentId);
    return delay(rows);
  },

  async getPlace(id: string): Promise<GeoPlace | null> {
    return delay(mockGeoPlaces.find((p) => p.id === id) ?? null);
  },

  async listWards(): Promise<GeoPlace[]> {
    return delay(mockGeoPlaces.filter((p) => p.level === "ward"));
  },

  async indicatorsForPlace(placeId: string): Promise<SocioEconomicIndicator[]> {
    return delay(
      mockSocioEconomicIndicators.filter((i) => i.placeId === placeId),
    );
  },

  async breadcrumbs(placeId: string): Promise<GeoPlace[]> {
    const byId = new Map(mockGeoPlaces.map((p) => [p.id, p]));
    const chain: GeoPlace[] = [];
    let current = byId.get(placeId);
    while (current) {
      chain.unshift(current);
      current = current.parentId ? byId.get(current.parentId) : undefined;
    }
    return delay(chain);
  },
};
