import fs from "fs";
import path from "path";
import type { GeoPackFile, GeoPackManifest, GeoPlace } from "@/types/geo";

const DEFAULT_PACK_ID = "za-mdb-2020";

let cache: Map<string, GeoPackFile> | null = null;

function geoDir() {
  return path.join(process.cwd(), "data", "geo");
}

function loadAllPacks(): Map<string, GeoPackFile> {
  if (cache) return cache;
  const map = new Map<string, GeoPackFile>();
  const dir = geoDir();
  if (!fs.existsSync(dir)) {
    cache = map;
    return map;
  }
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".places.json")) continue;
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const parsed = JSON.parse(raw) as GeoPackFile;
    if (parsed?.pack?.id && Array.isArray(parsed.places)) {
      map.set(parsed.pack.id, parsed);
    }
  }
  cache = map;
  return map;
}

export function listGeoPackManifests(): GeoPackManifest[] {
  return [...loadAllPacks().values()].map((p) => p.pack);
}

export function getGeoPack(packId = DEFAULT_PACK_ID): GeoPackFile | null {
  return loadAllPacks().get(packId) ?? null;
}

export function getDefaultGeoPack(): GeoPackFile | null {
  return getGeoPack(DEFAULT_PACK_ID);
}

export function allPlaces(packId = DEFAULT_PACK_ID): GeoPlace[] {
  return getGeoPack(packId)?.places ?? [];
}

export function placeIndex(packId = DEFAULT_PACK_ID): Map<string, GeoPlace> {
  return new Map(allPlaces(packId).map((p) => [p.id, p]));
}
