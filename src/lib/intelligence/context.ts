/**
 * I-02 context assembly. Descriptive only — copies recorded attributes and
 * spine refs. Does not score, interpret, persist, or draw a graph.
 */

import {
  createIntelligenceProvenance,
  uniqueRecordRefs,
} from "@/lib/intelligence/foundation";
import type { Commitment } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type {
  AssembleContextInput,
  ContextLevel,
  ContextualIntelligenceRecord,
  IntelligenceTemporalContext,
  StakeholderOperatingContext,
  StakeholderOperatingContextKey,
} from "@/types/intelligenceContext";
import {
  CONTEXT_LEVELS,
  STAKEHOLDER_OPERATING_CONTEXT_KEYS,
} from "@/types/intelligenceContext";
import type { EvidenceStub } from "@/types/engagement";
import type {
  IntelligenceLifecycleRecord,
  IntelligenceProvenance,
  IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";
import type { Stakeholder, StakeholderInfluence } from "@/types/stakeholder";

export function isContextLevel(value: unknown): value is ContextLevel {
  return CONTEXT_LEVELS.includes(value as ContextLevel);
}

export function asContextLevel(value: unknown): ContextLevel {
  return isContextLevel(value) ? value : "unknown";
}

export function influenceAsContextLevel(
  value: StakeholderInfluence | unknown,
): ContextLevel {
  return asContextLevel(value);
}

export function normalizeStakeholderOperatingContext(
  input: StakeholderOperatingContext | undefined,
): StakeholderOperatingContext | undefined {
  if (!input) return undefined;
  const out: StakeholderOperatingContext = {};
  for (const key of STAKEHOLDER_OPERATING_CONTEXT_KEYS) {
    const value = input[key as StakeholderOperatingContextKey];
    if (value === undefined) continue;
    out[key] = asContextLevel(value);
  }
  if (typeof input.note === "string" && input.note.trim()) {
    out.note = input.note.trim();
  }
  return Object.keys(out).length ? out : undefined;
}

export function createTemporalContext(
  input: IntelligenceTemporalContext = {},
): IntelligenceTemporalContext {
  const temporal: IntelligenceTemporalContext = {};
  if (input.asOf) temporal.asOf = input.asOf;
  if (input.capturedAt) temporal.capturedAt = input.capturedAt;
  if (input.validFrom) temporal.validFrom = input.validFrom;
  if (input.validTo === null || typeof input.validTo === "string") {
    temporal.validTo = input.validTo;
  }
  return temporal;
}

export function contextAppliesAt(
  temporal: IntelligenceTemporalContext,
  at: string,
): boolean {
  const t = Date.parse(at);
  if (Number.isNaN(t)) return false;
  if (temporal.validFrom) {
    const from = Date.parse(temporal.validFrom);
    if (!Number.isNaN(from) && t < from) return false;
  }
  if (typeof temporal.validTo === "string") {
    const to = Date.parse(temporal.validTo);
    if (!Number.isNaN(to) && t > to) return false;
  }
  return true;
}

export function isContextRecord(
  row: IntelligenceLifecycleRecord,
): row is Extract<IntelligenceLifecycleRecord, { stage: "context" }> {
  return row.stage === "context";
}

/** Context must not carry interpretation fields. */
export function contextIsNotInterpretation(
  row: ContextualIntelligenceRecord,
): boolean {
  const extra = row as ContextualIntelligenceRecord & {
    hypothesis?: unknown;
    alternatives?: unknown;
    confidence?: unknown;
  };
  return (
    row.stage === "context" &&
    extra.hypothesis === undefined &&
    extra.alternatives === undefined &&
    extra.confidence === undefined
  );
}

export function createIntelligenceContext(
  input: AssembleContextInput,
): ContextualIntelligenceRecord {
  const subjectRefs = uniqueRecordRefs(input.subjectRefs);
  const evidenceRefs = uniqueRecordRefs(input.evidenceRefs);
  const relatedRefs = uniqueRecordRefs(input.relatedRefs).filter((ref) => {
    return !subjectRefs.some((subject) => subject.kind === ref.kind && subject.id === ref.id);
  });
  return {
    id: input.id,
    stage: "context",
    domain: input.domain,
    subjectRefs,
    evidenceRefs,
    relatedRefs,
    temporal: createTemporalContext(input.temporal),
    operating: normalizeStakeholderOperatingContext(input.operating),
    note: input.note,
    provenance: input.provenance,
  };
}

export function refsFromStakeholder(row: Stakeholder): IntelligenceRecordRef[] {
  const refs: IntelligenceRecordRef[] = [{ kind: "stakeholder", id: row.id }];
  if (row.placeId) refs.push({ kind: "place", id: row.placeId });
  for (const id of row.projectIds || []) {
    refs.push({ kind: "project", id });
  }
  for (const id of row.relatedStakeholderIds || []) {
    refs.push({ kind: "stakeholder", id });
  }
  return uniqueRecordRefs(refs);
}

export function relatedRefsFromRecords(input: {
  engagements?: Pick<Engagement, "id">[];
  commitments?: Pick<Commitment, "id">[];
  incidents?: Pick<Incident, "id">[];
  evidence?: Pick<EvidenceStub, "id">[];
}): IntelligenceRecordRef[] {
  const refs: IntelligenceRecordRef[] = [];
  for (const row of input.engagements || []) {
    refs.push({ kind: "engagement", id: row.id });
  }
  for (const row of input.commitments || []) {
    refs.push({ kind: "commitment", id: row.id });
  }
  for (const row of input.incidents || []) {
    refs.push({ kind: "incident", id: row.id });
  }
  for (const row of input.evidence || []) {
    refs.push({ kind: "evidence", id: row.id });
  }
  return uniqueRecordRefs(refs);
}

/**
 * Copies recorded influence. Other operating attributes are included only
 * when supplied — never inferred from counts, sentiment, or due dates.
 */
export function operatingContextFromStakeholder(
  row: Stakeholder,
  extras?: StakeholderOperatingContext,
): StakeholderOperatingContext | undefined {
  return normalizeStakeholderOperatingContext({
    influence: influenceAsContextLevel(row.influence),
    ...extras,
  });
}

export function assembleStakeholderContext(input: {
  id: string;
  stakeholder: Stakeholder;
  asOf?: string;
  capturedAt?: string;
  validFrom?: string;
  validTo?: string | null;
  operating?: StakeholderOperatingContext;
  evidenceRefs?: IntelligenceRecordRef[];
  relatedRefs?: IntelligenceRecordRef[];
  engagements?: Pick<Engagement, "id">[];
  commitments?: Pick<Commitment, "id">[];
  incidents?: Pick<Incident, "id">[];
  evidence?: Pick<EvidenceStub, "id">[];
  note?: string;
  provenance?: IntelligenceProvenance;
}): ContextualIntelligenceRecord {
  const subjectRefs: IntelligenceRecordRef[] = [
    { kind: "stakeholder", id: input.stakeholder.id },
  ];
  const fromStakeholder = refsFromStakeholder(input.stakeholder).filter(
    (ref) => !(ref.kind === "stakeholder" && ref.id === input.stakeholder.id),
  );
  const relatedRefs = uniqueRecordRefs([
    ...fromStakeholder,
    ...relatedRefsFromRecords({
      engagements: input.engagements,
      commitments: input.commitments,
      incidents: input.incidents,
    }),
    ...(input.relatedRefs || []),
  ]);
  const evidenceFromRecords = relatedRefsFromRecords({
    evidence: input.evidence,
  });
  const capturedAt =
    input.capturedAt ||
    input.stakeholder.updatedAt ||
    input.stakeholder.createdAt;
  const asOf = input.asOf || input.stakeholder.lastEngagedOn || capturedAt;
  return createIntelligenceContext({
    id: input.id,
    domain: "stakeholder",
    subjectRefs,
    relatedRefs,
    evidenceRefs: [...(input.evidenceRefs || []), ...evidenceFromRecords],
    temporal: {
      asOf,
      capturedAt,
      validFrom: input.validFrom,
      validTo: input.validTo,
    },
    operating: operatingContextFromStakeholder(
      input.stakeholder,
      input.operating,
    ),
    note: input.note,
    provenance:
      input.provenance ||
      createIntelligenceProvenance({
        producer: "recorded_fact",
        capturedAt,
        recordRefs: subjectRefs,
        humanReviewed: false,
      }),
  });
}
