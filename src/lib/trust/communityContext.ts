import { normalizeBarrierTags } from "@/lib/trust/barriers";
import { asTrustTranslationStatus } from "@/lib/trust/language";
import type { Incident } from "@/types/incident";
import type { Stakeholder } from "@/types/stakeholder";
import type {
  TrustBarrierId,
  TrustCommunityContext,
  TrustTranslationStatus,
} from "@/types/trustLayer";

export function newTrustCommunityId(): string {
  return `TRC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function createTrustCommunityContext(input: {
  id?: string;
  projectId?: string | null;
  placeId?: string;
  placeLabel?: string;
  communityRef?: string;
  notes?: string;
  barriers?: string;
  sensitivityNotes?: string;
  ward?: string;
  municipality?: string;
  historyNotes?: string;
  powerStructureNotes?: string;
  barrierTags?: TrustBarrierId[];
  workingLanguage?: string;
  narrativeLanguage?: string;
  translationStatus?: TrustTranslationStatus;
  oralSource?: boolean;
  updatedAt?: string;
}): TrustCommunityContext {
  const barrierTags = normalizeBarrierTags(input.barrierTags || []);
  const row: TrustCommunityContext = {
    id: input.id || newTrustCommunityId(),
    layer: "trust",
    updatedAt: input.updatedAt || new Date().toISOString(),
    projectId: input.projectId ?? null,
    placeId: input.placeId,
    placeLabel: input.placeLabel,
    communityRef: input.communityRef,
    notes: input.notes,
    barriers: input.barriers,
    sensitivityNotes: input.sensitivityNotes,
    ward: input.ward,
    municipality: input.municipality,
    historyNotes: input.historyNotes,
    powerStructureNotes: input.powerStructureNotes,
    workingLanguage: optionalText(input.workingLanguage),
    narrativeLanguage: optionalText(input.narrativeLanguage),
    oralSource: optionalBoolean(input.oralSource),
  };
  if (barrierTags.length) row.barrierTags = barrierTags;
  if (input.translationStatus) {
    row.translationStatus = asTrustTranslationStatus(input.translationStatus);
  }
  return row;
}

export function normalizeTrustCommunityContext(
  raw: Partial<TrustCommunityContext> | null | undefined,
): TrustCommunityContext | null {
  if (!raw || typeof raw !== "object") return null;
  if (raw.layer && raw.layer !== "trust") return null;
  return createTrustCommunityContext({
    id: raw.id,
    projectId: raw.projectId,
    placeId: raw.placeId,
    placeLabel: raw.placeLabel,
    communityRef: raw.communityRef,
    notes: raw.notes,
    barriers: raw.barriers,
    sensitivityNotes: raw.sensitivityNotes,
    ward: raw.ward,
    municipality: raw.municipality,
    historyNotes: raw.historyNotes,
    powerStructureNotes: raw.powerStructureNotes,
    barrierTags: raw.barrierTags,
    workingLanguage: raw.workingLanguage,
    narrativeLanguage: raw.narrativeLanguage,
    translationStatus: raw.translationStatus,
    oralSource: raw.oralSource,
    updatedAt: raw.updatedAt,
  });
}

function placeLabel(row: TrustCommunityContext): string {
  return row.placeLabel || row.ward || row.communityRef || row.placeId || "this community";
}

function truncate(text: string, max = 180): string {
  const trimmed = text.trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}

/**
 * Optional hints for later analytics / recommendations.
 * Ignores generic derived-from-case notes so TE-4 briefs stay unchanged
 * when only SRM derivation is present.
 */
export function summarizeCommunityContextForIntel(
  rows: TrustCommunityContext[],
): string[] {
  const hints: string[] = [];
  for (const row of rows) {
    const label = placeLabel(row);
    const derivedOnly =
      (row.notes || "").startsWith("Derived from case") &&
      !row.historyNotes &&
      !row.powerStructureNotes &&
      !row.sensitivityNotes &&
      !row.barriers &&
      !row.barrierTags?.length &&
      !row.workingLanguage &&
      !row.narrativeLanguage &&
      !row.oralSource;
    if (derivedOnly) continue;

    if (row.historyNotes) {
      hints.push(`Community history (${label}): ${truncate(row.historyNotes)}`);
    }
    if (row.powerStructureNotes) {
      hints.push(
        `Power structure (${label}): ${truncate(row.powerStructureNotes)}`,
      );
    }
    if (row.sensitivityNotes) {
      hints.push(
        `Social sensitivity (${label}): ${truncate(row.sensitivityNotes)}`,
      );
    }
    if (row.barrierTags?.length) {
      hints.push(`Trust barriers (${label}): ${row.barrierTags.join(", ")}.`);
    } else if (row.barriers) {
      hints.push(`Trust barriers (${label}): ${truncate(row.barriers)}`);
    }
    if (row.notes && !(row.notes || "").startsWith("Derived from case")) {
      hints.push(`Local context (${label}): ${truncate(row.notes)}`);
    }
    if (row.workingLanguage || row.narrativeLanguage) {
      const spoken = row.narrativeLanguage || "unspecified";
      const working = row.workingLanguage || "unspecified";
      hints.push(
        `Language (${label}): spoken ${spoken}; working ${working} — not assumed to be English.`,
      );
    }
    if (row.oralSource) {
      hints.push(
        `Oral source (${label}) — do not treat a written desk language as the community voice.`,
      );
    }
  }
  return hints;
}

/** Read-only snapshot from existing SRM geo / place fields. Does not write SRM. */
export function communityContextFromIncident(
  incident: Incident,
  id?: string,
): TrustCommunityContext {
  const geo = incident.geo;
  return createTrustCommunityContext({
    id,
    projectId: incident.projectId || null,
    placeId: geo?.placeId || geo?.wardId,
    placeLabel:
      geo?.wardName || geo?.municipalityName || incident.ward || undefined,
    communityRef: incident.geographicArea || undefined,
    ward: geo?.wardName || incident.ward || undefined,
    municipality: geo?.municipalityName || undefined,
    notes: `Derived from case ${incident.id} — parallel context only.`,
  });
}

export function communityContextFromStakeholder(
  row: Stakeholder,
): TrustCommunityContext {
  return createTrustCommunityContext({
    placeId: row.placeId,
    placeLabel: row.name,
    communityRef: row.organisation || row.kind,
    notes: row.summary,
  });
}
