import { SEP_DOCTYPE_NAMES, sepDocTypePayload } from "@/lib/frappeSepDocTypes";
import {
  engagementPlanToFrappeDoc,
  frappeToEngagementPlan,
  frappeToSepOverlay,
  sanitizePlanForCloud,
  sepShouldWriteExecution,
} from "@/lib/sepCloud";
import { overlayLocalPlansOntoCloud } from "@/lib/sepPersist";
import type { EngagementPlan } from "@/types/engagementPlan";
import type { SepExecutionOverlay } from "@/types/sepExecution";

function samplePlan(over: Partial<EngagementPlan> = {}): EngagementPlan {
  return {
    id: "SEP-CLOUD-1",
    title: "Ward clinic SEP",
    status: "saved",
    sourceKind: "briefing",
    sectorId: "health",
    programmeKind: "standard",
    projectId: "PRJ-1",
    projectNameHint: "Clinic upgrade",
    placeHint: "Ward 12",
    clientFunderHint: "Acme Funder",
    timelineHint: "12 weeks",
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-06-02T09:00:00.000Z",
    sourceExcerpt: "Consult on clinic hours.",
    purposeStatement: "Inform and consult ward residents.",
    phases: [],
    stakeholderClasses: [],
    activities: [],
    commitments: [],
    instruments: [],
    grievancePath: "Ward office",
    assumptions: ["Access road stays open."],
    documentSections: [
      { id: "s1", heading: "Purpose", body: "Consult residents." },
    ],
    documentDrafter: "gemini",
    ...over,
  };
}

function sampleOverlay(
  over: Partial<SepExecutionOverlay> = {},
): SepExecutionOverlay {
  return {
    version: 1,
    planId: "SEP-CLOUD-1",
    submittedAt: "2026-06-01T08:00:00.000Z",
    ownerName: "Lebo",
    lastReviewAt: null,
    milestones: [],
    tasks: [],
    events: [],
    interventions: [],
    activityLog: [],
    ...over,
  };
}

describe("SI-SEP Cloud persist", () => {
  it("requires customer on the DocType payload", () => {
    expect([...SEP_DOCTYPE_NAMES]).toEqual(["TL Engagement Plan"]);
    const payload = sepDocTypePayload();
    const fields = payload.fields as Array<{ fieldname: string; reqd?: number }>;
    expect(fields.some((f) => f.fieldname === "customer" && f.reqd === 1)).toBe(
      true,
    );
    expect(fields.some((f) => f.fieldname === "plan_code" && f.reqd === 1)).toBe(
      true,
    );
    expect(fields.some((f) => f.fieldname === "payload")).toBe(true);
    expect(fields.some((f) => f.fieldname === "execution_json")).toBe(true);
  });

  it("maps indexed columns and stores the rest as payload JSON", () => {
    const doc = engagementPlanToFrappeDoc(samplePlan(), "Acme Customer", {
      orgId: "org-1",
    });
    expect(doc.customer).toBe("Acme Customer");
    expect(doc.plan_code).toBe("SEP-CLOUD-1");
    expect(doc.title).toBe("Ward clinic SEP");
    expect(doc.status).toBe("saved");
    expect(doc.source_kind).toBe("briefing");
    expect(doc.sector_id).toBe("health");
    expect(doc.programme_kind).toBe("standard");
    expect(doc.project_id).toBe("PRJ-1");
    expect(doc.place_hint).toBe("Ward 12");
    expect(doc.tl_org_id).toBe("org-1");
    expect(doc.created_at).toBe("2026-06-01 08:00:00");
    expect(doc.updated_at).toBe("2026-06-02 09:00:00");
    expect(doc).not.toHaveProperty("execution_json");
    const payload = JSON.parse(String(doc.payload)) as EngagementPlan;
    expect(payload.documentSections[0]?.heading).toBe("Purpose");
    expect(payload.assumptions).toEqual(["Access road stays open."]);
    expect(payload.grievancePath).toBe("Ward office");
    const back = frappeToEngagementPlan(doc);
    expect(back.id).toBe("SEP-CLOUD-1");
    expect(back.documentDrafter).toBe("gemini");
    expect(back.createdAt).toBe("2026-06-01T08:00:00.000Z");
  });

  it("writes execution overlay JSON only when includeExecution is set", () => {
    const overlay = sampleOverlay();
    const withOverlay = engagementPlanToFrappeDoc(samplePlan(), "Acme Customer", {
      overlay,
      includeExecution: true,
    });
    expect(withOverlay.execution_json).toContain("SEP-CLOUD-1");
    const parsed = frappeToSepOverlay(withOverlay.execution_json);
    expect(parsed?.ownerName).toBe("Lebo");
    expect(parsed?.version).toBe(1);

    const omitted = engagementPlanToFrappeDoc(samplePlan(), "Acme Customer", {
      overlay,
      includeExecution: false,
    });
    expect(omitted).not.toHaveProperty("execution_json");
  });

  it("does not treat overlay:null as an execution wipe", () => {
    expect(
      sepShouldWriteExecution({ overlay: null, includeExecution: true }),
    ).toBe(false);
    expect(sepShouldWriteExecution({ overlay: undefined })).toBe(false);
    expect(
      sepShouldWriteExecution({
        overlay: sampleOverlay(),
        includeExecution: false,
      }),
    ).toBe(false);
    expect(sepShouldWriteExecution({ overlay: sampleOverlay() })).toBe(true);
  });

  it("does not invent now when created and updated times are blank", () => {
    const today = new Date().toISOString().slice(0, 10);
    const doc = engagementPlanToFrappeDoc(
      samplePlan({ createdAt: "", updatedAt: "  " }),
      "Acme Customer",
    );
    expect(doc).not.toHaveProperty("created_at");
    expect(doc).not.toHaveProperty("updated_at");
    expect(JSON.stringify(doc.created_at || "")).not.toContain(today);
    const back = frappeToEngagementPlan({
      plan_code: "SEP-CLOUD-1",
      title: "Ward clinic SEP",
      customer: "Acme Customer",
      payload: JSON.stringify(samplePlan({ createdAt: "", updatedAt: "" })),
      created_at: "",
      updated_at: null,
    });
    expect(back.createdAt).toBe("");
    expect(back.updatedAt).toBe("");
    expect(back.createdAt).not.toContain(today);
  });

  it("does not surface local-only rows when Cloud is empty", () => {
    const local = samplePlan({ id: "SEP-LOCAL-ONLY" });
    expect(overlayLocalPlansOntoCloud([], [local])).toEqual([]);
  });

  it("lets Cloud fields win over a stale local cache", () => {
    const cloud = samplePlan({ title: "Cloud title", placeHint: "Ward 3" });
    const local = samplePlan({ title: "Local title", placeHint: "Ward 99" });
    const merged = overlayLocalPlansOntoCloud([cloud], [local]);
    expect(merged[0]?.title).toBe("Cloud title");
    expect(merged[0]?.placeHint).toBe("Ward 3");
  });

  it("strips Gemini keys from Cloud columns", () => {
    const stuffed = {
      ...samplePlan(),
      geminiApiKey: "secret-key",
      GEMINI_API_KEY: "secret-key",
      apiKey: "secret-key",
    } as EngagementPlan & {
      geminiApiKey: string;
      GEMINI_API_KEY: string;
      apiKey: string;
    };
    const safe = sanitizePlanForCloud(stuffed);
    expect(
      (safe as unknown as { geminiApiKey?: string }).geminiApiKey,
    ).toBeUndefined();
    const doc = engagementPlanToFrappeDoc(stuffed, "Acme Customer");
    const raw = JSON.stringify(doc);
    expect(raw).not.toContain("secret-key");
    expect(raw).not.toContain("geminiApiKey");
  });
});
