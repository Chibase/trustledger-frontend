import { onboardingStepsForPlan } from "@/config/onboardingSteps";
import {
  completeOnboardingWizard,
  readOnboardingState,
  requestOnboardingWizard,
  restoreVipShowcaseSetupIfSeedDismissed,
  shouldAutoOpenWizard,
} from "@/lib/onboardingGuide";

describe("VIP setup unlock", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("keeps Guide/Settings launch working when auto-open is skipped", () => {
    expect(shouldAutoOpenWizard(undefined, { skipAutoOpen: true })).toBe(false);
    requestOnboardingWizard();
    expect(shouldAutoOpenWizard(undefined, { skipAutoOpen: true })).toBe(true);
    expect(readOnboardingState().wizardCompleted).toBe(false);
  });

  it("restores seed-dismissed VIP setup once without forcing the modal", () => {
    completeOnboardingWizard();
    expect(readOnboardingState().wizardCompleted).toBe(true);

    const unlocked = restoreVipShowcaseSetupIfSeedDismissed();
    expect(unlocked.wizardCompleted).toBe(false);
    expect(unlocked.dismissed).toBe(false);
    expect(unlocked.forceOpen).toBe(false);
    expect(shouldAutoOpenWizard(unlocked, { skipAutoOpen: true })).toBe(false);

    completeOnboardingWizard();
    const again = restoreVipShowcaseSetupIfSeedDismissed();
    expect(again.wizardCompleted).toBe(true);
  });

  it("uses the Institutional spine for VIP even if a leftover cookie says Solo", () => {
    const guest = onboardingStepsForPlan("solo", {
      vip: true,
      mode: "trial",
      email: "guest@example.com",
    });
    expect(guest.map((s) => s.id)).toEqual(
      expect.arrayContaining([
        "welcome",
        "project",
        "sep",
        "stakeholders",
        "engagements",
        "commitments",
        "incident",
        "capture",
        "reports",
        "done",
      ]),
    );
    expect(guest[0]?.title).toBe("Your desk starts empty");
    expect(guest.find((s) => s.id === "project")?.href).toBe(
      "/app/projects?new=1",
    );

    const showcase = onboardingStepsForPlan("solo", {
      vip: true,
      mode: "trial",
      email: "thozi@chibaseconsulting.co.za",
    });
    expect(showcase[0]?.title).toBe("Walk the Institutional desk");
    expect(showcase.find((s) => s.id === "project")?.href).toBe(
      "/app/projects/PRJ-NCGR-B",
    );

    const liveVip = onboardingStepsForPlan("institutional", {
      vip: true,
      mode: "live",
      email: "thozi@chibaseconsulting.co.za",
    });
    expect(liveVip[0]?.title).toBe("Your desk starts empty");
    expect(liveVip.find((s) => s.id === "project")?.href).toBe(
      "/app/projects?new=1",
    );

    const solo = onboardingStepsForPlan("solo", { vip: false, mode: "trial" });
    expect(solo.map((s) => s.id)).not.toContain("sep");
    expect(solo.map((s) => s.id)).not.toContain("stakeholders");
    expect(solo[0]?.title).toBe("Your desk starts empty");
  });
});
