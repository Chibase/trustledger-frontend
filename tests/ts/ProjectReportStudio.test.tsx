/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectReportStudio } from "@/components/reports/ProjectReportStudio";
import { mockCommitments } from "@/data/mockCommitments";
import { mockIncidents } from "@/data/mockIncidents";
import { mockProjects } from "@/data/mockProjects";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: import("react").ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

jest.mock("@/services/commitmentService", () => ({
  commitmentService: {
    list: jest.fn(async () => mockCommitments),
  },
}));

describe("ProjectReportStudio PDF export", () => {
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

  it("downloads the current report through the PDF export route", async () => {
    const user = userEvent.setup();
    jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(
      <ProjectReportStudio
        project={mockProjects[0]!}
        role="admin"
        authorName="Test Author"
        incidents={mockIncidents}
        categories={[]}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Download PDF" }));

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

    expect(payload.title).toMatch(/Monthly activity report/);
    expect(payload.projectName).toBe(mockProjects[0]!.name);
    expect(payload.format).toBe("charts_details");
    expect(payload.chartGroups.length).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
