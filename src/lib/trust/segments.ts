import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import type { Incident } from "@/types/incident";
import type { Stakeholder } from "@/types/stakeholder";

export type TrustPlaceSegment = {
  segmentKey: string;
  label: string;
  sampleSize: number;
  pulse: ReturnType<typeof trustIndexFromIncidents>;
};

export type TrustGroupSegment<T> = {
  segmentKey: string;
  label: string;
  sampleSize: number;
  rows: T[];
};

/**
 * Stable place key from existing geo / ward fields.
 * Does not rename or invent places; unlocated rows share one bucket.
 */
export function incidentPlaceKey(incident: Incident): string {
  const geo = incident.geo;
  if (geo?.placeId) return `place:${geo.placeId}`;
  if (geo?.wardId) return `ward:${geo.wardId}`;
  if (geo?.municipalityId) return `muni:${geo.municipalityId}`;
  const ward = incident.ward?.trim();
  if (ward) return `ward-label:${ward}`;
  const area = incident.geographicArea?.trim();
  if (area) return `area:${area}`;
  return "unlocated";
}

export function incidentPlaceLabel(incident: Incident): string {
  const geo = incident.geo;
  if (geo?.wardName) return geo.wardName;
  if (geo?.municipalityName) return geo.municipalityName;
  if (incident.ward?.trim()) return incident.ward.trim();
  if (incident.geographicArea?.trim()) return incident.geographicArea.trim();
  return "Unlocated";
}

export function stakeholderPlaceKey(row: Stakeholder): string {
  if (row.placeId?.trim()) return `place:${row.placeId.trim()}`;
  if (row.countryCode?.trim()) return `country:${row.countryCode.trim()}`;
  return "unlocated";
}

function groupBy<T>(
  rows: T[],
  keyOf: (row: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const list = map.get(key);
    if (list) list.push(row);
    else map.set(key, [row]);
  }
  return map;
}

/** Overlay analysis only — does not change geo list/get or cascade pickers. */
export function trustPulseByPlace(incidents: Incident[]): TrustPlaceSegment[] {
  const groups = groupBy(incidents, incidentPlaceKey);
  return [...groups.entries()]
    .map(([segmentKey, rows]) => ({
      segmentKey,
      label: incidentPlaceLabel(rows[0]!),
      sampleSize: rows.length,
      pulse: trustIndexFromIncidents(rows),
    }))
    .sort((a, b) => a.segmentKey.localeCompare(b.segmentKey));
}

export function stakeholdersByKind(
  rows: Stakeholder[],
): TrustGroupSegment<Stakeholder>[] {
  const groups = groupBy(rows, (row) => `kind:${row.kind || "other"}`);
  return [...groups.entries()]
    .map(([segmentKey, list]) => ({
      segmentKey,
      label: list[0]?.kind || "other",
      sampleSize: list.length,
      rows: list,
    }))
    .sort((a, b) => a.segmentKey.localeCompare(b.segmentKey));
}

export function stakeholdersByPlace(
  rows: Stakeholder[],
): TrustGroupSegment<Stakeholder>[] {
  const groups = groupBy(rows, stakeholderPlaceKey);
  return [...groups.entries()]
    .map(([segmentKey, list]) => ({
      segmentKey,
      label: list[0]?.placeId || list[0]?.countryCode || "Unlocated",
      sampleSize: list.length,
      rows: list,
    }))
    .sort((a, b) => a.segmentKey.localeCompare(b.segmentKey));
}
