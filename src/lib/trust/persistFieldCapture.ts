/**
 * Human-apply persist of field extras onto the parallel trust layer.
 * Does not write `tl-org-data`. Does not auto-save while typing.
 */

import { getActiveOrgId } from "@/lib/orgStore";
import {
  fieldNoteHasParticipationExtras,
  fieldNoteToCommunityDraft,
  fieldNoteToParticipationDraft,
  type FieldNoteMeta,
} from "@/lib/trust/fieldCapture";
import { createTrustCommunityContext } from "@/lib/trust/communityContext";
import {
  getTrustLayerBucket,
  saveTrustLayerBucket,
  type TrustLayerStorage,
} from "@/lib/trust/layerStore";
import type { TrustCommunityContext } from "@/types/trustLayer";

export function fieldNoteHasContextExtras(meta: FieldNoteMeta): boolean {
  return Boolean(
    meta.oralCapture ||
      meta.lowConnectivity ||
      meta.rapidCapture ||
      meta.spokenLanguage.trim() ||
      meta.workingLanguage.trim() ||
      meta.barriers.trim() ||
      meta.localContextNotes.trim() ||
      meta.historyNotes.trim() ||
      meta.socialSensitivityNotes.trim() ||
      meta.powerStructureNotes.trim() ||
      fieldNoteHasParticipationExtras(meta),
  );
}

function sameCommunityPlace(
  a: TrustCommunityContext,
  b: TrustCommunityContext,
): boolean {
  return (
    (a.projectId || "") === (b.projectId || "") &&
    (a.placeLabel || a.ward || a.communityRef || "") ===
      (b.placeLabel || b.ward || b.communityRef || "")
  );
}

function keepText(next?: string, prev?: string): string | undefined {
  const trimmed = (next || "").trim();
  return trimmed ? trimmed : prev;
}

export function persistFieldCaptureToTrustLayer(
  meta: FieldNoteMeta,
  extra: { projectId?: string | null; sourceId?: string } = {},
  orgId: string | null = getActiveOrgId(),
  storage?: TrustLayerStorage | null,
): boolean {
  if (!orgId || !fieldNoteHasContextExtras(meta)) return false;
  const draft = fieldNoteToCommunityDraft(meta, {
    projectId: extra.projectId ?? null,
  });
  const participation = fieldNoteToParticipationDraft(meta, {
    projectId: extra.projectId ?? null,
    sourceId: extra.sourceId,
  });
  const bucket = getTrustLayerBucket(orgId, storage);
  const match = bucket.community.find((row) => sameCommunityPlace(row, draft));
  if (match) {
    const merged = createTrustCommunityContext({
      ...match,
      id: match.id,
      projectId: draft.projectId ?? match.projectId,
      placeId: draft.placeId || match.placeId,
      placeLabel: keepText(draft.placeLabel, match.placeLabel),
      communityRef: keepText(draft.communityRef, match.communityRef),
      ward: keepText(draft.ward, match.ward),
      municipality: keepText(draft.municipality, match.municipality),
      notes: keepText(draft.notes, match.notes),
      historyNotes: keepText(draft.historyNotes, match.historyNotes),
      powerStructureNotes: keepText(
        draft.powerStructureNotes,
        match.powerStructureNotes,
      ),
      sensitivityNotes: keepText(draft.sensitivityNotes, match.sensitivityNotes),
      barriers: keepText(draft.barriers, match.barriers),
      workingLanguage: keepText(draft.workingLanguage, match.workingLanguage),
      narrativeLanguage: keepText(
        draft.narrativeLanguage,
        match.narrativeLanguage,
      ),
      oralSource:
        typeof draft.oralSource === "boolean"
          ? draft.oralSource
          : match.oralSource,
      translationStatus: draft.translationStatus || match.translationStatus,
      barrierTags: draft.barrierTags?.length
        ? draft.barrierTags
        : match.barrierTags,
    });
    bucket.community = bucket.community.map((row) =>
      row.id === match.id ? merged : row,
    );
  } else {
    bucket.community.push(draft);
  }
  if (participation) {
    bucket.participation.push(participation);
  }
  saveTrustLayerBucket(bucket, storage);
  return true;
}
