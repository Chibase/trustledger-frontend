/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupWizard } from "@/components/onboarding/SetupWizard";
import { requestOnboardingWizard } from "@/lib/onboardingGuide";

jest.mock("next/link", () => {
  return {
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
  };
});

describe("SetupWizard VIP showcase", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("does not auto-open, then opens from Guide/Settings launch", async () => {
    const user = userEvent.setup();
    render(
      <SetupWizard
        planId="solo"
        skipAutoOpen
        vip
        mode="trial"
      />,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await act(async () => {
      requestOnboardingWizard();
    });

    expect(
      await screen.findByRole("dialog", { name: /walk the institutional desk/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/setup · step 1/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /later/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("still opens when a leftover must-change-password flag is set", async () => {
    window.localStorage.setItem("tl-must-change-password", "1");
    render(
      <SetupWizard
        planId="institutional"
        skipAutoOpen
        vip
        mode="trial"
      />,
    );
    await act(async () => {
      requestOnboardingWizard();
    });
    expect(
      await screen.findByRole("dialog", { name: /walk the institutional desk/i }),
    ).toBeInTheDocument();
  });
});
