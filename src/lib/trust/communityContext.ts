import type { Incident } from "@/types/incident";
import type { Stakeholder } from "@/types/stakeholder";
import type { TrustCommunityContext } from "@/types/trustLayer";

export function newTrustCommunityId(): string {
  return `TRC-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
  updatedAt?: string;
}): TrustCommunityContext {
  return {
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
  };
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
