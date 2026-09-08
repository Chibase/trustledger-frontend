/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StakeholderIntelligenceWorkspace } from "@/components/intelligence/StakeholderIntelligenceWorkspace";
import { STAKEHOLDER_WORKSPACE_STORAGE_KEY } from "@/lib/intelligence/stakeholderWorkspaceStore";
import type { Engagement } from "@/types/engagement";
import type { Stakeholder } from "@/types/stakeholder";

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

jest.mock("@/components/ui/Toast", () => ({
  useToast: () => ({ pushToast: jest.fn() }),
}));

const isCustomerWorkspaceClient = jest.fn(() => true);

jest.mock("@/lib/workspaceMode", () => ({
  isCustomerWorkspaceClient: () => isCustomerWorkspaceClient(),
}));

function person(over: Partial<Stakeholder> = {}): Stakeholder {
  return {
    id: "STK-UI",
    name: "Ward Forum",
    kind: "community_group",
    status: "active",
    influence: "medium",
    interests: [],
    tags: [],
    source: "trial",
    ...over,
  };
}

function briefing(): Engagement {
  return {
    id: "ENG-UI",
    title: "Clinic access briefing",
    kind: "briefing",
    status: "held",
    ward: "Ward 12",
    projectId: null,
    heldOn: "2026-09-01",
    summary: "Discussed access.",
    attendeesLabel: "Forum",
    actionItems: [],
    stakeholderIds: ["STK-UI"],
    source: "trial",
    createdAt: "2026-09-01T10:00:00.000Z",
  };
}

describe("StakeholderIntelligenceWorkspace UI", () => {
  beforeEach(() => {
    window.localStorage.clear();
    isCustomerWorkspaceClient.mockReturnValue(true);
  });

  it("shows an integrated trail and does not invent customer signals or demo sample", () => {
    render(
      <StakeholderIntelligenceWorkspace
        stakeholder={person()}
        engagements={[briefing()]}
        commitments={[]}
        incidents={[]}
        evidence={[]}
      />,
    );
    expect(
      screen.getByRole("heading", { name: /intelligence & decision workspace/i }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: /operating context/i }),
    ).toBeTruthy();
    expect(screen.getByText(/clinic access briefing/i)).toBeTruthy();
    expect(
      screen.getByText(/no signal is on file/i),
    ).toBeTruthy();
    expect(
      screen.getByText(/a recommendation must be on file before a human decision/i),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /load a labelled sample chain/i }),
    ).toBeNull();
    expect(screen.queryByText(/INC-SEED/)).toBeNull();
    expect(
      screen.getByText(/showcase rows are not mixed into this trail/i),
    ).toBeTruthy();
  });

  it("records a human decision as a distinct record after a demo sample suggestion", async () => {
    isCustomerWorkspaceClient.mockReturnValue(false);
    const user = userEvent.setup();
    render(
      <StakeholderIntelligenceWorkspace
        stakeholder={person({ source: "seed" })}
        engagements={[]}
        commitments={[]}
        incidents={[]}
        evidence={[]}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /load a labelled sample chain/i }),
    );
    expect(screen.getAllByText(/suggestion only/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/sample chain \(demo\)/i)).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: /record human decision/i }),
    );
    await user.type(screen.getByLabelText(/decided by/i), "A. Operator");
    await user.type(screen.getByLabelText(/^note$/i), "Human-governed accept.");
    await user.click(
      screen.getByRole("button", { name: /save human decision/i }),
    );
    expect(screen.getByText(/by a. operator/i)).toBeTruthy();
    expect(screen.getAllByText(/suggestion only/i).length).toBeGreaterThan(0);
    const stored = window.localStorage.getItem(STAKEHOLDER_WORKSPACE_STORAGE_KEY);
    expect(stored).toContain("human_decision");
    expect(stored).toContain("suggestion_only");
  });
});
