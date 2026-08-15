/**
 * First-login / setup wizard steps (UG-1).
 * Filtered by plan capabilities so Solo skips SI modules.
 */

import type { PlanId } from "@/config/plans";
import { hasCapabilityForPlan } from "@/lib/entitlements";
import type { CapabilityId } from "@/types/entitlements";

export type OnboardingStepId =
  | "welcome"
  | "project"
  | "stakeholders"
  | "engagements"
  | "commitments"
  | "incident"
  | "capture"
  | "reports"
  | "done";

export type OnboardingStepDef = {
  id: OnboardingStepId;
  title: string;
  body: string;
  /** Primary in-app destination (omit on welcome/done). */
  href?: string;
  ctaLabel?: string;
  /** If set, step only appears when the plan includes this capability. */
  capability?: CapabilityId;
  /** Tip shown under the body. */
  tip?: string;
};

const STEPS: OnboardingStepDef[] = [
  {
    id: "welcome",
    title: "Your desk starts empty",
    body: "TrustLedger is a Social Relations Management desk. Nothing here is sample theatre — you seed your own project data, then add records as fieldwork continues.",
    tip: "Memorise the spine: Project → people → contact → promises → cases → evidence → reports.",
  },
  {
    id: "project",
    title: "Create or name your project",
    body: "Open Projects and set one active site or programme container. Use the name your team already uses in meetings.",
    href: "/app/projects",
    ctaLabel: "Open Projects",
    capability: "projects",
    tip: "Solo allows one active project. You can refine details later.",
  },
  {
    id: "stakeholders",
    title: "Register key stakeholders",
    body: "Add a short first list — community representative, contractor, client sponsor, liaison. Five named humans beat fifty empty rows.",
    href: "/app/stakeholders",
    ctaLabel: "Open Stakeholders",
    capability: "stakeholdersCrm",
  },
  {
    id: "engagements",
    title: "Log an engagement",
    body: "When you meet or receive minutes, log an Engagement linked to the project and attendees. This is the memory of contact.",
    href: "/app/engagements",
    ctaLabel: "Open Engagements",
    capability: "engagements",
  },
  {
    id: "commitments",
    title: "Track commitments",
    body: "Promote promises to the Commitments board with an owner and status so social licence stays visible between visits.",
    href: "/app/commitments",
    ctaLabel: "Open Commitments",
    capability: "commitments",
  },
  {
    id: "incident",
    title: "Practise the grievance desk",
    body: "Create one incident on your project. If AI Assist is on your plan, read the suggestion, edit it, Apply, then Save — AI never writes alone.",
    href: "/app/incidents",
    ctaLabel: "Open Incidents",
    capability: "incidents",
    tip: "Field staff can also use Report issue for guided intake.",
  },
  {
    id: "capture",
    title: "Capture evidence",
    body: "Use Capture with a minutes or attendance template so labeled fields map on first paste. Review every AI extract before Apply. Keep media lean — plans have storage caps.",
    href: "/app/capture",
    ctaLabel: "Open Capture",
    capability: "captureHub",
    tip: "Insert a blank minutes or attendance form so labeled fields map the first time.",
  },
  {
    id: "reports",
    title: "Generate a report when ready",
    body: "Open Reports after the desk has activity. Start with the Monthly operational pack. Higher plans unlock Executive and Board packs.",
    href: "/app/reports",
    ctaLabel: "Open Reports",
    capability: "governanceReports",
    tip: "Empty reports mean empty desk work — seed more first.",
  },
  {
    id: "done",
    title: "You are set — add as you go",
    body: "Daily loop: meet → engagement, promise → commitment, complaint → incident + evidence, week/month → report. Reopen this guide anytime from Guide in the nav.",
    href: "/app/guide",
    ctaLabel: "Open full Guide",
    tip: "Put TrustLedger on the agenda of your next site meeting.",
  },
];

/** Steps visible for this commercial plan (or Project lens when plan unknown). */
export function onboardingStepsForPlan(
  planId?: PlanId | null,
): OnboardingStepDef[] {
  return STEPS.filter((step) => {
    if (!step.capability) return true;
    return hasCapabilityForPlan(step.capability, planId);
  });
}

export function onboardingStepIndex(
  steps: OnboardingStepDef[],
  id: OnboardingStepId,
): number {
  const i = steps.findIndex((s) => s.id === id);
  return i < 0 ? 0 : i;
}
