/**
 * Map cascade geo + platform Stats SA baseline into project dossier fields.
 * ADR-040: packs are shared reference data; tenant notes stay free-text.
 */

import type { IncidentGeoContext } from "@/types/incident";
import type { SocioEconomicIndicator } from "@/types/geo";
import type { ProjectDossier } from "@/types/project";

function labelFromGeoCtx(ctx: IncidentGeoContext): string {
  return [
    ctx.wardName,
    ctx.traditionalCouncilName,
    ctx.municipalityName,
    ctx.districtName,
    ctx.provinceName,
    ctx.countryName,
  ]
    .filter(Boolean)
    .join(" · ");
}

export type AttachedSocioIndicator = {
  placeId: string;
  key: string;
  label: string;
  value: number;
  unit: string;
  year?: number;
  source?: string;
};

/** Place ids to try for indicators — leaf first, then parents. */
export function indicatorPlaceCandidates(
  geo: IncidentGeoContext | ProjectDossier["geo"] | undefined,
): string[] {
  if (!geo) return [];
  const ids = [
    geo.placeId,
    "wardId" in geo ? geo.wardId : undefined,
    "traditionalCouncilId" in geo ? geo.traditionalCouncilId : undefined,
    geo.municipalityId,
    "districtId" in geo ? geo.districtId : undefined,
    geo.provinceId,
  ].filter((id): id is string => Boolean(id && !id.startsWith("custom:")));
  return [...new Set(ids)];
}

export function dossierGeoFromCascade(
  ctx: IncidentGeoContext,
  placeLabel?: string,
): NonNullable<ProjectDossier["geo"]> {
  return {
    countryCode: ctx.countryCode || "ZA",
    countryName: ctx.countryName,
    provinceId: ctx.provinceId,
    provinceName: ctx.provinceName,
    districtId: ctx.districtId,
    districtName: ctx.districtName,
    municipalityId: ctx.municipalityId,
    municipalityName: ctx.municipalityName,
    traditionalCouncilId: ctx.traditionalCouncilId,
    traditionalCouncilName: ctx.traditionalCouncilName,
    wardId: ctx.wardId,
    wardName: ctx.wardName,
    placeId: ctx.placeId,
    placeLabel: placeLabel?.trim() || undefined,
  };
}

export function cascadeCtxFromDossierGeo(
  geo: ProjectDossier["geo"] | undefined,
): IncidentGeoContext | null {
  if (!geo) return null;
  if (
    !geo.provinceId &&
    !geo.municipalityId &&
    !geo.wardId &&
    !geo.placeId &&
    !geo.provinceName &&
    !geo.municipalityName &&
    !geo.wardName
  ) {
    return null;
  }
  return {
    countryCode: geo.countryCode || "ZA",
    countryName: geo.countryName,
    provinceId: geo.provinceId,
    provinceName: geo.provinceName,
    districtId: geo.districtId,
    districtName: geo.districtName,
    municipalityId: geo.municipalityId,
    municipalityName: geo.municipalityName,
    traditionalCouncilId: geo.traditionalCouncilId,
    traditionalCouncilName: geo.traditionalCouncilName,
    wardId: geo.wardId,
    wardName: geo.wardName,
    placeId: geo.placeId,
  };
}

export function geoLabelFromDossier(
  geo: ProjectDossier["geo"] | undefined,
): string {
  const ctx = cascadeCtxFromDossierGeo(geo);
  if (!ctx) return "";
  return labelFromGeoCtx(ctx);
}

export function toAttachedIndicators(
  rows: SocioEconomicIndicator[],
): AttachedSocioIndicator[] {
  return rows.map((r) => ({
    placeId: r.placeId,
    key: r.key,
    label: r.label,
    value: r.value,
    unit: r.unit,
    year: r.year,
    source: r.source,
  }));
}

/** Merge selected platform rows into communityIntel (unemployment autofill). */
export function applyBaselineToCommunityIntel(
  current: ProjectDossier["communityIntel"] | undefined,
  rows: SocioEconomicIndicator[],
  baselinePlaceId: string,
): NonNullable<ProjectDossier["communityIntel"]> {
  const attached = toAttachedIndicators(rows);
  const unemployment = rows.find((r) => r.key === "unemployment_rate");
  const neet = rows.find((r) => r.key === "youth_neet");
  const lines = attached.map(
    (r) =>
      `${r.label}: ${r.value}${r.unit === "%" ? "%" : ` ${r.unit}`}${r.year ? ` (${r.year})` : ""}${r.source ? ` — ${r.source}` : ""}`,
  );
  const baselineBlock = lines.length
    ? `Platform baseline (${baselinePlaceId}):\n${lines.join("\n")}`
    : undefined;

  return {
    ...current,
    baselinePlaceId,
    attachedIndicators: attached,
    baselineAttachedAt: new Date().toISOString(),
    unemploymentRatePct:
      unemployment?.value ?? current?.unemploymentRatePct,
    unemploymentSource:
      unemployment?.source ||
      current?.unemploymentSource ||
      "Stats SA / platform baseline",
    neetYouthNotes:
      neet != null
        ? [
            current?.neetYouthNotes?.trim(),
            `Youth NEET ${neet.value}${neet.unit === "%" ? "%" : ` ${neet.unit}`}${neet.year ? ` (${neet.year})` : ""} — ${neet.source || "Stats SA"}`,
          ]
            .filter(Boolean)
            .join("\n")
        : current?.neetYouthNotes,
    structuresNotes: current?.structuresNotes,
    localBusinessesNotes: current?.localBusinessesNotes,
    baselineSummary: baselineBlock || current?.baselineSummary,
  };
}

export async function fetchIndicatorsForPlace(
  placeId: string,
): Promise<SocioEconomicIndicator[]> {
  const res = await fetch(
    `/api/geo?indicators=1&placeId=${encodeURIComponent(placeId)}`,
  );
  if (!res.ok) throw new Error("Indicator lookup failed");
  const data = (await res.json()) as { indicators?: SocioEconomicIndicator[] };
  return data.indicators ?? [];
}

/** Walk leaf → parents until indicators are found. */
export async function fetchIndicatorsForGeo(
  geo: IncidentGeoContext | ProjectDossier["geo"] | undefined,
): Promise<{ placeId: string; indicators: SocioEconomicIndicator[] } | null> {
  for (const placeId of indicatorPlaceCandidates(geo)) {
    const indicators = await fetchIndicatorsForPlace(placeId);
    if (indicators.length) return { placeId, indicators };
  }
  return null;
}
