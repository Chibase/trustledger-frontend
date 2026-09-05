import { PROCESS_STAGE_KEYS } from "@/lib/grievanceProcess";
import {
  INCIDENT_ADAPT_FIELDNAMES,
  INCIDENT_ADAPT_FIELDS,
} from "@/lib/frappeProductDocTypes";
import {
  collectOpenAdaptRecords,
  completeMelAdaptRecord,
  completingAdaptLeavesStages,
  parseMelAdaptRecords,
  reasonCannotCompleteAdapt,
  serializeMelAdaptRecords,
} from "@/lib/melLearnAdapt";
import {
  incidentListFields,
  incidentToFrappeDoc,
} from "@/lib/productCloud";
import {
  overlayLocalIncidentsOntoCloud,
  mergeIncidentCache,
} from "@/services/incidentService";
import type { Incident } from "@/types/incident";
import type { MelLearnAdaptRecord } from "@/types/melAdapt";

function sampleIncident(over: Partial<Incident> = {}): Incident {
  return {
    id: "INC-MEL-3",
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
    sentimentScore: null,
    timeline: [],
    processStages: {
      reportedAt: "2026-09-01T08:00:00.000Z",
      resourceDeployedAt: "2026-09-01T10:00:00.000Z",
    },
    ...over,
  };
}

const openRecord: MelLearnAdaptRecord = {
  id: "ADA-1",
  monitor: "Repeat dust complaints after watering stopped.",
  analyse: "Contractor skipped the watering roster.",
  action: "",
  rootCause: "contractor_performance",
  status: "open",
  createdAt: "2026-09-01T12:00:00.000Z",
  dueOn: "2026-09-10",
};

describe("MEL-3 Learn & Adapt records", () => {
  it("does not add a grievance process stage", () => {
    expect(PROCESS_STAGE_KEYS).toEqual([
      "reported",
      "resource_deployed",
      "investigated",
      "resolved",
      "verified",
      "closed",
    ]);
    expect(INCIDENT_ADAPT_FIELDNAMES).toEqual(["adapt_json"]);
    expect(INCIDENT_ADAPT_FIELDS[0]?.fieldtype).toBe("Long Text");
    expect(incidentListFields("adapt")).toContain("adapt_json");
    expect(incidentListFields("mel")).not.toContain("adapt_json");
  });

  it("requires Monitor and Adapt before the record can be marked done", () => {
    expect(reasonCannotCompleteAdapt(openRecord)).toMatch(/Adapt action/i);
    expect(
      reasonCannotCompleteAdapt({ ...openRecord, monitor: "  ", action: "Do X" }),
    ).toMatch(/Monitor observation/i);
    expect(completeMelAdaptRecord(openRecord).status).toBe("open");
    const done = completeMelAdaptRecord({
      ...openRecord,
      action: "Reinstate daily watering and check at 16:00.",
    });
    expect(done.status).toBe("done");
    expect(done.completedAt).toBeTruthy();
  });

  it("does not close or resolve the case when a record is completed", () => {
    const before = sampleIncident({
      learnAdaptRecords: [openRecord],
    });
    const after = sampleIncident({
      learnAdaptRecords: [
        completeMelAdaptRecord({
          ...openRecord,
          action: "Reinstate watering.",
        }),
      ],
    });
    expect(completingAdaptLeavesStages(before, after)).toBe(true);
    expect(after.processStages?.closedAt).toBeFalsy();
    expect(after.status).toBe("Investigating");
  });

  it("omits adapt_json on PUT unless the client sent records", () => {
    const omitted = incidentToFrappeDoc(sampleIncident(), "Acme");
    expect(omitted).not.toHaveProperty("adapt_json");
    const sent = incidentToFrappeDoc(
      sampleIncident({ learnAdaptRecords: [openRecord] }),
      "Acme",
    );
    expect(JSON.parse(String(sent.adapt_json))).toEqual(
      parseMelAdaptRecords(serializeMelAdaptRecords([openRecord])),
    );
    const cleared = incidentToFrappeDoc(
      sampleIncident({ learnAdaptRecords: [] }),
      "Acme",
    );
    expect(cleared.adapt_json).toBe("[]");
  });

  it("lets Cloud records win including an empty list, and does not append local-only cases", () => {
    const cloudEmpty = sampleIncident({ learnAdaptRecords: [] });
    const local = sampleIncident({
      learnAdaptRecords: [openRecord],
    });
    const merged = mergeIncidentCache(cloudEmpty, local);
    expect(merged.learnAdaptRecords).toEqual([]);

    const missing = mergeIncidentCache(
      sampleIncident(),
      sampleIncident({ learnAdaptRecords: [openRecord] }),
    );
    expect(missing.learnAdaptRecords?.[0]?.id).toBe("ADA-1");

    expect(
      overlayLocalIncidentsOntoCloud([], [
        sampleIncident({ id: "INC-LOCAL-ONLY", learnAdaptRecords: [openRecord] }),
      ]),
    ).toEqual([]);
  });

  it("watches open records only and flags overdue due dates", () => {
    const rows = collectOpenAdaptRecords(
      [
        sampleIncident({
          learnAdaptRecords: [
            openRecord,
            {
              ...openRecord,
              id: "ADA-2",
              status: "done",
              action: "Done watering.",
              completedAt: "2026-09-02T00:00:00.000Z",
            },
          ],
        }),
      ],
      "2026-09-11",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.overdue).toBe(true);
    expect(rows[0]?.recordId).toBe("ADA-1");
  });
});
