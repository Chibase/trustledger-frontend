/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";
import { mockEngagements, mockEvidence } from "@/data/mockEngagements";
import { mockCommitments } from "@/data/mockCommitments";
import { mockStakeholders } from "@/data/mock/stakeholders";
import { TrustWorkspaceHub } from "@/components/trust/TrustWorkspaceHub";
import { summarizeTrustWorkspace } from "@/lib/trust/workspaceProof";
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
  });
});

describe("TrustWorkspaceHub", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders number cards, comparison/risk slots, narrative, and shortcuts", async () => {
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
    expect(screen.getByText("Proof narrative")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText("Composing trust proof…")).not.toBeInTheDocument();
    });
    expect(screen.getByText(/not Trust pulse/i)).toBeInTheDocument();
  });
});
