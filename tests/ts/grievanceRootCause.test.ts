import {
  INCIDENT_ROOT_CAUSE_FIELDNAMES,
  INCIDENT_ROOT_CAUSE_FIELDS,
} from "@/lib/frappeProductDocTypes";
import {
  advanceIncidentStage,
  reasonCannotStampStage,
  verifyAndCloseIncident,
} from "@/lib/grievanceProcess";
import {
  countRootCauses,
  hasValidRootCause,
  parseGrievanceRootCause,
  validateGrievanceRootCause,
} from "@/lib/grievanceRootCause";
import {
  frappeToIncident,
  incidentListFields,
  incidentToFrappeDoc,
} from "@/lib/productCloud";
import {
  mergeCloudAndLocal,
  overlayLocalIncidentsOntoCloud,
} from "@/services/incidentService";
import type { Incident } from "@/types/incident";

function sampleIncident(over: Partial<Incident> = {}): Incident {
  return {
    id: "INC-MEL-2",
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
    nature: "dust",
    impactScore: 40,
    sentimentScore: -12,
    sentimentLabel: "negative",
    timeline: [
      {
        id: "EVT-1",
        type: "CREATED",
        summary: "Logged",
        at: "2026-09-01T08:00:00.000Z",
      },
    ],
    processStages: {
      reportedAt: "2026-09-01T08:00:00.000Z",
      resourceDeployedAt: "2026-09-01T10:00:00.000Z",
      investigatedAt: null,
      resolvedAt: null,
      verifiedAt: null,
      closedAt: null,
    },
    ...over,
  };
}

describe("MEL-2 grievance root-cause tags", () => {
  it("defines Cloud Data + Small Text fields", () => {
    expect(INCIDENT_ROOT_CAUSE_FIELDNAMES).toEqual([
      "root_cause",
      "root_cause_note",
    ]);
    expect(INCIDENT_ROOT_CAUSE_FIELDS.map((row) => row.fieldtype)).toEqual([
      "Data",
      "Small Text",
    ]);
    expect(incidentListFields("mel")).toEqual(
      expect.arrayContaining(["root_cause", "root_cause_note", "investigated_at"]),
    );
    expect(incidentListFields("stages")).not.toContain("root_cause");
  });

  it("rejects blank and other-without-note; nature is not a cause", () => {
    expect(parseGrievanceRootCause("dust")).toBeUndefined();
    expect(validateGrievanceRootCause("").ok).toBe(false);
    expect(validateGrievanceRootCause("other", "  ").ok).toBe(false);
    expect(validateGrievanceRootCause("other", "List dispute on ward roster").ok).toBe(
      true,
    );
    expect(hasValidRootCause({ rootCause: "unmet_commitment" })).toBe(true);
    expect(
      validateGrievanceRootCause("information_gap", "leftover other note"),
    ).toEqual({
      ok: true,
      id: "information_gap",
      note: "",
    });
  });

  it("blocks Investigate and Resolve without a tag, and allows deploy", () => {
    const open = sampleIncident();
    expect(reasonCannotStampStage(open, "investigated")).toMatch(/root-cause/i);
    expect(reasonCannotStampStage(open, "resolved")).toMatch(/root-cause/i);
    expect(reasonCannotStampStage(open, "resource_deployed")).toBeNull();

    const blocked = advanceIncidentStage(open, { to: "investigated" });
    expect(blocked.processStages?.investigatedAt).toBeFalsy();

    const tagged = sampleIncident({ rootCause: "information_gap" });
    const stamped = advanceIncidentStage(tagged, { to: "investigated" });
    expect(stamped.processStages?.investigatedAt).toBeTruthy();
    expect(stamped.rootCause).toBe("information_gap");
  });

  it("does not auto-resolve verify-and-close when resolved still needs a tag", () => {
    const missing = sampleIncident({
      processStages: {
        reportedAt: "2026-09-01T08:00:00.000Z",
        resourceDeployedAt: "2026-09-01T10:00:00.000Z",
        investigatedAt: "2026-09-02T09:00:00.000Z",
      },
    });
    const skipped = verifyAndCloseIncident(missing);
    expect(skipped.processStages?.resolvedAt).toBeFalsy();
    expect(skipped.processStages?.closedAt).toBeFalsy();

    const historical = sampleIncident({
      status: "Closed",
      processStages: {
        reportedAt: "2026-09-01T08:00:00.000Z",
        resourceDeployedAt: "2026-09-01T10:00:00.000Z",
        investigatedAt: "2026-09-02T09:00:00.000Z",
        resolvedAt: "2026-09-03T09:00:00.000Z",
      },
    });
    const closed = verifyAndCloseIncident(historical);
    expect(closed.processStages?.verifiedAt).toBeTruthy();
    expect(closed.processStages?.closedAt).toBeTruthy();
  });

  it("omits root_cause on PUT unless the client sent a tag", () => {
    const omitted = incidentToFrappeDoc(sampleIncident(), "Acme");
    expect(omitted).not.toHaveProperty("root_cause");
    expect(omitted).not.toHaveProperty("root_cause_note");

    const sent = incidentToFrappeDoc(
      sampleIncident({
        rootCause: "other",
        rootCauseNote: "Host community protocol skipped",
      }),
      "Acme",
    );
    expect(sent.root_cause).toBe("other");
    expect(sent.root_cause_note).toBe("Host community protocol skipped");
    expect(sent).not.toHaveProperty("trustResponse");

    const back = frappeToIncident(sent);
    expect(back?.rootCause).toBe("other");
    expect(back?.rootCauseNote).toBe("Host community protocol skipped");
  });

  it("lets Cloud root cause win and does not append local-only rows", () => {
    const cloud = sampleIncident({
      rootCause: "contractor_performance",
    });
    const local = sampleIncident({
      rootCause: "information_gap",
      rootCauseNote: "stale",
    });
    const merged = mergeCloudAndLocal([cloud], [local]);
    expect(merged[0]?.rootCause).toBe("contractor_performance");
    expect(merged[0]?.rootCauseNote).toBeUndefined();

    const empty = overlayLocalIncidentsOntoCloud([], [
      sampleIncident({ id: "INC-LOCAL-ONLY", rootCause: "process_failure" }),
    ]);
    expect(empty).toEqual([]);
  });

  it("mixes tagged cases only and does not invent unknown buckets", () => {
    const mix = countRootCauses([
      sampleIncident({ rootCause: "unmet_commitment" }),
      sampleIncident({ id: "INC-2", rootCause: "unmet_commitment" }),
      sampleIncident({ id: "INC-3", rootCause: "consultation_gap" }),
      sampleIncident({ id: "INC-4" }),
    ]);
    expect(mix.map((row) => [row.id, row.count])).toEqual([
      ["unmet_commitment", 2],
      ["consultation_gap", 1],
    ]);
  });
});
