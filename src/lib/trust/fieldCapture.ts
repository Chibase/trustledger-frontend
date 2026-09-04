/**
 * Field-friendly capture extras. Optional — existing dropdowns stay as they are.
 * Does not auto-save into `tl-trust-layer`.
 */

import { createTrustCommunityContext } from "@/lib/trust/communityContext";
import { inferBarrierTagsFromNotes } from "@/lib/trust/barriers";
import {
  asParticipationMotivation,
  asPresenceMode,
  asResponsePattern,
} from "@/lib/trust/participationRealism";
import { createTrustParticipation } from "@/lib/trust/participation";
import type { TrustCommunityContext } from "@/types/trustLayer";
import type { TrustParticipationRecord } from "@/types/trustLayer";

export type FieldNoteMeta = {
  purpose: string;
  kind: string;
  place: string;
  linkedPromiseId: string;
  concernTheme: string;
  severity: string;
  /** ISO date the meeting/register actually happened (may be before capture). */
  meetingHeldOn: string;
  /** Notes were handed over after the meeting (SF/CLO not on site). */
  capturedAfterMeeting: boolean;
  rapidCapture: boolean;
  oralCapture: boolean;
  lowConnectivity: boolean;
  spokenLanguage: string;
  workingLanguage: string;
  barriers: string;
  localContextNotes: string;
  historyNotes: string;
  socialSensitivityNotes: string;
  powerStructureNotes: string;
  motivation: string;
  presenceMode: string;
  responsePattern: string;
  attendanceDoesNotEqualConsent: boolean;
};

export const EMPTY_FIELD_META: FieldNoteMeta = {
  purpose: "",
  kind: "",
  place: "",
  linkedPromiseId: "",
  concernTheme: "",
  severity: "",
  meetingHeldOn: "",
  capturedAfterMeeting: false,
  rapidCapture: false,
  oralCapture: false,
  lowConnectivity: false,
  spokenLanguage: "",
  workingLanguage: "",
  barriers: "",
  localContextNotes: "",
  historyNotes: "",
  socialSensitivityNotes: "",
  powerStructureNotes: "",
  motivation: "",
  presenceMode: "",
  responsePattern: "",
  attendanceDoesNotEqualConsent: false,
};

function placeLabel(meta: FieldNoteMeta): string | undefined {
  if (!meta.place || meta.place === "__other") return undefined;
  return meta.place;
}

function joinedNotes(meta: FieldNoteMeta): string | undefined {
  const bits = [
    meta.localContextNotes.trim(),
    meta.rapidCapture ? "Rapid / notes-first capture." : "",
    meta.lowConnectivity ? "Low-connectivity setting." : "",
    meta.oralCapture ? "Oral source." : "",
  ].filter(Boolean);
  return bits.length ? bits.join(" ") : undefined;
}

export function fieldNoteMetaPreamble(meta: FieldNoteMeta): string {
  const lines = [
    meta.meetingHeldOn ? `Date of meeting: ${meta.meetingHeldOn}` : null,
    meta.capturedAfterMeeting
      ? "Capture timing: after the meeting (handover notes)"
      : null,
    meta.rapidCapture ? "Capture mode: rapid / notes-first" : null,
    meta.oralCapture ? "Source: oral (spoken account)" : null,
    meta.lowConnectivity ? "Setting: low connectivity" : null,
    meta.place ? `Place / ward: ${meta.place}` : null,
    meta.purpose ? `Purpose: ${meta.purpose}` : null,
    meta.kind ? `Kind: ${meta.kind}` : null,
    meta.concernTheme ? `Concern theme: ${meta.concernTheme}` : null,
    meta.severity ? `Severity: ${meta.severity}` : null,
    meta.spokenLanguage ? `Spoken language: ${meta.spokenLanguage}` : null,
    meta.workingLanguage ? `Working language: ${meta.workingLanguage}` : null,
    meta.barriers ? `Trust barriers: ${meta.barriers}` : null,
    meta.localContextNotes
      ? `Local context: ${meta.localContextNotes}`
      : null,
    meta.historyNotes ? `Community history: ${meta.historyNotes}` : null,
    meta.socialSensitivityNotes
      ? `Social sensitivity: ${meta.socialSensitivityNotes}`
      : null,
    meta.powerStructureNotes
      ? `Power / authority context: ${meta.powerStructureNotes}`
      : null,
    meta.motivation ? `Participation motivation: ${meta.motivation}` : null,
    meta.presenceMode ? `Presence: ${meta.presenceMode}` : null,
    meta.responsePattern ? `Response pattern: ${meta.responsePattern}` : null,
    meta.attendanceDoesNotEqualConsent
      ? "Attendance does not equal consent"
      : null,
  ].filter(Boolean);
  return lines.length ? `${lines.join("\n")}\n\n` : "";
}

/** Draft only. Callers must opt in to persist. */
export function fieldNoteToCommunityDraft(
  meta: FieldNoteMeta,
  extra: { id?: string; projectId?: string | null } = {},
): TrustCommunityContext {
  const notes = joinedNotes(meta);
  const barriers = meta.barriers.trim() || undefined;
  return createTrustCommunityContext({
    id: extra.id,
    projectId: extra.projectId ?? null,
    placeLabel: placeLabel(meta),
    notes,
    barriers,
    sensitivityNotes: meta.socialSensitivityNotes.trim() || undefined,
    historyNotes: meta.historyNotes.trim() || undefined,
    powerStructureNotes: meta.powerStructureNotes.trim() || undefined,
    barrierTags: inferBarrierTagsFromNotes(
      [barriers, notes, meta.socialSensitivityNotes].filter(Boolean).join(" "),
    ),
    workingLanguage: meta.workingLanguage.trim() || undefined,
    narrativeLanguage: meta.spokenLanguage.trim() || undefined,
    oralSource: meta.oralCapture || undefined,
    translationStatus: meta.oralCapture ? "untranslated" : undefined,
  });
}

export function fieldNoteHasParticipationExtras(meta: FieldNoteMeta): boolean {
  return Boolean(
    meta.motivation ||
      meta.presenceMode ||
      meta.responsePattern ||
      meta.attendanceDoesNotEqualConsent,
  );
}

/** Draft only. Callers must opt in to persist. */
export function fieldNoteToParticipationDraft(
  meta: FieldNoteMeta,
  extra: {
    id?: string;
    projectId?: string | null;
    sourceId?: string;
  } = {},
): TrustParticipationRecord | null {
  if (!fieldNoteHasParticipationExtras(meta)) return null;
  return createTrustParticipation({
    id: extra.id,
    source: "engagement",
    sourceId: extra.sourceId,
    projectId: extra.projectId ?? null,
    motivation: asParticipationMotivation(meta.motivation),
    presenceMode: asPresenceMode(meta.presenceMode),
    responsePattern: asResponsePattern(meta.responsePattern),
    attendanceDoesNotEqualConsent: meta.attendanceDoesNotEqualConsent || undefined,
    note: "Field capture extras — not auto-saved.",
  });
}
