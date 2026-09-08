/**
 * I-03 — Explainable Signal Foundation
 *
 * A signal is a recorded condition, change, pattern, or observation that
 * deserves attention. It is not a conclusion, score, prediction, or action.
 *
 * Extends the I-01 `IntelligenceSignalRecord`. Reuses I-02 temporal windows
 * and I-01 provenance / spine refs. Existing SRM entities stay the SoT.
 */

import type { IntelligenceTemporalContext } from "@/types/intelligenceContext";
import type {
  IntelligenceDomain,
  IntelligenceProvenance,
  IntelligenceRecordRef,
  IntelligenceSignalRecord,
} from "@/types/intelligenceFoundation";

/** Descriptive classes only. Not severity, risk, or a numeric score. */
export const SIGNAL_CLASSIFICATIONS = [
  "condition",
  "change",
  "pattern",
  "observation",
] as const;

export type SignalClassification = (typeof SIGNAL_CLASSIFICATIONS)[number];

export const SIGNAL_STATES = [
  "observed",
  "active",
  "superseded",
  "withdrawn",
] as const;

export type SignalState = (typeof SIGNAL_STATES)[number];

/** An observable fact that supports a signal. Not an interpretation. */
export type IntelligenceSignalObservation = {
  id: string;
  observedAt?: string;
  refs: IntelligenceRecordRef[];
  note?: string;
};

export type ExplainableSignalRecord = IntelligenceSignalRecord & {
  subjectRefs: IntelligenceRecordRef[];
  relatedRefs: IntelligenceRecordRef[];
  temporal: IntelligenceTemporalContext;
  classification: SignalClassification;
  state: SignalState;
  /** Why the signal was recorded — what was observed, not what it means. */
  explanation: string;
  observations: IntelligenceSignalObservation[];
  /** I-02 context row ids (not spine kinds). */
  contextIds: string[];
};

export type AssembleSignalInput = {
  id: string;
  summary: string;
  explanation: string;
  classification: SignalClassification;
  state?: SignalState;
  provenance: IntelligenceProvenance;
  domain?: IntelligenceDomain;
  subjectRefs?: IntelligenceRecordRef[];
  relatedRefs?: IntelligenceRecordRef[];
  evidenceRefs?: IntelligenceRecordRef[];
  contextRefs?: IntelligenceRecordRef[];
  contextIds?: string[];
  observations?: IntelligenceSignalObservation[];
  temporal?: IntelligenceTemporalContext;
  detectedAt?: string;
};
