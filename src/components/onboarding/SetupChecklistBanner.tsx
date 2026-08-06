"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlanId } from "@/config/plans";
import { onboardingStepsForPlan } from "@/config/onboardingSteps";
import {
  readOnboardingState,
  requestOnboardingWizard,
  type OnboardingState,
} from "@/lib/onboardingGuide";

type SetupChecklistBannerProps = {
  planId?: PlanId | null;
};

/**
 * Compact progress strip on Dashboard / Guide until setup is done.
 */
export function SetupChecklistBanner({ planId }: SetupChecklistBannerProps) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const steps = onboardingStepsForPlan(planId).filter(
    (s) => s.id !== "welcome" && s.id !== "done",
  );

  useEffect(() => {
    function sync() {
      setState(readOnboardingState());
    }
    const frame = requestAnimationFrame(sync);
    window.addEventListener("tl-onboarding-changed", sync);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("tl-onboarding-changed", sync);
    };
  }, []);

  if (!state || state.wizardCompleted) return null;

  const doneCount = steps.filter((s) =>
    state.completedSteps.includes(s.id),
  ).length;
  const total = steps.length || 1;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <section
      aria-label="Setup progress"
      className="rounded-lg border border-tl-trust/30 bg-tl-trust/5 px-4 py-3"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            First-time setup
          </p>
          <p className="mt-1 text-sm text-tl-ink">
            Seed your SRM desk in order — {doneCount} of {total} steps marked.
          </p>
          <div
            className="mt-2 h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-tl-line"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-tl-trust"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => requestOnboardingWizard()}
            className="rounded-md bg-tl-trust px-3 py-2 text-xs font-medium text-white hover:bg-tl-trust-ink"
          >
            Continue setup
          </button>
          <Link
            href="/app/guide"
            className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-xs font-medium text-tl-ink hover:bg-tl-paper"
          >
            Open Guide
          </Link>
        </div>
      </div>
    </section>
  );
}
