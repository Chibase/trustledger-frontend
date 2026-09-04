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
import { TrustWorkspaceHub } from "@/components/trust/TrustWorkspaceHub";
import {
  summarizeTrustWorkspace,
  trustMeanToDisplay,
} from "@/lib/trust/workspaceProof";
import { composeTrustProofReport } from "@/lib/trust";
import { createTrustObservation } from "@/lib/trust";

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
  engagementService: { list: jest.fn(async () => mockEngagements) },
}));
jest.mock("@/services/commitmentService", () => ({
  commitmentService: { list: jest.fn(async () => mockCommitments) },
}));
jest.mock("@/services/stakeholderService", () => ({
  stakeholderService: { list: jest.fn(async () => mockStakeholders) },
}));

describe("trust workspace summary", () => {
  it("counts scored history, risks, and evidence-backed claims", () => {
    const report = composeTrustProofReport({
      observations: [
        createTrustObservation({
          id: "TRO-a",
          observedAt: "2026-01-01T00:00:00Z",
          dimension: "process",
          signal: "negative",
          source: "commitment",
          evidenceIds: ["EVD-1"],
        }),
        createTrustObservation({
          id: "TRO-b",
          observedAt: "2026-04-01T00:00:00Z",
          dimension: "process",
          signal: "positive",
          source: "commitment",
          evidenceIds: ["EVD-1"],
        }),
      ],
    });
    const summary = summarizeTrustWorkspace(report);
    expect(summary.scoredObservations).toBeGreaterThan(0);
    expect(summary.movement).not.toBe("insufficient");
    expect(summary.evidenceBackedClaims).toBeGreaterThan(0);
    expect(summary.period.earlierMean).not.toBeNull();
    expect(summary.period.laterMean).not.toBeNull();
    expect(summary.comparisons.community).toBeDefined();
    expect(summary.comparisons.project_phase.length).toBeGreaterThan(0);
    expect(
      summary.dimensions.some((row) => row.dimension === "process" && row.mean != null),
    ).toBe(true);
  });

  it("maps −1…+1 means onto a 0–100 chart scale without becoming Trust pulse", () => {
    expect(trustMeanToDisplay(-1)).toBe(0);
    expect(trustMeanToDisplay(0)).toBe(50);
    expect(trustMeanToDisplay(1)).toBe(100);
    expect(trustMeanToDisplay(null)).toBeNull();
  });
});

describe("TrustWorkspaceHub", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders number cards, trend, comparison axes, risk, narrative, and shortcuts", async () => {
    render(<TrustWorkspaceHub />);
    expect(screen.getByText("Trust proof workspace")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Full proof" })).toHaveAttribute(
      "href",
      "/app/reports",
    );
    expect(screen.getByRole("link", { name: "Cases" })).toHaveAttribute(
      "href",
      "/app/incidents",
    );
    expect(screen.getByRole("link", { name: "Engagements" })).toHaveAttribute(
      "href",
      "/app/engagements",
    );
    expect(screen.getByRole("link", { name: "Evidence" })).toHaveAttribute(
      "href",
      "/app/capture",
    );
    expect(screen.getByText("Trust movement")).toBeInTheDocument();
    expect(screen.getByText("Scored observations")).toBeInTheDocument();
    expect(screen.getByText("Risk flags")).toBeInTheDocument();
    expect(screen.getByText("Evidence-backed claims")).toBeInTheDocument();
    expect(screen.getByText("Trust trend")).toBeInTheDocument();
    expect(screen.getByText("Comparison")).toBeInTheDocument();
    expect(screen.getByText("Dimensions")).toBeInTheDocument();
    expect(screen.getByText("Proof narrative")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Community" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Location" })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: "Stakeholder group" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Phase proxy" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Composing trust proof…")).not.toBeInTheDocument();
    });
    expect(screen.getAllByText(/not Trust pulse/i).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole("tab", { name: "Phase proxy" }));
    expect(screen.getByRole("tab", { name: "Phase proxy" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
