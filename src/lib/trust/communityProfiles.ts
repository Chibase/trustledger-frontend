/**
 * Readable community profiles from the parallel trust layer.
 * Skips empty derived-from-case shells. Not a Frappe Desk workspace.
 */

import {
  summarizeCommunityContextForIntel,
} from "@/lib/trust/communityContext";
import { summarizeParticipationRealismForIntel } from "@/lib/trust/participationRealism";
import { getActiveOrgId } from "@/lib/orgStore";
import {
  getTrustLayerBucket,
  loadTrustLayerBucketAsync,
} from "@/lib/trust/layerStore";
import type {
  TrustCommunityContext,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export type CommunityProfile = {
  id: string;
  label: string;
  municipality?: string;
  ward?: string;
  historyNotes?: string;
  powerStructureNotes?: string;
  sensitivityNotes?: string;
  barriers?: string;
  barrierTags?: string[];
  workingLanguage?: string;
  narrativeLanguage?: string;
  oralSource?: boolean;
  contextHints: string[];
  participationHints: string[];
};

function isDerivedShell(row: TrustCommunityContext): boolean {
  return (
    (row.notes || "").startsWith("Derived from case") &&
    !row.historyNotes &&
    !row.powerStructureNotes &&
    !row.sensitivityNotes &&
    !row.barriers &&
    !row.barrierTags?.length &&
    !row.workingLanguage &&
    !row.narrativeLanguage &&
    !row.oralSource
  );
}

function labelFor(row: TrustCommunityContext): string {
  return (
    row.placeLabel ||
    row.ward ||
    row.communityRef ||
    row.municipality ||
    row.placeId ||
    "Unnamed community"
  );
}

function participationForCommunity(
  row: TrustCommunityContext,
  participation: TrustParticipationRecord[],
): TrustParticipationRecord[] {
  return participation.filter((item) => {
    if (row.projectId && item.projectId) {
      return item.projectId === row.projectId;
    }
    return !row.projectId && !item.projectId;
  });
}

export function buildCommunityProfiles(
  community: TrustCommunityContext[],
  participation: TrustParticipationRecord[] = [],
): CommunityProfile[] {
  return community
    .filter((row) => !isDerivedShell(row))
    .map((row) => ({
      id: row.id,
      label: labelFor(row),
      municipality: row.municipality,
      ward: row.ward,
      historyNotes: row.historyNotes,
      powerStructureNotes: row.powerStructureNotes,
      sensitivityNotes: row.sensitivityNotes,
      barriers: row.barriers,
      barrierTags: row.barrierTags,
      workingLanguage: row.workingLanguage,
      narrativeLanguage: row.narrativeLanguage,
      oralSource: row.oralSource,
      contextHints: summarizeCommunityContextForIntel([row]),
      participationHints: summarizeParticipationRealismForIntel(
        participationForCommunity(row, participation),
      ),
    }));
}

export function loadWorkspaceCommunityProfiles(): CommunityProfile[] {
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const stored = getTrustLayerBucket(orgId);
  return buildCommunityProfiles(stored.community, stored.participation);
}

export async function loadWorkspaceCommunityProfilesAsync(): Promise<
  CommunityProfile[]
> {
  const orgId = getActiveOrgId();
  if (!orgId) return [];
  const stored = await loadTrustLayerBucketAsync(orgId);
  return buildCommunityProfiles(stored.community, stored.participation);
}
