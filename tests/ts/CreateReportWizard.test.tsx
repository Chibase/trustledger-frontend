/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateReportWizard } from "@/components/reports/CreateReportWizard";
import { mockCommitments } from "@/data/mockCommitments";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";
import { listSavedReports } from "@/lib/reportStore";

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

jest.mock("@/lib/reportWorkspaceLists", () => ({
  loadReportWorkspaceLists: jest.fn(async () => ({
    projects: mockProjects,
    incidents: mockIncidents,
    commitments: mockCommitments,
    evidence: [],
  })),
}));

jest.mock("@/services/aiService", () => ({
  aiService: {
    composeActivityReport: jest.fn(async () => ({
      title: "Monthly activity report — Hope Community Trust",
      executiveHighlight: "Evidence highlights for the period.",
      bodyMarkdown: `## Highlights\n\n- Active work on ${mockIncidents[0]?.id || "INC-2026-0001"}\n- Key community meetings held.`,
      model: "trustledger-evidence",
      promptVersion: "v1",
      confidence: 0.95,
    })),
  },
}));

describe("CreateReportWizard presentation and export", () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    window.localStorage.clear();
    URL.createObjectURL = jest.fn(() => "blob:report-pdf");
    URL.revokeObjectURL = jest.fn();
    global.fetch = jest.fn(async () => ({
      ok: true,
      blob: async () => new Blob(["pdf"], { type: "application/pdf" }),
    })) as jest.Mock;
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("generates a report and opens ReportPresentationView", async () => {
    const user = userEvent.setup();
    render(<CreateReportWizard role="admin" authorName="Test Author" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Project/i)).toBeInTheDocument();
      expect(
        screen.getByRole("option", {
          name: new RegExp(mockProjects[0]!.name, "i"),
        }),
      ).toBeInTheDocument();
    });

    // Select first project
    await user.selectOptions(
      screen.getByLabelText(/Project/i),
      mockProjects[0]!.id,
    );

    // AI write button should be present
    const writeBtn = screen.getByRole("button", { name: "AI write the report" });
    expect(writeBtn).toBeInTheDocument();

    await user.click(writeBtn);

    // Presentation view should open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    expect(
      screen.getAllByRole("heading", {
        name: /Monthly activity report — Hope Community Trust/i,
      }).length,
    ).toBeGreaterThan(0);

    // Presentation view contains Download PDF and Print
    const dialog = screen.getByRole("dialog");
    expect(
      withinDialog(dialog, "button", "Download PDF"),
    ).toBeInTheDocument();
    expect(
      withinDialog(dialog, "button", "Print"),
    ).toBeInTheDocument();
  });

  it("downloads the generated report PDF using /api/app/reports/pdf", async () => {
    const user = userEvent.setup();
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<CreateReportWizard role="admin" authorName="Test Author" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Project/i)).toBeInTheDocument();
      expect(
        screen.getByRole("option", {
          name: new RegExp(mockProjects[0]!.name, "i"),
        }),
      ).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText(/Project/i),
      mockProjects[0]!.id,
    );

    await user.click(screen.getByRole("button", { name: "AI write the report" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog");
    const downloadBtn = withinDialog(dialog, "button", "Download PDF");
    await user.click(downloadBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/app/reports/pdf",
        expect.objectContaining({
          method: "POST",
          credentials: "same-origin",
        }),
      );
    });

    const [, request] = (global.fetch as jest.Mock).mock.calls[0];
    const payload = JSON.parse(String(request.body));

    expect(payload.title).toMatch(/Monthly activity report/i);
    expect(payload.projectName).toBe(mockProjects[0]!.name);
    expect(payload.format).toBe("charts_details");
    expect(payload.chartGroups.length).toBeGreaterThan(0);
  });

  it("allows opening saved reports in ReportPresentationView and dispatches tl-reports-changed", async () => {
    const user = userEvent.setup();
    const listener = jest.fn();
    window.addEventListener("tl-reports-changed", listener);

    render(<CreateReportWizard role="admin" authorName="Test Author" />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Project/i)).toBeInTheDocument();
      expect(
        screen.getByRole("option", {
          name: new RegExp(mockProjects[0]!.name, "i"),
        }),
      ).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText(/Project/i),
      mockProjects[0]!.id,
    );

    await user.click(screen.getByRole("button", { name: "AI write the report" }));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Close presentation view
    await user.click(withinDialog(screen.getByRole("dialog"), "button", "Close"));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Click Save draft
    await user.click(screen.getByRole("button", { name: "Save draft" }));

    // Verify event dispatched
    expect(listener).toHaveBeenCalled();
    expect(listSavedReports().length).toBe(1);

    // Saved reports on this project should now list the draft
    await waitFor(() => {
      expect(screen.getByText(/Saved on this project/i)).toBeInTheDocument();
    });

    const viewSavedBtn = screen.getByRole("button", { name: "View" });
    await user.click(viewSavedBtn);

    // Presentation view should reopen for the saved report
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    window.removeEventListener("tl-reports-changed", listener);
  });
});

function withinDialog(container: HTMLElement, role: "button", name: string) {
  const elements = container.querySelectorAll(role);
  for (const el of Array.from(elements)) {
    if (el.textContent?.trim().toLowerCase().includes(name.toLowerCase())) {
      return el as HTMLButtonElement;
    }
  }
  throw new Error(`Could not find ${role} with name ${name} inside dialog`);
}
