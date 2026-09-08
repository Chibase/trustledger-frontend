/**
 * P-01 composer for the stakeholder intelligence & decision workspace.
 * Reuses I-01–I-06 assemblers. Does not infer signals from operating context,
 * score, persist, or call an LLM.
 */

import { assembleStakeholderContext } from "@/lib/intelligence/context";
import {
  createIntelligenceProvenance,
  recordHumanDecision,
  recommendationIsNotADecision,
  uniqueRecordRefs,
} from "@/lib/intelligence/foundation";
import { assembleInterpretationFromSignal } from "@/lib/intelligence/interpretation";
import {
  assembleRecommendationFromIntelligence,
  explainableRecommendationIsNotDecision,
} from "@/lib/intelligence/recommendation";
import { assembleSignalFromContext } from "@/lib/intelligence/signal";
import { assembleIntelligenceFromInterpretations } from "@/lib/intelligence/synthesis";
import type { SignalClassification } from "@/types/intelligenceSignal";
import type { Commitment } from "@/types/commitment";
import type { Engagement, EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { ContextualIntelligenceRecord } from "@/types/intelligenceContext";
import type {
  HumanDecisionStatus,
  IntelligenceActionRecord,
  IntelligenceHumanDecisionRecord,
  IntelligenceOutcomeRecord,
  IntelligenceRecordRef,
} from "@/types/intelligenceFoundation";
import type { ExplainableRecommendationRecord } from "@/types/intelligenceRecommendation";
import type { Stakeholder } from "@/types/stakeholder";
import type {
  RecommendationTrace,
  StakeholderChainBundle,
  StakeholderWorkspaceMode,
  StakeholderWorkspaceView,
} from "@/types/stakeholderIntelligenceWorkspace";

export function stakeholderContextId(stakeholderId: string): string {
  return `ctx-${stakeholderId}`;
}

export function createWorkspaceRecordId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${rand.toUpperCase()}`;
}

export function emptyStakeholderChain(
  stakeholderId: string,
  source: StakeholderChainBundle["source"] = "human",
): StakeholderChainBundle {
  return {
    stakeholderId,
    source,
    signals: [],
    interpretations: [],
    intelligence: [],
    recommendations: [],
    decisions: [],
    actions: [],
    outcomes: [],
    updatedAt: new Date().toISOString(),
  };
}

export function engagementsLinkedToStakeholder(
  stakeholderId: string,
  rows: Engagement[],
): Engagement[] {
  return rows.filter((row) => row.stakeholderIds.includes(stakeholderId));
}

export function commitmentsLinkedToStakeholder(
  stakeholderId: string,
  rows: Commitment[],
): Commitment[] {
  return rows.filter((row) => row.stakeholderIds.includes(stakeholderId));
}

function projectIdSet(stakeholder: Stakeholder): Set<string> {
  return new Set((stakeholder.projectIds || []).filter(Boolean));
}

export function recordsOnSharedProjects<
  T extends { id: string; projectId: string | null },
>(stakeholder: Stakeholder, rows: T[], excludeIds?: Set<string>): T[] {
  const ids = projectIdSet(stakeholder);
  if (!ids.size) return [];
  return rows.filter((row) => {
    if (!row.projectId || !ids.has(row.projectId)) return false;
    if (excludeIds?.has(row.id)) return false;
    return true;
  });
}

export function incidentsOnSharedProjects(
  stakeholder: Stakeholder,
  rows: Incident[],
): Incident[] {
  const ids = projectIdSet(stakeholder);
  if (!ids.size) return [];
  return rows.filter((row) => ids.has(row.projectId));
}

export function evidenceForIncidents(
  incidents: Pick<Incident, "id">[],
  rows: EvidenceStub[],
): EvidenceStub[] {
  const ids = new Set(incidents.map((row) => row.id));
  if (!ids.size) return [];
  return rows.filter((row) => ids.has(row.incidentId));
}

export type ComposeStakeholderWorkspaceInput = {
  stakeholder: Stakeholder;
  engagements?: Engagement[];
  commitments?: Commitment[];
  incidents?: Incident[];
  evidence?: EvidenceStub[];
  stored?: StakeholderChainBundle | null;
  customerWorkspace: boolean;
};

/**
 * Live operating picture + stored I-03–I-07 rows.
 * Does not invent signals from influence, counts, or BAU.
 * Customer workspaces never receive a seed_demo chain.
 */
export function composeStakeholderWorkspace(
  input: ComposeStakeholderWorkspaceInput,
): StakeholderWorkspaceView {
  const mode: StakeholderWorkspaceMode = input.customerWorkspace
    ? "customer"
    : "demo";
  const linkedEngagements = engagementsLinkedToStakeholder(
    input.stakeholder.id,
    input.engagements || [],
  );
  const linkedCommitments = commitmentsLinkedToStakeholder(
    input.stakeholder.id,
    input.commitments || [],
  );
  const linkedEngagementIds = new Set(linkedEngagements.map((row) => row.id));
  const linkedCommitmentIds = new Set(linkedCommitments.map((row) => row.id));
  const projectEngagements = recordsOnSharedProjects(
    input.stakeholder,
    input.engagements || [],
    linkedEngagementIds,
  );
  const projectCommitments = recordsOnSharedProjects(
    input.stakeholder,
    input.commitments || [],
    linkedCommitmentIds,
  );
  const projectIncidents = incidentsOnSharedProjects(
    input.stakeholder,
    input.incidents || [],
  );
  const projectEvidence = evidenceForIncidents(
    projectIncidents,
    input.evidence || [],
  );

  const context = assembleStakeholderContext({
    id: stakeholderContextId(input.stakeholder.id),
    stakeholder: input.stakeholder,
    engagements: [...linkedEngagements, ...projectEngagements],
    commitments: [...linkedCommitments, ...projectCommitments],
    incidents: projectIncidents,
    evidence: projectEvidence,
  });

  const stored = sanitizeStoredChain(input.stored, input.stakeholder.id, mode);
  const chainSource = stored
    ? stored.signals.length ||
      stored.recommendations.length ||
      stored.decisions.length
      ? stored.source
      : "none"
    : "none";

  return {
    stakeholder: input.stakeholder,
    mode,
    chainSource,
    context,
    linkedEngagements,
    linkedCommitments,
    projectEngagements,
    projectCommitments,
    projectIncidents,
    projectEvidence,
    signals: stored?.signals || [],
    interpretations: stored?.interpretations || [],
    intelligence: stored?.intelligence || [],
    recommendations: stored?.recommendations || [],
    decisions: stored?.decisions || [],
    actions: stored?.actions || [],
    outcomes: stored?.outcomes || [],
  };
}

function sanitizeStoredChain(
  stored: StakeholderChainBundle | null | undefined,
  stakeholderId: string,
  mode: StakeholderWorkspaceMode,
): StakeholderChainBundle | null {
  if (!stored || stored.stakeholderId !== stakeholderId) return null;
  if (mode === "customer" && stored.source === "seed_demo") return null;
  return stored;
}

export function traceRecommendation(
  recommendation: ExplainableRecommendationRecord,
): RecommendationTrace {
  return {
    recommendationId: recommendation.id,
    intelligenceIds: [...recommendation.intelligenceIds],
    interpretationIds: [...recommendation.interpretationIds],
    signalIds: [...recommendation.signalIds],
    contextIds: [...recommendation.contextIds],
    evidenceRefs: uniqueRecordRefs(recommendation.evidenceRefs),
  };
}

export function workspaceRecommendationIsSuggestion(
  row: ExplainableRecommendationRecord,
): boolean {
  return (
    explainableRecommendationIsNotDecision(row) &&
    recommendationIsNotADecision(row)
  );
}

export function recordWorkspaceSignal(input: {
  bundle: StakeholderChainBundle;
  context: ContextualIntelligenceRecord;
  summary: string;
  explanation: string;
  classification: SignalClassification;
  id?: string;
}): StakeholderChainBundle {
  const signal = assembleSignalFromContext({
    id: input.id || createWorkspaceRecordId("SIG"),
    context: input.context,
    summary: input.summary,
    explanation: input.explanation,
    classification: input.classification,
  });
  return {
    ...input.bundle,
    source: input.bundle.source === "seed_demo" ? "seed_demo" : "human",
    signals: [...input.bundle.signals, signal],
    updatedAt: new Date().toISOString(),
  };
}

export function recordWorkspaceInterpretation(input: {
  bundle: StakeholderChainBundle;
  context: ContextualIntelligenceRecord;
  signalId: string;
  hypothesis: string;
  rationale: string;
  alternatives?: string[];
  id?: string;
}): StakeholderChainBundle {
  const signal = input.bundle.signals.find((row) => row.id === input.signalId);
  if (!signal) {
    throw new Error("recordWorkspaceInterpretation: unknown signal");
  }
  const interpretation = assembleInterpretationFromSignal({
    id: input.id || createWorkspaceRecordId("INT"),
    signal,
    context: input.context,
    hypothesis: input.hypothesis,
    rationale: input.rationale,
    alternatives: input.alternatives,
  });
  return {
    ...input.bundle,
    interpretations: [...input.bundle.interpretations, interpretation],
    updatedAt: new Date().toISOString(),
  };
}

export function recordWorkspaceIntelligence(input: {
  bundle: StakeholderChainBundle;
  interpretationIds: string[];
  statement: string;
  synthesis: string;
  id?: string;
}): StakeholderChainBundle {
  const interpretations = input.bundle.interpretations.filter((row) =>
    input.interpretationIds.includes(row.id),
  );
  if (!interpretations.length) {
    throw new Error("recordWorkspaceIntelligence: interpretation required");
  }
  const intelligence = assembleIntelligenceFromInterpretations({
    id: input.id || createWorkspaceRecordId("SYN"),
    interpretations,
    statement: input.statement,
    synthesis: input.synthesis,
  });
  return {
    ...input.bundle,
    intelligence: [...input.bundle.intelligence, intelligence],
    updatedAt: new Date().toISOString(),
  };
}

export function recordWorkspaceRecommendation(input: {
  bundle: StakeholderChainBundle;
  intelligenceIds: string[];
  statement: string;
  action: string;
  rationale: string;
  objective: string;
  id?: string;
}): StakeholderChainBundle {
  const intelligence = input.bundle.intelligence.filter((row) =>
    input.intelligenceIds.includes(row.id),
  );
  if (!intelligence.length) {
    throw new Error("recordWorkspaceRecommendation: intelligence required");
  }
  const recommendation = assembleRecommendationFromIntelligence({
    id: input.id || createWorkspaceRecordId("REC"),
    intelligence,
    statement: input.statement,
    action: input.action,
    rationale: input.rationale,
    objective: input.objective,
  });
  if (!workspaceRecommendationIsSuggestion(recommendation)) {
    throw new Error("recordWorkspaceRecommendation: must remain a suggestion");
  }
  return {
    ...input.bundle,
    recommendations: [...input.bundle.recommendations, recommendation],
    updatedAt: new Date().toISOString(),
  };
}

export function recordWorkspaceDecision(input: {
  bundle: StakeholderChainBundle;
  recommendationId: string;
  status: HumanDecisionStatus;
  decidedBy?: string;
  note?: string;
  id?: string;
  decidedAt?: string;
}): {
  bundle: StakeholderChainBundle;
  decision: IntelligenceHumanDecisionRecord;
  recommendation: ExplainableRecommendationRecord;
} {
  const recommendation = input.bundle.recommendations.find(
    (row) => row.id === input.recommendationId,
  );
  if (!recommendation) {
    throw new Error("recordWorkspaceDecision: unknown recommendation");
  }
  if (!workspaceRecommendationIsSuggestion(recommendation)) {
    throw new Error("recordWorkspaceDecision: recommendation is not a suggestion");
  }
  const decision = recordHumanDecision({
    id: input.id || createWorkspaceRecordId("DEC"),
    recommendationId: recommendation.id,
    status: input.status,
    decidedAt: input.decidedAt || new Date().toISOString(),
    decidedBy: input.decidedBy,
    note: input.note,
    domain: recommendation.domain,
    provenance: createIntelligenceProvenance({
      producer: "human",
      capturedAt: input.decidedAt || new Date().toISOString(),
      recordRefs: [
        { kind: "stakeholder", id: input.bundle.stakeholderId },
        ...recommendation.subjectRefs,
        ...recommendation.evidenceRefs,
      ],
      humanReviewed: true,
    }),
  });
  return {
    recommendation,
    decision,
    bundle: {
      ...input.bundle,
      decisions: [...input.bundle.decisions, decision],
      updatedAt: new Date().toISOString(),
    },
  };
}

export function recordWorkspaceAction(input: {
  bundle: StakeholderChainBundle;
  decisionId: string;
  summary: string;
  occurredAt?: string;
  refs?: IntelligenceRecordRef[];
  id?: string;
}): StakeholderChainBundle {
  const decision = input.bundle.decisions.find((row) => row.id === input.decisionId);
  if (!decision) {
    throw new Error("recordWorkspaceAction: unknown human decision");
  }
  const summary = input.summary.trim();
  if (!summary) {
    throw new Error("recordWorkspaceAction: summary required");
  }
  const action: IntelligenceActionRecord = {
    id: input.id || createWorkspaceRecordId("ACT"),
    stage: "action",
    domain: decision.domain,
    decisionId: decision.id,
    summary,
    occurredAt: input.occurredAt || new Date().toISOString(),
    refs: uniqueRecordRefs(input.refs),
    provenance: createIntelligenceProvenance({
      producer: "human",
      capturedAt: input.occurredAt || new Date().toISOString(),
      recordRefs: [{ kind: "decision", id: decision.id }, ...(input.refs || [])],
      humanReviewed: true,
    }),
  };
  return {
    ...input.bundle,
    actions: [...input.bundle.actions, action],
    updatedAt: new Date().toISOString(),
  };
}

export function recordWorkspaceOutcome(input: {
  bundle: StakeholderChainBundle;
  actionId?: string;
  decisionId?: string;
  summary: string;
  recordedAt?: string;
  id?: string;
}): StakeholderChainBundle {
  const summary = input.summary.trim();
  if (!summary) {
    throw new Error("recordWorkspaceOutcome: summary required");
  }
  const action = input.actionId
    ? input.bundle.actions.find((row) => row.id === input.actionId)
    : undefined;
  const decisionId = input.decisionId || action?.decisionId;
  if (!decisionId) {
    throw new Error("recordWorkspaceOutcome: decision or action required");
  }
  const decision = input.bundle.decisions.find((row) => row.id === decisionId);
  if (!decision) {
    throw new Error("recordWorkspaceOutcome: unknown human decision");
  }
  const outcome: IntelligenceOutcomeRecord = {
    id: input.id || createWorkspaceRecordId("OUT"),
    stage: "outcome",
    domain: decision.domain,
    actionId: action?.id,
    decisionId: decision.id,
    summary,
    recordedAt: input.recordedAt || new Date().toISOString(),
    provenance: createIntelligenceProvenance({
      producer: "human",
      capturedAt: input.recordedAt || new Date().toISOString(),
      recordRefs: [
        { kind: "decision", id: decision.id },
        ...(action ? [{ kind: "action" as const, id: action.id }] : []),
      ],
      humanReviewed: true,
    }),
  };
  return {
    ...input.bundle,
    outcomes: [...input.bundle.outcomes, outcome],
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Explicit labelled demo chain. Caller-supplied classification — not inferred
 * from influence or activity counts. Never use for customer workspaces.
 */
export function buildDemoSampleChain(
  stakeholder: Stakeholder,
  context: ContextualIntelligenceRecord,
): StakeholderChainBundle {
  let bundle = emptyStakeholderChain(stakeholder.id, "seed_demo");
  bundle = recordWorkspaceSignal({
    bundle,
    context,
    id: `SIG-DEMO-${stakeholder.id}`,
    classification: "observation",
    summary:
      "SAMPLE observation: a demonstration signal was supplied for this seed stakeholder.",
    explanation:
      "SAMPLE only. Classification and explanation were supplied by the demo helper. They are not inferred from influence, engagement counts, or BAU pressure, and they are not customer evidence.",
  });
  bundle = recordWorkspaceInterpretation({
    bundle,
    context,
    signalId: bundle.signals[0].id,
    id: `INT-DEMO-${stakeholder.id}`,
    hypothesis:
      "SAMPLE hypothesis: the relationship file may be incomplete rather than inactive.",
    rationale:
      "SAMPLE only. Absence of linked engagement rows is not proof of inactivity. This hypothesis is labelled demonstration text, not a finding about a customer.",
    alternatives: [
      "The stakeholder is active off-file and records have not been linked.",
    ],
  });
  bundle = recordWorkspaceIntelligence({
    bundle,
    interpretationIds: [bundle.interpretations[0].id],
    id: `SYN-DEMO-${stakeholder.id}`,
    statement:
      "SAMPLE intelligence: this seed file does not yet show a governed engagement trail.",
    synthesis:
      "SAMPLE only. The synthesis notes a documentation gap on a demo record. It is not a risk score, prediction, or copied hypothesis, and it is not customer intelligence.",
  });
  bundle = recordWorkspaceRecommendation({
    bundle,
    intelligenceIds: [bundle.intelligence[0].id],
    id: `REC-DEMO-${stakeholder.id}`,
    statement:
      "SAMPLE suggestion: a person should decide whether to link existing engagements or leave the file unchanged.",
    action:
      "Review whether real engagements exist off this card and, if they do, link them on the registry.",
    rationale:
      "SAMPLE only. Suggestion-only (ADR-006). Accepting this suggestion is not a human decision record.",
    objective:
      "Make the demonstration stakeholder file decision-ready without inventing customer activity.",
  });
  bundle.source = "seed_demo";
  return bundle;
}
