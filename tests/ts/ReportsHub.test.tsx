/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";
import { mockEngagements, mockEvidence } from "@/data/mockEngagements";
import { mockCommitments } from "@/data/mockCommitments";
import { mockStakeholders } from "@/data/mock/stakeholders";
import { ReportsHub } from "@/components/reports/ReportsHub";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/lib/workspaceData", () => ({
  listWorkspaceIncidents: () => mockIncidents,
  listWorkspaceProjects: () => mockProjects,
  listWorkspaceEvidence: () => mockEvidence,
}));

jest.mock("@/services/engagementService", () => ({
  engagementService: {
    list: jest.fn(async () => mockEngagements),
  },
}));

jest.mock("@/services/commitmentService", () => ({
  commitmentService: {
    list: jest.fn(async () => mockCommitments),
  },
}));

jest.mock("@/services/stakeholderService", () => ({
  stakeholderService: {
    list: jest.fn(async () => mockStakeholders),
  },
}));

describe("ReportsHub TE-3 optional trust proof", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", "/app/reports");
  });

  it("keeps monthly Trust pulse and does not require the proof panel", async () => {
    const pulse = trustIndexFromIncidents(mockIncidents);
    render(
      <ReportsHub role="admin" authorName="Test Author" planId="project" />,
    );

    await waitFor(() => {
      expect(screen.getByText("Monthly operational report")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(
        screen.getByText(`Trust · ${pulse.label}`),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(String(pulse.trustIndex))).toBeInTheDocument();
    expect(screen.getByText("Open cases")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Write with evidence AI" })).toBeInTheDocument();
    expect(screen.queryByText("Evidence writer for this pack")).not.toBeInTheDocument();

    const proof = screen.getByText("Trust proof (optional)");
    expect(proof).toBeInTheDocument();
    expect(screen.queryByText("Copy markdown")).not.toBeInTheDocument();
    expect(screen.queryByText(/Composing proof/)).not.toBeInTheDocument();
  });

  it("still opens the monthly pack on the CLO desk", async () => {
    const pulse = trustIndexFromIncidents(mockIncidents);
    render(
      <ReportsHub role="community" authorName="Community" planId="project" />,
    );
    await waitFor(() => {
      expect(screen.getByText("Open cases")).toBeInTheDocument();
    });
    expect(screen.getByText(`Trust · ${pulse.label}`)).toBeInTheDocument();
    expect(screen.getByText("Trust proof (optional)")).toBeInTheDocument();
  });

  it("composes proof on demand without replacing pack content", async () => {
    const user = userEvent.setup();
    const pulse = trustIndexFromIncidents(mockIncidents);
    render(
      <ReportsHub role="admin" authorName="Test Author" planId="project" />,
    );

    await waitFor(() => {
      expect(screen.getByText(`Trust · ${pulse.label}`)).toBeInTheDocument();
    });

    await user.click(screen.getByText("Trust proof (optional)"));
    await waitFor(() => {
      expect(screen.getByText("Copy markdown")).toBeInTheDocument();
    });
    expect(screen.getByText("Download .md")).toBeInTheDocument();
    expect(screen.getByText(/does not replace monthly/i)).toBeInTheDocument();
    expect(screen.getByText(/Incident Trust pulse used: no/)).toBeInTheDocument();
    expect(screen.getByText(/No recommendation engine/)).toBeInTheDocument();
    expect(screen.getByText(`Trust · ${pulse.label}`)).toBeInTheDocument();
  });
});
