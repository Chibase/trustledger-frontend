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
      ...draft,
      id: match.id,
      notes: draft.notes || match.notes,
      historyNotes: draft.historyNotes || match.historyNotes,
      powerStructureNotes:
        draft.powerStructureNotes || match.powerStructureNotes,
      sensitivityNotes: draft.sensitivityNotes || match.sensitivityNotes,
      barriers: draft.barriers || match.barriers,
      workingLanguage: draft.workingLanguage || match.workingLanguage,
      narrativeLanguage: draft.narrativeLanguage || match.narrativeLanguage,
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
