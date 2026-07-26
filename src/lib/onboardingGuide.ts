/**
 * UG-1 — first-login setup wizard + checklist persistence (browser).
 */

import type { OnboardingStepId } from "@/config/onboardingSteps";

const STORAGE_KEY = "tl-onboarding-v1";
const SNOOZE_KEY = "tl-onboarding-snooze";

export type OnboardingState = {
  /** User chose “Don’t show again” or finished wizard. */
  dismissed: boolean;
  /** Wizard reached the done step at least once. */
  wizardCompleted: boolean;
  /** Step ids the user marked complete (checklist). */
  completedSteps: OnboardingStepId[];
  /** Settings / Guide asked to reopen the modal. */
  forceOpen: boolean;
  /** Schema version for future migrations. */
  v: 1;
};

const DEFAULT_STATE: OnboardingState = {
  dismissed: false,
  wizardCompleted: false,
  completedSteps: [],
  forceOpen: false,
  v: 1,
};

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function readOnboardingState(): OnboardingState {
  if (!canUseStorage()) return { ...DEFAULT_STATE };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      completedSteps: Array.isArray(parsed.completedSteps)
        ? (parsed.completedSteps as OnboardingStepId[])
        : [],
      v: 1,
    };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function writeOnboardingState(next: OnboardingState) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("tl-onboarding-changed"));
}

export function patchOnboardingState(
  patch: Partial<OnboardingState>,
): OnboardingState {
  const next = { ...readOnboardingState(), ...patch, v: 1 as const };
  writeOnboardingState(next);
  return next;
}

export function markOnboardingStepComplete(id: OnboardingStepId): OnboardingState {
  const cur = readOnboardingState();
  if (cur.completedSteps.includes(id)) return cur;
  return patchOnboardingState({
    completedSteps: [...cur.completedSteps, id],
  });
}

export function requestOnboardingWizard(): OnboardingState {
  if (canUseStorage()) {
    window.sessionStorage.removeItem(SNOOZE_KEY);
  }
  return patchOnboardingState({
    forceOpen: true,
    dismissed: false,
  });
}

export function snoozeOnboardingWizard(): OnboardingState {
  if (canUseStorage()) {
    window.sessionStorage.setItem(SNOOZE_KEY, "1");
  }
  return patchOnboardingState({ forceOpen: false });
}

export function dismissOnboardingWizard(permanent: boolean): OnboardingState {
  if (!permanent) return snoozeOnboardingWizard();
  if (canUseStorage()) {
    window.sessionStorage.removeItem(SNOOZE_KEY);
  }
  return patchOnboardingState({
    forceOpen: false,
    dismissed: true,
  });
}

export function completeOnboardingWizard(): OnboardingState {
  if (canUseStorage()) {
    window.sessionStorage.removeItem(SNOOZE_KEY);
  }
  return patchOnboardingState({
    forceOpen: false,
    dismissed: true,
    wizardCompleted: true,
  });
}

function isSnoozed(): boolean {
  if (!canUseStorage()) return false;
  return window.sessionStorage.getItem(SNOOZE_KEY) === "1";
}

/** Auto-open once for new workspaces until dismissed / completed / snoozed. */
export function shouldAutoOpenWizard(state?: OnboardingState): boolean {
  const s = state ?? readOnboardingState();
  if (s.forceOpen) return true;
  if (s.dismissed || s.wizardCompleted) return false;
  if (isSnoozed()) return false;
  return true;
}

export function clearOnboardingStep(id: OnboardingStepId): OnboardingState {
  const cur = readOnboardingState();
  return patchOnboardingState({
    completedSteps: cur.completedSteps.filter((s) => s !== id),
  });
}
