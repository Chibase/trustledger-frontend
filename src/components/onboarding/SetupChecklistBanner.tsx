"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import { onboardingStepsForPlan } from "@/config/onboardingSteps";
import { demoSeedAllowed } from "@/lib/planPackaging";
import {
  markOnboardingStepComplete,
  readOnboardingState,
  requestOnboardingWizard,
  type OnboardingState,
} from "@/lib/onboardingGuide";

type SetupChecklistBannerProps = {
  planId?: PlanId | null;
  vip?: boolean;
  mode?: TlMode | null;
};

/**
 * Compact progress strip on Dashboard / Guide until setup is done.
 * Next incomplete step links straight to that task screen.
 */
export function SetupChecklistBanner({
  planId,
  vip = false,
  mode = null,
}: SetupChecklistBannerProps) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const vipShowcase = demoSeedAllowed({ vip, mode });
  const steps = onboardingStepsForPlan(planId, { vip, mode }).filter(
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
  const nextStep = steps.find((s) => !state.completedSteps.includes(s.id));

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
            {vipShowcase
              ? "Walk the preloaded Institutional modules in order —"
              : "Seed your SRM desk in order —"}{" "}
            {doneCount} of {total} steps marked.
          </p>
          {nextStep?.href ? (
            <p className="mt-1 text-sm">
              Next:{" "}
              <Link
                href={nextStep.href}
                onClick={() => markOnboardingStepComplete(nextStep.id)}
                className="font-medium text-tl-trust-ink underline underline-offset-2"
              >
                {nextStep.title}
              </Link>
            </p>
          ) : null}
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
          {nextStep?.href ? (
            <Link
              href={nextStep.href}
              onClick={() => markOnboardingStepComplete(nextStep.id)}
              className="rounded-md bg-tl-trust px-3 py-2 text-xs font-medium text-white hover:bg-tl-trust-ink"
            >
              {nextStep.ctaLabel || "Go do next step"}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => requestOnboardingWizard()}
              className="rounded-md bg-tl-trust px-3 py-2 text-xs font-medium text-white hover:bg-tl-trust-ink"
            >
              Continue setup
            </button>
          )}
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
