import {
  INCIDENT_PROCESS_STAGE_FIELDNAMES,
  INCIDENT_PROCESS_STAGE_FIELDS,
} from "@/lib/frappeProductDocTypes";
import {
  frappeToIncident,
  incidentToFrappeDoc,
  INCIDENT_STAGE_CLOUD_FIELDS,
  nonBlankCloudTime,
  processStagesFromCloud,
} from "@/lib/productCloud";
import type { Incident } from "@/types/incident";

function sampleIncident(over: Partial<Incident> = {}): Incident {
  return {
    id: "INC-CLOUD-1",
    title: "Dust at the gate",
    description: "Community reported dust.",
    ward: "Ward 12",
    geographicArea: "Gqeberha",
    status: "Investigating",
    priority: "P2-High",
    projectId: "PRJ-1",
    projectName: "Site A",
    reportedByRole: "community",
    reporterName: "A. Resident",
    reportedAt: "2026-09-01T08:00:00.000Z",
    slaDueBy: "2026-09-04T08:00:00.000Z",
    slaBreached: false,
    escalationLevel: "None",
    ownerName: "CLO",
    category: "Dust",
    impactScore: 40,
    sentimentScore: -12,
    sentimentLabel: "negative",
    timeline: [{ id: "EVT-1", type: "CREATED", summary: "Logged", at: "2026-09-01T08:00:00.000Z" }],
    processStages: {
      reportedAt: "2026-09-01T08:00:00.000Z",
      resourceDeployedAt: "2026-09-01T10:00:00.000Z",
      investigatedAt: null,
      resolvedAt: null,
      verifiedAt: null,
      closedAt: null,
    },
    trustResponse: { willingnessToParticipate: "high" },
    ...over,
  };
}

describe("24e-cloud incident stage mappers", () => {
  it("defines six lifecycle Datetime fields", () => {
    expect(INCIDENT_PROCESS_STAGE_FIELDNAMES).toEqual([
      "reported_at",
      "resource_deployed_at",
      "investigated_at",
      "resolved_at",
      "verified_at",
      "closed_at",
    ]);
    expect(INCIDENT_PROCESS_STAGE_FIELDS.every((row) => row.fieldtype === "Datetime")).toBe(
      true,
    );
    expect(Object.values(INCIDENT_STAGE_CLOUD_FIELDS)).toEqual([
      ...INCIDENT_PROCESS_STAGE_FIELDNAMES,
    ]);
  });

  it("writes stamps and omits overlay plus sentiment", () => {
    const doc = incidentToFrappeDoc(sampleIncident(), "Acme Customer", "org-1");
    expect(doc.customer).toBe("Acme Customer");
    expect(doc.incident_code).toBe("INC-CLOUD-1");
    expect(doc.reported_at).toBe("2026-09-01 08:00:00");
    expect(doc.resource_deployed_at).toBe("2026-09-01 10:00:00");
    expect(doc.investigated_at).toBeNull();
    expect(doc.verified_at).toBeNull();
    expect(doc.closed_at).toBeNull();
    expect(doc).not.toHaveProperty("trustResponse");
    expect(doc).not.toHaveProperty("sentimentScore");
    expect(doc).not.toHaveProperty("sentiment_label");
    expect(doc).not.toHaveProperty("timeline");
  });

  it("does not invent timestamps when Cloud stage fields are blank", () => {
    const stages = processStagesFromCloud({
      reported_at: "",
      resource_deployed_at: null,
      investigated_at: " ",
      resolved_at: undefined,
      verified_at: "",
      closed_at: null,
    });
    expect(stages).toBeUndefined();
    expect(nonBlankCloudTime("")).toBeUndefined();
    expect(nonBlankCloudTime(null)).toBeUndefined();

    const back = frappeToIncident({
      incident_code: "INC-CLOUD-2",
      title: "Open case",
      customer: "Acme Customer",
      status: "Open",
      verified_at: "",
      closed_at: null,
    });
    expect(back?.id).toBe("INC-CLOUD-2");
    expect(back?.processStages).toBeUndefined();
    expect(back?.reportedAt).toBe("");
    expect(back?.trustResponse).toBeUndefined();
  });

  it("round-trips verified and closed stamps without filling missing ones", () => {
    const doc = incidentToFrappeDoc(
      sampleIncident({
        status: "Closed",
        processStages: {
          reportedAt: "2026-09-01T08:00:00.000Z",
          resourceDeployedAt: "2026-09-01T10:00:00.000Z",
          investigatedAt: "2026-09-02T09:00:00.000Z",
          resolvedAt: "2026-09-03T09:00:00.000Z",
          verifiedAt: "2026-09-03T15:00:00.000Z",
          closedAt: "2026-09-03T15:00:00.000Z",
        },
      }),
      "Acme Customer",
    );
    const back = frappeToIncident(doc);
    expect(back?.processStages?.verifiedAt).toBe("2026-09-03T15:00:00.000Z");
    expect(back?.processStages?.closedAt).toBe("2026-09-03T15:00:00.000Z");
    expect(back?.status).toBe("Closed");
    expect(back?.sentimentScore).toBeNull();
  });

  it("omits later-stage keys on PUT when processStages is missing so stamps are not wiped", () => {
    const doc = incidentToFrappeDoc(
      sampleIncident({ processStages: undefined }),
      "Acme Customer",
    );
    expect(doc.reported_at).toBe("2026-09-01 08:00:00");
    expect(doc).not.toHaveProperty("verified_at");
    expect(doc).not.toHaveProperty("closed_at");
    expect(doc).not.toHaveProperty("resource_deployed_at");
  });
});
