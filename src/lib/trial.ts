import { isPlanId, type PlanId } from "@/config/plans";
import { bootstrapPlanOwnerOrg } from "@/lib/orgSession";

export const TRIAL_DAYS = 14;
/** Keep workspace data after trial ends, then purge. */
export const RETENTION_DAYS = 90;

export type TrialStatus = "active" | "expired" | "purged";

export type TrialSnapshot = {
  startedAt: Date;
  endsAt: Date;
  retentionUntil: Date;
  status: TrialStatus;
  daysLeft: number;
  planId: PlanId;
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function computeTrialSnapshot(
  startedAt: Date,
  planId: PlanId = "practitioner",
  now = new Date(),
): TrialSnapshot {
  const endsAt = addDays(startedAt, TRIAL_DAYS);
  const retentionUntil = addDays(endsAt, RETENTION_DAYS);
  let status: TrialStatus = "active";
  if (now >= retentionUntil) status = "purged";
  else if (now >= endsAt) status = "expired";

  const msLeft = endsAt.getTime() - now.getTime();
  const daysLeft =
    status === "active" ? Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24))) : 0;

  return { startedAt, endsAt, retentionUntil, status, daysLeft, planId };
}

export function parseTrialStarted(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Browser cookie helper for starting a trial workspace (+ Plan Owner org). */
export function startTrialCookies(input: {
  email: string;
  name: string;
  planId: PlanId;
  startedAt?: Date;
  organization?: string;
}) {
  const maxAge = TRIAL_DAYS * 24 * 60 * 60;
  const started = (input.startedAt ?? new Date()).toISOString();
  const plan = isPlanId(input.planId) ? input.planId : "practitioner";
  bootstrapPlanOwnerOrg({
    email: input.email.trim().toLowerCase(),
    name: input.name.trim() || input.email.split("@")[0] || "Plan Owner",
    planId: plan,
    organization: input.organization,
    mode: "trial",
    startedAt: started,
    maxAge,
  });
}

export function clearTrialWorkspaceData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("tl-trial-incidents");
  window.localStorage.removeItem("tl-trial-evidence");
  window.localStorage.removeItem("tl-trial-projects");
}

export function isTrialModeCookieValue(mode: string | undefined | null): boolean {
  return mode === "trial";
}

/** Sync check for client components and shared services. */
export function readTrialModeFromDocument(): boolean {
  if (typeof document === "undefined") return false;
  return /(?:^|;\s*)tl-mode=trial(?:;|$)/.test(document.cookie);
}

export const TRIAL_SESSION_MAX_AGE = TRIAL_DAYS * 24 * 60 * 60;
