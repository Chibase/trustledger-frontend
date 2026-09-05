import { commitmentToFrappeDoc } from "@/lib/siCloud";
import {
  collectMelShortfalls,
  parseMelIndicators,
  serializeMelIndicators,
  varianceForIndicator,
} from "@/lib/melIndicators";
import { projectToFrappeDoc } from "@/lib/productCloud";
import { overlayLocalCommitmentsOntoCloud } from "@/services/commitmentService";
import { overlayLocalProjectsOntoCloud } from "@/services/projectService";
import type { Commitment } from "@/types/commitment";
import type { MelIndicator } from "@/types/mel";
import type { Project } from "@/types/project";

const gapRow: MelIndicator = {
  id: "MEL-1",
  label: "People reached",
  unit: "people",
  expected: 1000,
  actual: 620,
};

function sampleProject(over: Partial<Project> = {}): Project {
  return {
    id: "PRJ-MEL-1",
    name: "Site A",
    clientFunder: "Funder",
    budgetTotal: 1,
    budgetSpent: 0,
    ward: "Ward 1",
    municipality: "Place",
    status: "Active",
    contractorName: "Co",
    startDate: "2026-01-01",
    targetEndDate: "2026-12-31",
    publicSummary: "Summary",
    ...over,
  };
}

function sampleCommitment(over: Partial<Commitment> = {}): Commitment {
  return {
    id: "COM-1",
    title: "Local hire",
    status: "open",
    ownerLabel: "CLO",
    dueOn: "2026-06-01",
    projectId: "PRJ-MEL-1",
    engagementId: null,
    stakeholderIds: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("MEL-1 expected vs actual", () => {
  it("flags a 620/1000 participation gap as a material shortfall, not a cause", () => {
    const gap = varianceForIndicator(gapRow, {
      projectId: "PRJ-MEL-1",
      projectName: "Site A",
    });
    expect(gap?.shortfall).toBe(true);
    expect(gap?.material).toBe(true);
    expect(gap?.ratio).toBeCloseTo(0.62);
    expect(gap?.delta).toBe(-380);
  });

  it("does not alert when actual meets expected", () => {
    expect(
      varianceForIndicator({ ...gapRow, actual: 1000 }),
    ).toBeNull();
  });

  it("serialises project MEL JSON and omits it on PUT when undefined", () => {
    const withRows = projectToFrappeDoc(
      sampleProject({ melIndicators: [gapRow] }),
      "Acme",
    );
    expect(JSON.parse(String(withRows.mel_json))).toEqual(
      parseMelIndicators(serializeMelIndicators([gapRow])),
    );
    const omitted = projectToFrappeDoc(sampleProject(), "Acme");
    expect(omitted).not.toHaveProperty("mel_json");
    expect(omitted).not.toHaveProperty("dossier");
  });

  it("writes commitment expected/actual only when set", () => {
    const bare = commitmentToFrappeDoc(sampleCommitment(), "Acme");
    expect(bare).not.toHaveProperty("expected_value");
    expect(bare).not.toHaveProperty("actual_value");
    const withMel = commitmentToFrappeDoc(
      sampleCommitment({ expected: 1000, actual: 620, melUnit: "people" }),
      "Acme",
    );
    expect(withMel.expected_value).toBe(1000);
    expect(withMel.actual_value).toBe(620);
    expect(withMel.mel_unit).toBe("people");
  });

  it("does not surface local-only MEL when Cloud is empty", () => {
    const local = sampleProject({
      id: "PRJ-LOCAL-ONLY",
      melIndicators: [gapRow],
    });
    expect(overlayLocalProjectsOntoCloud([], [local])).toEqual([]);
    expect(
      overlayLocalCommitmentsOntoCloud(
        [],
        [sampleCommitment({ expected: 1000, actual: 1 })],
      ),
    ).toEqual([]);
  });

  it("lets Cloud MEL win, including an explicit empty list", () => {
    const cloud = sampleProject({ melIndicators: [] });
    const local = sampleProject({ melIndicators: [gapRow] });
    const merged = overlayLocalProjectsOntoCloud([cloud], [local]);
    expect(merged[0]?.melIndicators).toEqual([]);
  });

  it("collects project and commitment shortfalls without double-counting a linked commitment", () => {
    const gaps = collectMelShortfalls({
      projects: [
        sampleProject({
          melIndicators: [{ ...gapRow, commitmentId: "COM-1" }],
        }),
      ],
      commitments: [
        sampleCommitment({ expected: 1000, actual: 620 }),
      ],
    });
    expect(gaps).toHaveLength(1);
    expect(gaps[0]?.commitmentId).toBe("COM-1");
  });
});
