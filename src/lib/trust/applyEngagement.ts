/**
 * TE-8 — persist participation (and optional overlay observations) when an
 * engagement is applied. Overlay stays optional. Sentiment is never copied.
 */

import { getActiveOrgId } from "@/lib/orgStore";
import { deriveTrustLayer } from "@/lib/trust/derive";
import {
  fieldNoteToParticipationDraft,
  type FieldNoteMeta,
} from "@/lib/trust/fieldCapture";
import { persistFieldCaptureToTrustLayer } from "@/lib/trust/persistFieldCapture";
import {
  getTrustLayerBucket,
  loadTrustLayerBucketAsync,
  saveTrustLayerBucketAsync,
  type TrustLayerStorage,
} from "@/lib/trust/layerStore";
import { createTrustParticipation } from "@/lib/trust/participation";
import { isTrustResponseBlank, normalizeTrustResponse } from "@/lib/trust/response";
import type { Engagement } from "@/types/engagement";
import type { TrustAttitude, StakeholderTrustResponse } from "@/types/trustOverlay";
import type { TrustParticipationRecord } from "@/types/trustLayer";

export type ApplyEngagementToTrustLayerInput = {
  engagement: Engagement;
  fieldMeta?: FieldNoteMeta | null;
  /** Human-applied overlay only. Never inferred from sentimentLabel. */
  overlay?: StakeholderTrustResponse | null;
  orgId?: string | null;
  storage?: TrustLayerStorage | null;
};

export type ApplyEngagementToTrustLayerResult = {
  wrote: boolean;
  participationId?: string;
  observationCount: number;
};

function overlayFrom(
  input: ApplyEngagementToTrustLayerInput,
): StakeholderTrustResponse | null {
  const staged = input.overlay || input.engagement.trustResponse;
  if (!staged || isTrustResponseBlank(staged)) return null;
  return normalizeTrustResponse(staged);
}

/** Skip `unknown` so a blank overlay does not wipe a captured willingness. */
function pickAttitude(
  ...vals: Array<TrustAttitude | undefined>
): TrustAttitude | undefined {
  for (const value of vals) {
    if (value && value !== "unknown") return value;
  }
  return vals.find((value) => value !== undefined);
}

function mergeParticipation(args: {
  engagement: Engagement;
  existing?: TrustParticipationRecord;
  fromField: TrustParticipationRecord | null;
  fromOverlay: TrustParticipationRecord | null;
}): TrustParticipationRecord {
  const { engagement, existing, fromField, fromOverlay } = args;
  return createTrustParticipation({
    id: existing?.id || `TRP-engagement-${engagement.id}`,
    observedAt: engagement.heldOn || engagement.createdAt,
    source: "engagement",
    sourceId: engagement.id,
    projectId: engagement.projectId,
    stakeholderId: engagement.stakeholderIds[0] || existing?.stakeholderId,
    willingnessToParticipate: pickAttitude(
      fromOverlay?.willingnessToParticipate,
      fromField?.willingnessToParticipate,
      existing?.willingnessToParticipate,
    ),
    willingnessToContribute: pickAttitude(
      fromOverlay?.willingnessToContribute,
      fromField?.willingnessToContribute,
      existing?.willingnessToContribute,
    ),
    trustDriven: fromOverlay?.trustDriven,
    note: fromField?.note || fromOverlay?.note || existing?.note,
    motivation: fromField?.motivation || existing?.motivation,
    presenceMode: fromField?.presenceMode || existing?.presenceMode,
    responsePattern: fromField?.responsePattern || existing?.responsePattern,
    attendanceDoesNotEqualConsent:
      fromField?.attendanceDoesNotEqualConsent === true
        ? true
        : existing?.attendanceDoesNotEqualConsent === true
          ? true
          : undefined,
  });
}

/**
 * Human apply of an engagement writes one participation row (upsert by
 * engagement id) and, when an overlay was applied, trust observations.
 * Does not write `tl-org-data`. Does not copy SRM sentiment.
 */
export async function applyEngagementToTrustLayer(
  input: ApplyEngagementToTrustLayerInput,
): Promise<ApplyEngagementToTrustLayerResult> {
  const engagement = input.engagement;
  const orgId = input.orgId !== undefined ? input.orgId : getActiveOrgId();
  if (!orgId) {
    return { wrote: false, observationCount: 0 };
  }

  await loadTrustLayerBucketAsync(orgId, input.storage);

  if (input.fieldMeta) {
    persistFieldCaptureToTrustLayer(
      input.fieldMeta,
      { projectId: engagement.projectId, sourceId: engagement.id },
      orgId,
      input.storage,
    );
  }

  const overlay = overlayFrom(input);
  const derived = overlay
    ? deriveTrustLayer({
        engagements: [{ ...engagement, trustResponse: overlay }],
      })
    : { observations: [], participation: [] as TrustParticipationRecord[] };

  const fromField = input.fieldMeta
    ? fieldNoteToParticipationDraft(input.fieldMeta, {
        sourceId: engagement.id,
        projectId: engagement.projectId,
      })
    : null;

  const bucket = getTrustLayerBucket(orgId, input.storage);
  const existing = bucket.participation.find(
    (row) => row.source === "engagement" && row.sourceId === engagement.id,
  );
  const participation = mergeParticipation({
    engagement,
    existing,
    fromField,
    fromOverlay: derived.participation[0] || null,
  });

  bucket.participation = bucket.participation.filter(
    (row) => !(row.source === "engagement" && row.sourceId === engagement.id),
  );
  bucket.participation.push(participation);

  for (const obs of derived.observations) {
    const idx = bucket.observations.findIndex((row) => row.id === obs.id);
    if (idx >= 0) bucket.observations[idx] = obs;
    else bucket.observations.push(obs);
  }

  await saveTrustLayerBucketAsync(bucket, input.storage);
  return {
    wrote: true,
    participationId: participation.id,
    observationCount: derived.observations.length,
  };
}
