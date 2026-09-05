/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProcessStageActions } from "@/components/incidents/ProcessStageActions";
import { incidentService } from "@/services/incidentService";
import type { Incident } from "@/types/incident";

jest.mock("@/services/incidentService", () => ({
  incidentService: {
    save: jest.fn(async (row: Incident) => row),
  },
}));

function sample(over: Partial<Incident> = {}): Incident {
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

describe("ProcessStageActions MEL-2 gate", () => {
  beforeEach(() => {
    (incidentService.save as jest.Mock).mockClear();
  });

  it("does not stamp Investigate until a root-cause tag is chosen", async function () {
    const user = userEvent.setup();
    const onToast = jest.fn();
    const onUpdated = jest.fn();
    render(
      <ProcessStageActions
        incident={sample()}
        onUpdated={onUpdated}
        onToast={onToast}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Advance → Investigated/i }));
    expect(onToast).toHaveBeenCalledWith(
      expect.stringMatching(/root-cause/i),
      "error",
    );
    expect(incidentService.save).not.toHaveBeenCalled();

    await user.selectOptions(
      screen.getByLabelText("Root cause"),
      "unmet_commitment",
    );
    await user.click(screen.getByRole("button", { name: /Advance → Investigated/i }));
    expect(incidentService.save).toHaveBeenCalled();
    const saved = (incidentService.save as jest.Mock).mock.calls[0][0] as Incident;
    expect(saved.rootCause).toBe("unmet_commitment");
    expect(saved.processStages?.investigatedAt).toBeTruthy();
  });
});
