"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import { requestOnboardingWizard } from "@/lib/onboardingGuide";
import { SetupWizard } from "@/components/onboarding/SetupWizard";

type LaunchCtx = {
  launch: () => void;
};

const SetupWizardLaunchContext = createContext<LaunchCtx | null>(null);

/** Same React tree as SetupWizard — Guide/Settings launch cannot miss the modal. */
export function useLaunchSetupWizard(): () => void {
  const ctx = useContext(SetupWizardLaunchContext);
  return useCallback(() => {
    requestOnboardingWizard();
    ctx?.launch();
    if (typeof window !== "undefined") {
      window.location.hash = "setup-wizard";
    }
  }, [ctx]);
}

type SetupWizardGateProps = {
  planId?: PlanId | null;
  skipAutoOpen?: boolean;
  vip?: boolean;
  mode?: TlMode | null;
  children: React.ReactNode;
};

export function SetupWizardGate({
  planId,
  skipAutoOpen = false,
  vip = false,
  mode = null,
  children,
}: SetupWizardGateProps) {
  const [requestedOpen, setRequestedOpen] = useState(false);
  const launch = useCallback(() => {
    requestOnboardingWizard();
    setRequestedOpen(true);
  }, []);

  return (
    <SetupWizardLaunchContext.Provider value={{ launch }}>
      <SetupWizard
        planId={planId}
        skipAutoOpen={skipAutoOpen}
        vip={vip}
        mode={mode}
        requestedOpen={requestedOpen}
        onRequestedClose={() => setRequestedOpen(false)}
      />
      {children}
    </SetupWizardLaunchContext.Provider>
  );
}
