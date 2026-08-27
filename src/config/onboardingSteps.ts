/**
 * First-login / setup wizard steps (UG-1).
 * Filtered by plan capabilities so Solo skips SI modules.
 * Every actionable step has an href that lands on the place to do the work.
 */

import type { PlanId } from "@/config/plans";
import { hasCapabilityForPlan } from "@/lib/entitlements";
import type { CapabilityId } from "@/types/entitlements";

export type OnboardingStepId =
  | "welcome"
  | "project"
  | "sep"
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
  /** In-app destination where the task is done (omit only on welcome). */
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
    body: "TrustLedger is a Social Relations Management desk. Nothing here is sample theatre — you seed your own project data, then add records as fieldwork continues. Use Next, then follow each step’s link to the screen where you do the work.",
    tip: "Memorise the spine: Project → people → contact → promises → cases → evidence → reports.",
  },
  {
    id: "project",
    title: "Create or name your project",
    body: "Open Projects and add one active site or programme. Use the name your team already uses in meetings. The form opens ready for the project name.",
    href: "/app/projects?new=1",
    ctaLabel: "Go create project",
    capability: "projects",
    tip: "Solo allows one active project. You can refine details later on the project dashboard.",
  },
  {
    id: "stakeholders",
    title: "Register key stakeholders",
    body: "Add a short first list — community representative, contractor, client sponsor, liaison. Five named humans beat fifty empty rows. The stakeholder form opens for you.",
    href: "/app/stakeholders?new=1",
    ctaLabel: "Go add stakeholder",
    capability: "stakeholdersCrm",
  },
  {
    id: "engagements",
    title: "Log an engagement",
    body: "When you meet or receive minutes, capture the engagement from Capture (minutes template) so it links to the project and attendees. This is the memory of contact.",
    href: "/app/capture?source=minutes",
    ctaLabel: "Go capture engagement",
    capability: "engagements",
    tip: "After save, review the Engagements list to confirm the record landed.",
  },
  {
    id: "commitments",
    title: "Track commitments",
    body: "Open the Commitments board, then promote promises from an engagement with an owner and status so social licence stays visible between visits.",
    href: "/app/commitments",
    ctaLabel: "Go to commitments board",
    capability: "commitments",
    tip: "Need a source engagement first? Open Engagements from the board action, then return here.",
  },
  {
    id: "incident",
    title: "Practise the grievance desk",
    body: "Log one issue on your project with assisted intake. If AI Assist is on your plan, read the suggestion, edit it, Apply, then Save — AI never writes alone.",
    href: "/app/issues/report",
    ctaLabel: "Go log an issue",
    capability: "incidents",
    tip: "You can also open Incidents later to work the case desk.",
  },
  {
    id: "capture",
    title: "Capture evidence",
    body: "Open Capture with a minutes or attendance template so labeled fields map on first paste. Review every AI extract before Apply. Keep media lean — plans have storage caps.",
    href: "/app/capture?source=attendance",
    ctaLabel: "Go to Capture hub",
    capability: "captureHub",
    tip: "Use Insert template on the Capture bar if the skeleton is empty.",
  },
  {
    id: "reports",
    title: "Generate a report when ready",
    body: "Open the Executive dashboard, choose your project, then generate with kind, format, and level. View fills the screen; download and print use the same pack.",
    href: "/app/dashboard",
    ctaLabel: "Go to Executive dashboard",
    capability: "governanceReports",
    tip: "Empty reports mean empty desk work — seed more first. Plan pack formats also live under Reports.",
  },
  {
    id: "done",
    title: "You are set — add as you go",
    body: "Daily loop: meet → engagement, promise → commitment, complaint → incident + evidence, week/month → report. Reopen this guide anytime from Guide in the nav — every step still links to the task screen.",
    href: "/app/guide",
    ctaLabel: "Stay on Guide checklist",
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

/** True when URL asks the page to open its create / task form (Guide deep link). */
export function guideRequestsNewTask(
  search: string | { get(name: string): string | null } | null | undefined,
): boolean {
  if (!search) return false;
  const value =
    typeof search === "string"
      ? new URLSearchParams(
          search.startsWith("?") ? search.slice(1) : search,
        ).get("new")
      : search.get("new");
  return value === "1" || value === "true" || value === "yes";
}
