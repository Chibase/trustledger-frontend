import {
  buildDemoSampleChain,
  composeStakeholderWorkspace,
  emptyStakeholderChain,
  recordWorkspaceAction,
  recordWorkspaceDecision,
  recordWorkspaceIntelligence,
  recordWorkspaceInterpretation,
  recordWorkspaceOutcome,
  recordWorkspaceRecommendation,
  recordWorkspaceSignal,
  stakeholderContextId,
  traceRecommendation,
  workspaceRecommendationIsSuggestion,
} from "@/lib/intelligence/stakeholderWorkspace";
import {
  loadStakeholderChain,
  saveStakeholderChain,
  STAKEHOLDER_WORKSPACE_STORAGE_KEY,
} from "@/lib/intelligence/stakeholderWorkspaceStore";
import type { Commitment } from "@/types/commitment";
import type { Engagement, EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Stakeholder } from "@/types/stakeholder";

function stakeholder(over: Partial<Stakeholder> = {}): Stakeholder {
  return {
    id: "STK-TEST",
    name: "Test Forum",
    kind: "community_group",
    status: "active",
    influence: "high",
    interests: ["Water"],
    tags: [],
    source: "trial",
    projectIds: over.projectIds,
    ...over,
  };
}

function engagement(over: Partial<Engagement> = {}): Engagement {
  return {
    id: "ENG-TEST",
    title: "Held briefing",
    kind: "briefing",
    status: "held",
    ward: "Ward 12",
    projectId: "PRJ-1",
    heldOn: "2026-09-01",
    summary: "Discussed access.",
    attendeesLabel: "Forum",
    actionItems: [],
    stakeholderIds: ["STK-TEST"],
    source: "trial",
    createdAt: "2026-09-01T10:00:00.000Z",
    ...over,
  };
}

function commitment(over: Partial<Commitment> = {}): Commitment {
  return {
    id: "COM-TEST",
    title: "Follow-up note",
    status: "open",
    ownerLabel: "Desk",
    dueOn: "2026-09-08",
    projectId: "PRJ-1",
    engagementId: "ENG-TEST",
    stakeholderIds: ["STK-TEST"],
    createdAt: "2026-09-01T11:00:00.000Z",
    ...over,
  };
}

function incident(over: Partial<Incident> = {}): Incident {
  return {
    id: "INC-SEED-99",
    title: "Showcase dust case",
    description: "Demo case",
    ward: "Ward 12",
    geographicArea: "Demo",
    status: "Open",
    priority: "P3-Medium",
    projectId: "PRJ-1",
    projectName: "Demo",
    reportedByRole: "community",
    reportedAt: "2026-09-01T08:00:00.000Z",
    slaDueBy: "2026-09-04T08:00:00.000Z",
    slaBreached: false,
    escalationLevel: "None",
    ownerName: "Desk",
    category: "Environment",
    impactScore: 0,
    sentimentScore: null,
    timeline: [],
    ...over,
  };
}

describe("P-01 stakeholder intelligence workspace", () => {
  it("assembles context from recorded influence and linked activity without inferring signals", () => {
    const view = composeStakeholderWorkspace({
      stakeholder: stakeholder({ influence: "high" }),
      engagements: [
        engagement(),
        engagement({
          id: "ENG-OTHER",
          stakeholderIds: ["STK-OTHER"],
          title: "Someone else",
        }),
      ],
      commitments: [commitment()],
      incidents: [incident()],
      customerWorkspace: true,
    });
    expect(view.context.stage).toBe("context");
    expect(view.context.id).toBe(stakeholderContextId("STK-TEST"));
    expect(view.context.operating?.influence).toBe("high");
    expect(view.context.operating?.bauPressure).toBeUndefined();
    expect(view.linkedEngagements.map((row) => row.id)).toEqual(["ENG-TEST"]);
    expect(view.linkedCommitments.map((row) => row.id)).toEqual(["COM-TEST"]);
    expect(view.signals).toEqual([]);
    expect(view.recommendations).toEqual([]);
    expect(view.chainSource).toBe("none");
  });

  it("does not attach showcase incidents unless the stakeholder has a matching project link", () => {
    const withoutProject = composeStakeholderWorkspace({
      stakeholder: stakeholder({ projectIds: undefined }),
      incidents: [incident()],
      evidence: [
        {
          id: "EVD-1",
          incidentId: "INC-SEED-99",
          fileName: "photo.jpg",
          classification: "General",
          uploadedBy: "demo",
          uploadedAt: "2026-09-01T09:00:00.000Z",
          isPrimary: true,
        } satisfies EvidenceStub,
      ],
      customerWorkspace: true,
    });
    expect(withoutProject.projectIncidents).toEqual([]);
    expect(withoutProject.projectEvidence).toEqual([]);

    const withProject = composeStakeholderWorkspace({
      stakeholder: stakeholder({ projectIds: ["PRJ-1"] }),
      incidents: [incident()],
      evidence: [
        {
          id: "EVD-1",
          incidentId: "INC-SEED-99",
          fileName: "photo.jpg",
          classification: "General",
          uploadedBy: "demo",
          uploadedAt: "2026-09-01T09:00:00.000Z",
          isPrimary: true,
        },
      ],
      customerWorkspace: true,
    });
    expect(withProject.projectIncidents.map((row) => row.id)).toEqual([
      "INC-SEED-99",
    ]);
  });

  it("drops seed_demo chains in a customer workspace", () => {
    const contextView = composeStakeholderWorkspace({
      stakeholder: stakeholder({ source: "seed" }),
      customerWorkspace: false,
    });
    const sample = buildDemoSampleChain(
      stakeholder({ source: "seed" }),
      contextView.context,
    );
    expect(sample.source).toBe("seed_demo");
    expect(sample.signals[0].summary).toMatch(/SAMPLE/);
    expect(JSON.stringify(sample)).not.toMatch(/INC-/);

    const customerView = composeStakeholderWorkspace({
      stakeholder: stakeholder({ source: "seed" }),
      stored: sample,
      customerWorkspace: true,
    });
    expect(customerView.signals).toEqual([]);
    expect(customerView.chainSource).toBe("none");
  });

  it("preserves recommendation → intelligence → interpretation → signal → context → evidence", () => {
    const person = stakeholder({ projectIds: ["PRJ-1"] });
    const view = composeStakeholderWorkspace({
      stakeholder: person,
      engagements: [engagement()],
      evidence: [],
      customerWorkspace: false,
    });
    let bundle = emptyStakeholderChain(person.id);
    bundle = recordWorkspaceSignal({
      bundle,
      context: view.context,
      classification: "observation",
      summary: "Follow-up was recorded against this stakeholder.",
      explanation: "A held briefing is linked on the engagement record.",
    });
    bundle = recordWorkspaceInterpretation({
      bundle,
      context: view.context,
      signalId: bundle.signals[0].id,
      hypothesis: "The relationship may still need a named next step.",
      rationale: "A linked briefing is not by itself a closed commitment trail.",
    });
    bundle = recordWorkspaceIntelligence({
      bundle,
      interpretationIds: [bundle.interpretations[0].id],
      statement: "The file shows contact without a governed close-out.",
      synthesis:
        "The linked briefing is on file; no hypothesis is restated as fact, and no score is applied.",
    });
    bundle = recordWorkspaceRecommendation({
      bundle,
      intelligenceIds: [bundle.intelligence[0].id],
      statement: "A person should decide whether to schedule a close-out.",
      action: "Review the briefing record and decide if a follow-up is needed.",
      rationale: "Suggestion only — the intelligence does not decide.",
      objective: "Keep the relationship file decision-ready.",
    });
    const rec = bundle.recommendations[0];
    expect(workspaceRecommendationIsSuggestion(rec)).toBe(true);
    const trace = traceRecommendation(rec);
    expect(trace.intelligenceIds).toEqual([bundle.intelligence[0].id]);
    expect(trace.interpretationIds).toEqual([bundle.interpretations[0].id]);
    expect(trace.signalIds).toEqual([bundle.signals[0].id]);
    expect(trace.contextIds).toContain(view.context.id);
    expect(rec).not.toHaveProperty("status");
  });

  it("records a human decision as a new record and does not mutate the recommendation", () => {
    const view = composeStakeholderWorkspace({
      stakeholder: stakeholder({ source: "seed" }),
      customerWorkspace: false,
    });
    const sample = buildDemoSampleChain(
      stakeholder({ source: "seed" }),
      view.context,
    );
    const before = JSON.parse(JSON.stringify(sample.recommendations[0]));
    const result = recordWorkspaceDecision({
      bundle: sample,
      recommendationId: sample.recommendations[0].id,
      status: "accepted",
      decidedBy: "A. Operator",
      note: "Proceed with linking real engagements.",
    });
    expect(result.decision.stage).toBe("human_decision");
    expect(result.decision.recommendationId).toBe(before.id);
    expect(result.decision.status).toBe("accepted");
    expect(result.recommendation).toEqual(before);
    expect(workspaceRecommendationIsSuggestion(result.recommendation)).toBe(
      true,
    );
    expect(() =>
      recordWorkspaceDecision({
        bundle: emptyStakeholderChain("STK-TEST"),
        recommendationId: "missing",
        status: "accepted",
      }),
    ).toThrow(/unknown recommendation/);
  });

  it("records action and outcome only after a human decision", () => {
    const view = composeStakeholderWorkspace({
      stakeholder: stakeholder({ source: "seed" }),
      customerWorkspace: false,
    });
    const sample = buildDemoSampleChain(
      stakeholder({ source: "seed" }),
      view.context,
    );
    expect(() =>
      recordWorkspaceAction({
        bundle: sample,
        decisionId: "missing",
        summary: "Called the forum.",
      }),
    ).toThrow(/unknown human decision/);
    const decided = recordWorkspaceDecision({
      bundle: sample,
      recommendationId: sample.recommendations[0].id,
      status: "accepted",
      decidedBy: "A. Operator",
    });
    const withAction = recordWorkspaceAction({
      bundle: decided.bundle,
      decisionId: decided.decision.id,
      summary: "Operator reviewed the registry links.",
    });
    const withOutcome = recordWorkspaceOutcome({
      bundle: withAction,
      actionId: withAction.actions[0].id,
      summary: "No off-file engagement was found.",
    });
    expect(withAction.actions[0].decisionId).toBe(decided.decision.id);
    expect(withOutcome.outcomes[0].decisionId).toBe(decided.decision.id);
  });
});

describe("P-01 stakeholder workspace store", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("refuses to persist a seed_demo chain in a customer workspace", () => {
    const view = composeStakeholderWorkspace({
      stakeholder: stakeholder({ source: "seed" }),
      customerWorkspace: false,
    });
    const sample = buildDemoSampleChain(
      stakeholder({ source: "seed" }),
      view.context,
    );
    expect(() =>
      saveStakeholderChain(sample, { customerWorkspace: true }),
    ).toThrow(/customer workspace/);
    expect(window.localStorage.getItem(STAKEHOLDER_WORKSPACE_STORAGE_KEY)).toBeNull();
  });

  it("returns empty instead of a stored seed_demo chain when read as customer", () => {
    const view = composeStakeholderWorkspace({
      stakeholder: stakeholder({ source: "seed" }),
      customerWorkspace: false,
    });
    const sample = buildDemoSampleChain(
      stakeholder({ source: "seed" }),
      view.context,
    );
    saveStakeholderChain(sample, { customerWorkspace: false });
    const loaded = loadStakeholderChain("STK-TEST", { customerWorkspace: true });
    expect(loaded.source).toBe("human");
    expect(loaded.signals).toEqual([]);
  });
});
