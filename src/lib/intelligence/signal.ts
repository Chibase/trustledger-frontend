/**
 * I-03 explainable signal helpers. Descriptive only — does not score,
 * predict, interpret, recommend, or persist.
 */

import { contextAppliesAt, createTemporalContext } from "@/lib/intelligence/context";
import { uniqueRecordRefs } from "@/lib/intelligence/foundation";
import type { ContextualIntelligenceRecord } from "@/types/intelligenceContext";
import type {
  IntelligenceLifecycleRecord,
  IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";
import type {
  AssembleSignalInput,
  ExplainableSignalRecord,
  IntelligenceSignalObservation,
  SignalClassification,
  SignalState,
} from "@/types/intelligenceSignal";
import {
  SIGNAL_CLASSIFICATIONS,
  SIGNAL_STATES,
} from "@/types/intelligenceSignal";

export function isSignalClassification(
  value: unknown,
): value is SignalClassification {
  return SIGNAL_CLASSIFICATIONS.includes(value as SignalClassification);
}

export function isSignalState(value: unknown): value is SignalState {
  return SIGNAL_STATES.includes(value as SignalState);
}

export function isSignalRecord(
  row: IntelligenceLifecycleRecord,
): row is Extract<IntelligenceLifecycleRecord, { stage: "signal" }> {
  return row.stage === "signal";
}

export function signalAppliesAt(
  row: ExplainableSignalRecord,
  at: string,
): boolean {
  return contextAppliesAt(row.temporal, at);
}

export function normalizeSignalObservations(
  rows: IntelligenceSignalObservation[] | undefined,
): IntelligenceSignalObservation[] {
  const out: IntelligenceSignalObservation[] = [];
  const seen = new Set<string>();
  for (const row of rows || []) {
    if (!row?.id || seen.has(row.id)) continue;
    seen.add(row.id);
    out.push({
      id: String(row.id),
      observedAt: row.observedAt,
      refs: uniqueRecordRefs(row.refs),
      note:
        typeof row.note === "string" && row.note.trim()
          ? row.note.trim()
          : undefined,
    });
  }
  return out;
}

function observationEvidenceRefs(
  observations: IntelligenceSignalObservation[],
): IntelligenceRecordRef[] {
  return uniqueRecordRefs(observations.flatMap((row) => row.refs));
}

/** Signal must not carry interpretation, recommendation, or decision fields. */
export function signalIsNotInterpretation(
  row: ExplainableSignalRecord,
): boolean {
  const extra = row as ExplainableSignalRecord & {
    hypothesis?: unknown;
    alternatives?: unknown;
    action?: unknown;
    governance?: unknown;
    status?: unknown;
  };
  return (
    row.stage === "signal" &&
    extra.hypothesis === undefined &&
    extra.alternatives === undefined &&
    extra.action === undefined &&
    extra.governance === undefined &&
    extra.status === undefined
  );
}

export function createExplainableSignal(
  input: AssembleSignalInput,
): ExplainableSignalRecord {
  if (!isSignalClassification(input.classification)) {
    throw new Error("createExplainableSignal: unknown classification");
  }
  const state = input.state ?? "observed";
  if (!isSignalState(state)) {
    throw new Error("createExplainableSignal: unknown state");
  }
  const observations = normalizeSignalObservations(input.observations);
  const subjectRefs = uniqueRecordRefs(input.subjectRefs);
  const evidenceRefs = uniqueRecordRefs([
    ...(input.evidenceRefs || []),
    ...observationEvidenceRefs(observations),
  ]);
  const relatedRefs = uniqueRecordRefs(input.relatedRefs).filter((ref) => {
    return !subjectRefs.some(
      (subject) => subject.kind === ref.kind && subject.id === ref.id,
    );
  });
  const temporal = createTemporalContext(input.temporal);
  const detectedAt =
    input.detectedAt || temporal.asOf || temporal.capturedAt;
  return {
    id: input.id,
    stage: "signal",
    domain: input.domain,
    summary: input.summary.trim(),
    explanation: input.explanation.trim(),
    classification: input.classification,
    state,
    subjectRefs,
    relatedRefs,
    evidenceRefs,
    contextRefs: uniqueRecordRefs(input.contextRefs),
    contextIds: [...new Set((input.contextIds || []).map(String).filter(Boolean))],
    observations,
    temporal,
    detectedAt,
    provenance: input.provenance,
  };
}

/**
 * Links an I-02 context row to a signal. Classification and explanation
 * must be supplied — they are not inferred from operating-context levels.
 */
export function assembleSignalFromContext(input: {
  id: string;
  context: ContextualIntelligenceRecord;
  summary: string;
  explanation: string;
  classification: SignalClassification;
  state?: SignalState;
  observations?: IntelligenceSignalObservation[];
  relatedRefs?: IntelligenceRecordRef[];
  evidenceRefs?: IntelligenceRecordRef[];
}): ExplainableSignalRecord {
  return createExplainableSignal({
    id: input.id,
    summary: input.summary,
    explanation: input.explanation,
    classification: input.classification,
    state: input.state,
    domain: input.context.domain,
    provenance: {
      ...input.context.provenance,
      transformation:
        input.context.provenance.transformation ||
        "assembled_from_context",
    },
    subjectRefs: input.context.subjectRefs,
    relatedRefs: [...input.context.relatedRefs, ...(input.relatedRefs || [])],
    evidenceRefs: [...input.context.evidenceRefs, ...(input.evidenceRefs || [])],
    contextRefs: uniqueRecordRefs([
      ...input.context.subjectRefs,
      ...input.context.relatedRefs,
    ]),
    contextIds: [input.context.id],
    observations: input.observations,
    temporal: input.context.temporal,
    detectedAt:
      input.context.temporal.asOf || input.context.temporal.capturedAt,
  });
}
