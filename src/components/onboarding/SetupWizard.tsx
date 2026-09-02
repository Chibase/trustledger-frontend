"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { PlanId } from "@/config/plans";
import type { TlMode } from "@/lib/auth.constants";
import {
  onboardingStepsForPlan,
  type OnboardingStepId,
} from "@/config/onboardingSteps";
import {
  completeOnboardingWizard,
  dismissOnboardingWizard,
  markOnboardingStepComplete,
  readOnboardingState,
  restoreVipShowcaseSetupIfSeedDismissed,
  shouldAutoOpenWizard,
  type OnboardingState,
} from "@/lib/onboardingGuide";
import { mustChangePassword } from "@/lib/trialBillingClient";

type SetupWizardProps = {
  planId?: PlanId | null;
  /** When false, the wizard never opens (juniors use Guide on demand). */
  enabled?: boolean;
  /** VIP showcase: keep the preloaded desk visible; Guide/Settings still launch. */
  skipAutoOpen?: boolean;
  vip?: boolean;
  mode?: TlMode | null;
  email?: string | null;
  /** Direct open from SetupWizardGate (same React tree as Guide/Settings). */
  requestedOpen?: boolean;
  onRequestedClose?: () => void;
};

/**
 * First-login setup wizard — plan-aware spine (UG-1).
 * Each step title/CTA navigates to the screen where that task is done.
 */
export function SetupWizard({
  planId,
  enabled = true,
  skipAutoOpen = false,
  vip = false,
  mode = null,
  email = null,
  requestedOpen = false,
  onRequestedClose,
}: SetupWizardProps) {
  const [open, setOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<OnboardingState | null>(null);

  const steps = onboardingStepsForPlan(planId, { vip, mode, email });
  const step = steps[stepIndex] ?? steps[0];

  useEffect(() => {
    if (!enabled) return;

    function sync() {
      // VIP hides the temp-password prompt; leftover trial flags must not
      // swallow Guide / Settings launch.
      if (!skipAutoOpen && mustChangePassword()) {
        setOpen(false);
        return;
      }
      const next = readOnboardingState();
      setState(next);
      if (shouldAutoOpenWizard(next, { skipAutoOpen })) {
        setOpen(true);
      }
    }

    window.addEventListener("tl-onboarding-changed", sync);
    window.addEventListener("storage", sync);
    try {
      if (skipAutoOpen) restoreVipShowcaseSetupIfSeedDismissed();
    } catch {
      /* seed restore must not prevent Guide/Settings launch */
    }
    const frame = requestAnimationFrame(sync);
    function onHash() {
      if (window.location.hash === "#setup-wizard") {
        setState(readOnboardingState());
        setOpen(true);
      }
    }
    window.addEventListener("hashchange", onHash);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("tl-onboarding-changed", sync);
      window.removeEventListener("storage", sync);
      window.removeEventListener("hashchange", onHash);
    };
  }, [enabled, skipAutoOpen]);

  if (!enabled) return null;

  const host = (
    <span data-setup-wizard={open || requestedOpen ? "open" : "ready"} hidden />
  );

  const showDialog = open || requestedOpen;
  const resolvedState = state ?? (showDialog ? readOnboardingState() : null);
  if (!showDialog || !step || !resolvedState) return host;

  const total = steps.length;
  const progress = Math.round(((stepIndex + 1) / total) * 100);
  const isLast = stepIndex >= total - 1;
  const isFirst = stepIndex <= 0;

  function close(permanent: boolean) {
    dismissOnboardingWizard(permanent);
    setOpen(false);
    onRequestedClose?.();
    if (typeof window !== "undefined" && window.location.hash === "#setup-wizard") {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  /** Leave the wizard open path and go do the task in-app. */
  function goDoTask() {
    markOnboardingStepComplete(step.id);
    dismissOnboardingWizard(false);
    setOpen(false);
    onRequestedClose?.();
    setState(readOnboardingState());
  }

  function markAndNext() {
    markOnboardingStepComplete(step.id);
    if (isLast) {
      completeOnboardingWizard();
      setOpen(false);
      onRequestedClose?.();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, total - 1));
    setState(readOnboardingState());
  }

  function goTo(id: OnboardingStepId) {
    const i = steps.findIndex((s) => s.id === id);
    if (i >= 0) setStepIndex(i);
  }

  const dialog = (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-wizard-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-tl-line bg-tl-surface shadow-lg"
      >
        <div className="border-b border-tl-line px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Setup · step {stepIndex + 1} of {total}
          </p>
          <h2
            id="setup-wizard-title"
            className="mt-1 font-display text-xl font-semibold text-tl-ink"
          >
            {step.href ? (
              <Link
                href={step.href}
                onClick={goDoTask}
                className="text-tl-trust-ink underline decoration-tl-trust/40 underline-offset-4 hover:decoration-tl-trust"
              >
                {step.title}
              </Link>
            ) : (
              step.title
            )}
          </h2>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-tl-line"
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-tl-trust transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <p className="text-sm leading-relaxed text-tl-ink">{step.body}</p>
          {step.href ? (
            <p className="mt-2 text-sm text-tl-ink-muted">
              Click the step title or{" "}
              <Link
                href={step.href}
                onClick={goDoTask}
                className="font-medium text-tl-trust-ink underline underline-offset-2"
              >
                {step.ctaLabel || "open the task"}
              </Link>{" "}
              to go to the screen where you do this.
            </p>
          ) : null}
          {step.tip ? (
            <p className="mt-3 text-sm text-tl-ink-muted">
              <span className="font-medium text-tl-trust-ink">Tip · </span>
              {step.tip}
            </p>
          ) : null}

          <ol className="mt-5 space-y-1.5">
            {steps.map((s, i) => {
              const done = resolvedState.completedSteps.includes(s.id);
              const current = i === stepIndex;
              return (
                <li key={s.id}>
                  <div
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs ${
                      current
                        ? "bg-tl-trust/10 font-medium text-tl-trust-ink"
                        : "text-tl-ink-muted"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => goTo(s.id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left hover:text-tl-ink"
                    >
                      <span
                        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] ${
                          done
                            ? "bg-tl-trust text-white"
                            : current
                              ? "border border-tl-trust text-tl-trust"
                              : "border border-tl-line"
                        }`}
                        aria-hidden
                      >
                        {done ? "✓" : i + 1}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </button>
                    {s.href ? (
                      <Link
                        href={s.href}
                        onClick={() => {
                          markOnboardingStepComplete(s.id);
                          dismissOnboardingWizard(false);
                          setOpen(false);
                          onRequestedClose?.();
                        }}
                        className="shrink-0 font-medium text-tl-trust-ink underline underline-offset-2"
                      >
                        Go
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-tl-line px-5 py-3">
          {!isFirst ? (
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Back
            </button>
          ) : null}
          {step.href ? (
            <Link
              href={step.href}
              onClick={goDoTask}
              className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              {step.ctaLabel || "Go do this"}
            </Link>
          ) : null}
          <button
            type="button"
            onClick={markAndNext}
            className={
              step.href
                ? "rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
                : "rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            }
          >
            {isLast ? "Finish" : "Next"}
          </button>
          <button
            type="button"
            onClick={() => close(false)}
            className="ml-auto text-sm text-tl-ink-muted underline-offset-2 hover:underline"
          >
            Later
          </button>
          <button
            type="button"
            onClick={() => close(true)}
            className="text-sm text-tl-ink-muted underline-offset-2 hover:underline"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return (
      <>
        {host}
        {dialog}
      </>
    );
  }
  return (
    <>
      {host}
      {createPortal(dialog, document.body)}
    </>
  );
}
