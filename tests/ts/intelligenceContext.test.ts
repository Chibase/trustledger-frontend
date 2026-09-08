import {
  assembleStakeholderContext,
  asContextLevel,
  contextAppliesAt,
  contextIsNotInterpretation,
  createIntelligenceContext,
  createIntelligenceProvenance,
  createIntelligenceRecommendation,
  isContextRecord,
  operatingContextFromStakeholder,
  relatedRefsFromRecords,
} from "@/lib/intelligence";
import type { Stakeholder } from "@/types/stakeholder";
import { STAKEHOLDER_OPERATING_CONTEXT_KEYS } from "@/types/intelligenceContext";
import type { IntelligenceLifecycleRecord } from "@/types/intelligenceFoundation";

const stakeholder: Stakeholder = {
  id: "STK-CTX-1",
  name: "Example liaison",
  kind: "individual",
  status: "active",
  influence: "high",
  interests: [],
  tags: [],
  placeId: "za-place-1",
  projectIds: ["PRJ-1"],
  relatedStakeholderIds: ["STK-CTX-2"],
  lastEngagedOn: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-15T00:00:00.000Z",
};

describe("I-02 contextual intelligence foundation", () => {
  it("assembles descriptive stakeholder context without interpreting", () => {
    const row = assembleStakeholderContext({
      id: "ctx-1",
      stakeholder,
      operating: {
        impact: "medium",
        capacity: "low",
        commitment: "high",
        bauPressure: "high",
        competingPriorities: "medium",
        availability: "low",
        accountabilityClarity: "unknown",
        engagementBurden: "medium",
      },
      engagements: [{ id: "ENG-1" }],
      commitments: [{ id: "COM-1" }],
      evidence: [{ id: "EVD-1" }],
      validFrom: "2026-07-01T00:00:00.000Z",
      validTo: null,
    });

    expect(row.stage).toBe("context");
    expect(isContextRecord(row)).toBe(true);
    expect(contextIsNotInterpretation(row)).toBe(true);
    expect(row.subjectRefs).toEqual([{ kind: "stakeholder", id: "STK-CTX-1" }]);
    expect(row.relatedRefs).toEqual(
      expect.arrayContaining([
        { kind: "place", id: "za-place-1" },
        { kind: "project", id: "PRJ-1" },
        { kind: "stakeholder", id: "STK-CTX-2" },
        { kind: "engagement", id: "ENG-1" },
        { kind: "commitment", id: "COM-1" },
      ]),
    );
    expect(row.relatedRefs.some((ref) => ref.kind === "evidence")).toBe(false);
    expect(row.evidenceRefs).toEqual([{ kind: "evidence", id: "EVD-1" }]);
    expect(row.operating?.influence).toBe("high");
    expect(row.operating?.bauPressure).toBe("high");
    expect(row.operating?.commitment).toBe("high");
    expect(row.temporal.asOf).toBe("2026-08-01T00:00:00.000Z");
    expect(row.temporal.validTo).toBeNull();
    expect(row.provenance.producer).toBe("recorded_fact");
    expect(row.provenance.recordRefs).toEqual([
      { kind: "stakeholder", id: "STK-CTX-1" },
    ]);
  });

  it("does not infer operating levels from related record counts", () => {
    const copied = operatingContextFromStakeholder(stakeholder);
    expect(copied).toEqual({ influence: "high" });
    const many = relatedRefsFromRecords({
      engagements: [{ id: "a" }, { id: "b" }, { id: "c" }],
      commitments: [{ id: "c1" }, { id: "c2" }],
    });
    expect(many).toHaveLength(5);
    const assembled = assembleStakeholderContext({
      id: "ctx-2",
      stakeholder,
      engagements: [{ id: "a" }, { id: "b" }, { id: "c" }],
    });
    expect(assembled.operating).toEqual({ influence: "high" });
    expect(assembled.operating).not.toHaveProperty("engagementBurden");
    expect(assembled).not.toHaveProperty("hypothesis");
    expect(assembled).not.toHaveProperty("score");
  });

  it("treats context as time-bounded and distinct from recommendations", () => {
    const provenance = createIntelligenceProvenance({
      producer: "recorded_fact",
      recordRefs: [{ kind: "stakeholder", id: "STK-CTX-1" }],
    });
    const context = createIntelligenceContext({
      id: "ctx-window",
      provenance,
      subjectRefs: [{ kind: "stakeholder", id: "STK-CTX-1" }],
      temporal: {
        validFrom: "2026-01-01T00:00:00.000Z",
        validTo: "2026-06-30T00:00:00.000Z",
      },
      operating: { influence: asContextLevel("medium") },
    });
    expect(contextAppliesAt(context.temporal, "2026-03-01T00:00:00.000Z")).toBe(
      true,
    );
    expect(contextAppliesAt(context.temporal, "2026-08-01T00:00:00.000Z")).toBe(
      false,
    );

    const recommendation = createIntelligenceRecommendation({
      id: "rec-1",
      title: "Consider a listening step",
      action: "A person decides.",
      rationale: "Suggestion only.",
      provenance,
    });
    const stages: IntelligenceLifecycleRecord[] = [context, recommendation];
    expect(stages.map((row) => row.stage)).toEqual(["context", "recommendation"]);
    expect(STAKEHOLDER_OPERATING_CONTEXT_KEYS).toEqual([
      "influence",
      "impact",
      "capacity",
      "commitment",
      "bauPressure",
      "competingPriorities",
      "availability",
      "accountabilityClarity",
      "engagementBurden",
    ]);
  });

  it("does not mutate the source stakeholder record", () => {
    const before = { ...stakeholder, influence: stakeholder.influence };
    assembleStakeholderContext({
      id: "ctx-3",
      stakeholder,
      operating: { capacity: "low" },
    });
    expect(stakeholder).toEqual(before);
    expect(stakeholder).not.toHaveProperty("operatingContext");
  });
});
