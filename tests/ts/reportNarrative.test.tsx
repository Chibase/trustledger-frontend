/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { ReportNarrative } from "@/components/reports/ReportNarrative";

describe("ReportNarrative", () => {
  it("renders polished client-facing narrative blocks instead of raw markdown", () => {
    render(
      <ReportNarrative
        markdown={`## Activity log

Field and desk actions in August 2026 are summarised below from case timelines and Capture records:

- **Cases cited:** INC-1001; INC-1002
- **Prepared by:** Test Author (Delivery)`}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Activity log" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Actions completed in August 2026/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/supporting records/i)).toBeInTheDocument();
    expect(
      screen.getAllByText((_, element) =>
        element?.textContent?.includes("Cases cited: INC-1001; INC-1002") || false,
      )[0],
    ).toBeInTheDocument();
    expect(screen.queryByText("## Activity log")).not.toBeInTheDocument();
    expect(screen.queryByText(/\*\*Cases cited:\*\*/)).not.toBeInTheDocument();
  });
});
