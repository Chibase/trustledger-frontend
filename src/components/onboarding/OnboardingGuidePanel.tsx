"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import {
  onboardingStepsForPlan,
  type OnboardingStepId,
} from "@/config/onboardingSteps";
import { demoSeedAllowed, packagingPlanId } from "@/lib/planPackaging";
import { useLaunchSetupWizard } from "@/components/onboarding/SetupWizardGate";
import {
  clearOnboardingStep,
  markOnboardingStepComplete,
  readOnboardingState,
  type OnboardingState,
} from "@/lib/onboardingGuide";

type OnboardingGuidePanelProps = {
  planId?: PlanId | null;
  vip?: boolean;
  mode?: TlMode | null;
};

/**
 * /app/guide — checklist that takes you to each task screen.
 */
export function OnboardingGuidePanel({
  planId,
  vip = false,
  mode = null,
}: OnboardingGuidePanelProps) {
  const launchSetup = useLaunchSetupWizard();
  const [state, setState] = useState<OnboardingState | null>(null);
  const steps = onboardingStepsForPlan(planId, { vip, mode });
  const resolved = packagingPlanId({ planId, vip, mode });
  const vipShowcase = demoSeedAllowed({ vip, mode });
  const planName = vipShowcase
    ? "VIP · Institutional"
    : PLANS[resolved].name;

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

  function toggle(id: OnboardingStepId) {
    const cur = readOnboardingState();
    if (cur.completedSteps.includes(id)) {
      setState(clearOnboardingStep(id));
      return;
    }
    setState(markOnboardingStepComplete(id));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-tl-ink">
            User guide
          </h1>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Setup checklist for {planName}. Each step title is a link to the
            screen where you do that work — not only an explanation.
            {vipShowcase
              ? " NCGR-B is preloaded; this guide walks the same module spine."
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={() => launchSetup()}
          className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Launch setup wizard
        </button>
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          Seeding spine
        </h2>
        <p className="text-sm text-tl-ink-muted">
          Project → Stakeholders → Engagements → Commitments → Incidents →
          Capture → Reports. Click a step to go do it. Do not start with
          reports.
        </p>
        <ul className="mt-3 space-y-2">
          {steps.map((step, i) => {
            const done = state?.completedSteps.includes(step.id) ?? false;
            return (
              <li
                key={step.id}
                className="flex flex-wrap items-start gap-3 border-b border-tl-line py-3 last:border-0"
              >
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  aria-pressed={done}
                  className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border text-xs ${
                    done
                      ? "border-tl-trust bg-tl-trust text-white"
                      : "border-tl-line bg-tl-surface text-tl-ink-muted"
                  }`}
                  title={done ? "Mark incomplete" : "Mark complete"}
                >
                  {done ? "✓" : i + 1}
                </button>
                <div className="min-w-0 flex-1">
                  {step.href ? (
                    <Link
                      href={step.href}
                      onClick={() => markOnboardingStepComplete(step.id)}
                      className="font-medium text-tl-trust-ink underline decoration-tl-trust/40 underline-offset-4 hover:decoration-tl-trust"
                    >
                      {step.title}
                    </Link>
                  ) : (
                    <p className="font-medium text-tl-ink">{step.title}</p>
                  )}
                  <p className="mt-1 text-sm text-tl-ink-muted">{step.body}</p>
                  {step.tip ? (
                    <p className="mt-1 text-xs text-tl-ink-muted">{step.tip}</p>
                  ) : null}
                  {step.href ? (
                    <Link
                      href={step.href}
                      onClick={() => markOnboardingStepComplete(step.id)}
                      className="mt-2 inline-flex rounded-md border border-tl-trust/30 bg-tl-paper px-2.5 py-1 text-sm font-medium text-tl-trust-ink hover:border-tl-trust/60"
                    >
                      {step.ctaLabel || "Go do this"}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-2 border-t border-tl-line pt-6">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          Daily loop
        </h2>
        <p className="text-sm text-tl-ink-muted">
          Meet → Engagement · Promise → Commitment · Complaint → Incident +
          evidence · Week/month → Report. AI is always suggest → apply → save.
        </p>
        <p className="text-sm text-tl-ink-muted">
          Need the long form? Public product overview is on{" "}
          <Link
            href="/product"
            className="font-medium text-tl-trust-ink underline underline-offset-2"
          >
            Product &amp; onboarding
          </Link>
          . Your Plan Owner can also share the TrustLedger user manual from the
          ops pack.
        </p>
      </section>
    </div>
  );
}
