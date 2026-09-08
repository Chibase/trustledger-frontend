import {
  commonRecommendationFromTrust,
  createIntelligenceProvenance,
  createIntelligenceRecommendation,
  intelligenceLifecycleIndex,
  isHumanDecisionRecord,
  isRecommendationRecord,
  isSuggestionGovernance,
  recordHumanDecision,
  recommendationIsNotADecision,
  stampSuggestion,
  suggestionGovernance,
} from "@/lib/intelligence";
import { composeTrustIntelligence, createTrustObservation } from "@/lib/trust";
import type { TrustObservation } from "@/types/trustLayer";
import {
  INTELLIGENCE_LIFECYCLE_STAGES,
  type IntelligenceLifecycleRecord,
} from "@/types/intelligenceFoundation";

function obs(
  id: string,
  at: string,
  signal: "positive" | "neutral" | "negative",
  extra: Partial<TrustObservation> = {},
): TrustObservation {
  return createTrustObservation({
    id,
    observedAt: at,
    dimension: extra.dimension || "process",
    signal,
    source: extra.source || "incident",
    sourceId: extra.sourceId,
    evidenceIds: extra.evidenceIds,
  });
}

describe("I-01 common intelligence foundation", () => {
  it("keeps the ten lifecycle stages in order and distinguishable", () => {
    expect(INTELLIGENCE_LIFECYCLE_STAGES).toEqual([
      "evidence",
      "context",
      "signal",
      "interpretation",
      "intelligence",
      "recommendation",
      "human_decision",
      "action",
      "outcome",
      "learning",
    ]);
    expect(intelligenceLifecycleIndex("evidence")).toBe(0);
    expect(intelligenceLifecycleIndex("learning")).toBe(9);
    expect(intelligenceLifecycleIndex("signal")).toBeLessThan(
      intelligenceLifecycleIndex("interpretation"),
    );
    expect(intelligenceLifecycleIndex("recommendation")).toBeLessThan(
      intelligenceLifecycleIndex("human_decision"),
    );
    expect(intelligenceLifecycleIndex("action")).toBeLessThan(
      intelligenceLifecycleIndex("outcome"),
    );
  });

  it("stamps machine output as suggestion-only and never autonomous", () => {
    const governance = suggestionGovernance();
    expect(isSuggestionGovernance(governance)).toBe(true);
    expect(governance.decision).toBe("suggestion_only");
    expect(governance.humanApplyRequired).toBe(true);
    expect(governance.autonomous).toBe(false);
    const stamped = stampSuggestion({ title: "draft" });
    expect(stamped.autonomous).toBe(false);
    expect(stamped.decision).toBe("suggestion_only");
  });

  it("keeps recommendations separate from human decisions", () => {
    const provenance = createIntelligenceProvenance({
      producer: "rule",
      method: { kind: "rule", id: "example-rule" },
      recordRefs: [{ kind: "evidence", id: "EVD-1" }],
    });
    const recommendation = createIntelligenceRecommendation({
      id: "rec-1",
      title: "Consider a listening step",
      action: "A person should decide whether to hold a listening session.",
      rationale: "Signal only — not a conclusion.",
      provenance,
    });
    expect(isRecommendationRecord(recommendation)).toBe(true);
    expect(recommendationIsNotADecision(recommendation)).toBe(true);
    expect(recommendation.governance.autonomous).toBe(false);

    const decision = recordHumanDecision({
      id: "dec-1",
      recommendationId: recommendation.id,
      status: "accepted",
      provenance,
      decidedBy: "plan-owner",
    });
    expect(isHumanDecisionRecord(decision)).toBe(true);
    expect(decision.stage).not.toBe(recommendation.stage);
    expect(decision.provenance.producer).toBe("human");
    expect(decision.provenance.humanReviewed).toBe(true);

    const stages = [recommendation, decision].map((row) => row.stage);
    expect(new Set(stages).size).toBe(2);
  });

  it("does not hard-code a methodology engine — methods are identity only", () => {
    const provenance = createIntelligenceProvenance({
      producer: "methodology",
      method: {
        kind: "methodology",
        id: "client-specific-lens",
        version: "0.0-placeholder",
        summary: "Identity stub; no scoring engine.",
      },
    });
    expect(provenance.method?.id).toBe("client-specific-lens");
    expect(provenance.method).not.toHaveProperty("score");
    expect(provenance.method).not.toHaveProperty("engine");
    expect(Object.keys(provenance.method || {}).sort()).toEqual(
      ["id", "kind", "summary", "version"].sort(),
    );
  });

  it("maps existing TE-4 trust recommendations onto the common contract without changing them", () => {
    const brief = composeTrustIntelligence({
      generatedAt: "2026-09-08T12:00:00.000Z",
      observations: [
        obs("a", "2026-01-01T00:00:00Z", "neutral", { sourceId: "INC-1001" }),
        obs("b", "2026-04-01T00:00:00Z", "negative", { sourceId: "INC-1001" }),
      ],
    });
    expect(brief.recommendations.length).toBeGreaterThan(0);
    expect(
      brief.recommendations.every((row) => row.decision === "suggestion_only"),
    ).toBe(true);

    const mapped = brief.recommendations.map(commonRecommendationFromTrust);
    expect(mapped.every((row) => row.stage === "recommendation")).toBe(true);
    expect(mapped.every((row) => row.domain === "trust")).toBe(true);
    expect(
      mapped.every((row) => isSuggestionGovernance(row.governance)),
    ).toBe(true);
    expect(mapped[0].provenance.producer).toBe("rule");
    expect(mapped[0].provenance.method?.kind).toBe("rule");
    expect(
      mapped[0].provenance.recordRefs.some(
        (ref) => ref.kind === "observation" || ref.kind === "incident",
      ),
    ).toBe(true);

    const union: IntelligenceLifecycleRecord[] = mapped;
    expect(union.every(isRecommendationRecord)).toBe(true);
  });
});
