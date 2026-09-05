/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { DashboardOverviewToolbar } from "@/components/dashboard/DashboardOverviewToolbar";
import { ExecutivePortfolioDashboard } from "@/components/dashboard/ExecutivePortfolioDashboard";
import { HorizontalBarChart } from "@/components/ops/charts/BarChart";
import { ProjectWorkspaceDashboard } from "@/components/projects/ProjectWorkspaceDashboard";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";
import { hasCapability } from "@/lib/entitlements";

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

jest.mock("@/components/trust/TrustWorkspaceHub", () => ({
  TrustWorkspaceHub: () => <div>Trust hub mock</div>,
}));

jest.mock("@/components/dashboard/ModuleContributionBoard", () => ({
  ModuleContributionBoard: () => <div>Module fill mock</div>,
}));

jest.mock("@/components/sep/SepDashboardPanel", () => ({
  SepDashboardPanel: () => <div>SEP mock</div>,
}));

jest.mock("@/components/reports/ProjectReportStudio", () => ({
  ProjectReportStudio: () => <div>Studio mock</div>,
}));

jest.mock("@/services/stakeholderService", () => ({
  stakeholderService: { list: jest.fn(async () => []) },
}));

jest.mock("@/services/engagementService", () => ({
  engagementService: { list: jest.fn(async () => []) },
}));

jest.mock("@/lib/workspaceData", () => ({
  listWorkspaceIncidents: (seed: unknown[]) => seed,
  listWorkspaceProjects: (seed: unknown[]) => seed,
  preferCloudProjectList: (seed: unknown[]) => seed,
}));

jest.mock("@/lib/deskVisibility", () => ({
  readDeskTier: () => "clo",
}));

jest.mock("@/lib/entitlements", () => ({
  hasCapability: jest.fn((capability: string) => capability !== "engagements"),
}));

describe("graph-first dashboards", () => {
  beforeEach(() => {
    window.localStorage.clear();
    (hasCapability as jest.Mock).mockImplementation(
      (capability: string) => capability !== "engagements",
    );
  });

  it("shows executive overall KPIs and chart cards, not per-project metric tables", async () => {
    render(
      <ExecutivePortfolioDashboard
        role="admin"
        planId="institutional"
        seedIncidents={mockIncidents}
        seedProjects={mockProjects}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Workspace health")).toBeInTheDocument();
    });
    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Project status")).toBeInTheDocument();
    expect(screen.getByText("Case pipeline")).toBeInTheDocument();
    expect(screen.getByText("Open cases by priority")).toBeInTheDocument();
    expect(screen.getByText("Engagement plans")).toBeInTheDocument();
    expect(
      screen.queryByText("Project data by report category"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toHaveAttribute(
      "href",
      "/app/projects",
    );
  });

  it("shows project overall graphs first and keeps capture tables in details", () => {
    const project = mockProjects[0];
    const incidents = mockIncidents.filter((row) => row.projectId === project.id);
    render(
      <ProjectWorkspaceDashboard
        project={project}
        incidents={incidents}
        role="admin"
        authorName="Tester"
        planId="institutional"
        onProjectSaved={() => undefined}
      />,
    );

    expect(screen.getByText(project.name)).toBeInTheDocument();
    expect(screen.getByText("Budget mix")).toBeInTheDocument();
    expect(screen.getByText("Category fill")).toBeInTheDocument();
    expect(screen.getByText("Case pipeline")).toBeInTheDocument();
    expect(
      screen.getByText(/Category data, capture, and reports/),
    ).toBeInTheDocument();
    expect(screen.getByText("Cases on this project")).toBeInTheDocument();
  });

  it("does not call a completed workspace empty", async () => {
    const parked = { ...mockProjects[0], status: "Completed" as const };
    render(
      <ExecutivePortfolioDashboard
        role="admin"
        planId="institutional"
        seedIncidents={[]}
        seedProjects={[parked]}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText(/completed or closed/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/No projects yet/i)).not.toBeInTheDocument();
  });

  it("counts open projects on the headline KPI", async () => {
    render(
      <ExecutivePortfolioDashboard
        role="admin"
        planId="institutional"
        seedIncidents={[]}
        seedProjects={[
          { ...mockProjects[0]!, status: "Active" },
          {
            ...mockProjects[0]!,
            id: "PRJ-DONE",
            name: "Finished site",
            status: "Completed",
          },
        ]}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText("Open projects")).toBeInTheDocument();
    });
    const kpi = screen.getByText("Open projects").closest("div");
    expect(kpi).toHaveTextContent("1");
  });

  it("renders duplicate bar labels without colliding keys", () => {
    expect(() =>
      render(
        <HorizontalBarChart
          bars={[
            { label: "Same", value: 1 },
            { label: "Same", value: 2 },
          ]}
        />,
      ),
    ).not.toThrow();
    expect(screen.getAllByText("Same")).toHaveLength(2);
  });

  it("hides Capture on plans without captureHub", () => {
    (hasCapability as jest.Mock).mockImplementation(
      (capability: string) => capability !== "captureHub",
    );
    render(<DashboardOverviewToolbar planId="solo" />);
    expect(
      screen.queryByRole("link", { name: "Capture" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument();
  });
});
