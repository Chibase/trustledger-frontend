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

/** True when cascade emitted country-only bootstrap (no province+). */
export function isCountryOnlyGeo(ctx: IncidentGeoContext): boolean {
  return Boolean(
    ctx.countryCode &&
      !ctx.provinceId &&
      !ctx.municipalityId &&
      !ctx.districtId &&
      !ctx.wardId &&
      !ctx.traditionalCouncilId &&
      !ctx.placeId,
  );
}

/** True when dossier already has a place selection deeper than country. */
export function dossierHasCascadeGeo(
  geo: ProjectDossier["geo"] | undefined,
): boolean {
  return Boolean(
    geo?.provinceId ||
      geo?.municipalityId ||
      geo?.districtId ||
      geo?.wardId ||
      geo?.placeId ||
      geo?.provinceName ||
      geo?.municipalityName ||
      geo?.wardName,
  );
}

export function geoAnchorId(
  geo: IncidentGeoContext | ProjectDossier["geo"] | undefined,
): string | undefined {
  if (!geo) return undefined;
  return (
    geo.placeId ||
    ("wardId" in geo ? geo.wardId : undefined) ||
    geo.municipalityId ||
    ("districtId" in geo ? geo.districtId : undefined) ||
    geo.provinceId
  );
}

const BASELINE_NEET_PREFIX = "Youth NEET ";

function stripBaselineNeetLines(notes: string | undefined): string | undefined {
  if (!notes?.trim()) return undefined;
  const kept = notes
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith(BASELINE_NEET_PREFIX));
  return kept.length ? kept.join("\n") : undefined;
}

/** Remove platform baseline snapshot and autofilled Stats SA fields. */
export function clearBaselineFromCommunityIntel(
  current: ProjectDossier["communityIntel"] | undefined,
): ProjectDossier["communityIntel"] | undefined {
  if (!current) return undefined;
  const next = {
    ...current,
    attachedIndicators: undefined,
    baselinePlaceId: undefined,
    baselineAttachedAt: undefined,
    baselineSummary: undefined,
    unemploymentRatePct: undefined as number | undefined,
    unemploymentSource: undefined as string | undefined,
    neetYouthNotes: stripBaselineNeetLines(current.neetYouthNotes),
  };
  // Drop empty shell
  if (
    !next.localBusinessesNotes &&
    !next.structuresNotes &&
    !next.neetYouthNotes &&
    next.unemploymentRatePct == null &&
    !(next.localIndicators?.length)
  ) {
    return undefined;
  }
  return next;
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

  const tenantNeet = stripBaselineNeetLines(current?.neetYouthNotes);
  const neetLine =
    neet != null
      ? `${BASELINE_NEET_PREFIX}${neet.value}${neet.unit === "%" ? "%" : ` ${neet.unit}`}${neet.year ? ` (${neet.year})` : ""} — ${neet.source || "Stats SA"}`
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
    neetYouthNotes: [tenantNeet, neetLine].filter(Boolean).join("\n") || undefined,
    structuresNotes: current?.structuresNotes,
    localBusinessesNotes: current?.localBusinessesNotes,
    baselineSummary: baselineBlock || current?.baselineSummary,
    localIndicators: current?.localIndicators,
    localIntelAttachedAt: current?.localIntelAttachedAt,
    localIntelCaptureId: current?.localIntelCaptureId,
    localIntelSummary: current?.localIntelSummary,
  };
}

/** Attach tenant local community intel beside Stats SA (does not replace baseline). */
export function applyLocalIntelToCommunityIntel(
  current: ProjectDossier["communityIntel"] | undefined,
  rows: Array<{
    key: string;
    label: string;
    value: number;
    unit: string;
    year?: number;
    source?: string;
    notes?: string;
  }>,
  opts?: { captureId?: string },
): NonNullable<ProjectDossier["communityIntel"]> {
  const localIndicators = rows.map((r) => ({
    ...r,
    captureId: opts?.captureId,
  }));
  const lines = localIndicators.map(
    (r) =>
      `${r.label}: ${r.value}${r.unit === "%" ? "%" : ` ${r.unit}`}${r.year ? ` (${r.year})` : ""}${r.source ? ` — ${r.source}` : ""}`,
  );
  return {
    ...current,
    localIndicators,
    localIntelAttachedAt: new Date().toISOString(),
    localIntelCaptureId: opts?.captureId,
    localIntelSummary: lines.length
      ? `Local community intel:\n${lines.join("\n")}`
      : current?.localIntelSummary,
  };
}

export function clearLocalIntelFromCommunityIntel(
  current: ProjectDossier["communityIntel"] | undefined,
): ProjectDossier["communityIntel"] | undefined {
  if (!current) return undefined;
  const next = {
    ...current,
    localIndicators: undefined,
    localIntelAttachedAt: undefined,
    localIntelCaptureId: undefined,
    localIntelSummary: undefined,
  };
  if (
    !next.localBusinessesNotes &&
    !next.structuresNotes &&
    !next.neetYouthNotes &&
    next.unemploymentRatePct == null &&
    !(next.attachedIndicators?.length)
  ) {
    return undefined;
  }
  return next;
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
