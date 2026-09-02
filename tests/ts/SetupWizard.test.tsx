/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SetupWizard } from "@/components/onboarding/SetupWizard";
import {
  SetupWizardGate,
  useLaunchSetupWizard,
} from "@/components/onboarding/SetupWizardGate";

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

function LaunchButton() {
  const launch = useLaunchSetupWizard();
  return (
    <button type="button" onClick={() => launch()}>
      Launch setup wizard
    </button>
  );
}

describe("SetupWizard VIP showcase", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("does not auto-open, then opens from Guide/Settings launch", async () => {
    const user = userEvent.setup();
    render(
      <SetupWizardGate planId="solo" skipAutoOpen vip mode="trial">
        <LaunchButton />
      </SetupWizardGate>,
    );

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: /launch setup wizard/i }),
    );

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
        requestedOpen
      />,
    );
    expect(
      await screen.findByRole("dialog", { name: /walk the institutional desk/i }),
    ).toBeInTheDocument();
  });
});
