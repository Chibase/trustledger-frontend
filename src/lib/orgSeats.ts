/**
 * Seat limits + inviteable desk exposure by plan (ACCESS_MODEL).
 */

import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import { DESK_TIERS, type DeskTier } from "@/types/deskTier";
import type { OrgRecord, SeatSummary } from "@/types/org";

export function additionalSeatCapForPlan(planId: PlanId): number | null {
  switch (planId) {
    case "practitioner":
      return 0;
    case "project":
      return null; // unlimited per project env (demo: no hard cap)
    case "institutional":
      return null;
  }
}

/**
 * Desk tiers the Plan Owner may assign to junior invitees.
 * Higher desks stay visible in UI but greyed until the plan unlocks them.
 * Practitioner: no juniors. Project: field/ops desks. Institutional: full ladder.
 */
export const PLAN_INVITEABLE_DESK_TIERS: Record<PlanId, readonly DeskTier[]> = {
  practitioner: [],
  project: ["clo", "site", "supervisor"],
  institutional: [
    "clo",
    "site",
    "supervisor",
    "delivery",
    "oversight",
    "funder",
  ],
};

export function inviteableDeskTiersForPlan(
  planId: PlanId,
): readonly DeskTier[] {
  return PLAN_INVITEABLE_DESK_TIERS[planId];
}

export function canInviteDeskTier(planId: PlanId, tier: DeskTier): boolean {
  return PLAN_INVITEABLE_DESK_TIERS[planId].includes(tier);
}

export function defaultInviteDeskTier(planId: PlanId): DeskTier {
  return PLAN_INVITEABLE_DESK_TIERS[planId][0] ?? "clo";
}

/** Lowest plan that unlocks this desk for junior invites. */
export function lowestPlanForInviteDesk(tier: DeskTier): PlanId {
  const order: PlanId[] = ["practitioner", "project", "institutional"];
  for (const id of order) {
    if (PLAN_INVITEABLE_DESK_TIERS[id].includes(tier)) return id;
  }
  return "institutional";
}

export function inviteDeskUpgradeLabel(tier: DeskTier): string {
  const plan = lowestPlanForInviteDesk(tier);
  return `Requires ${PLANS[plan].name}`;
}

export function inviteDeskUpgradeHref(tier: DeskTier): string {
  const plan = lowestPlanForInviteDesk(tier);
  return `/pay?plan=${plan}&utm_source=settings&utm_medium=desk_invite&utm_campaign=upgrade_${plan}`;
}

/** All desk tiers in catalogue order (for greyed select lists). */
export function allDeskTiersForInviteUi(): readonly DeskTier[] {
  return DESK_TIERS;
}

export function buildSeatSummary(org: OrgRecord): SeatSummary {
  const cap = additionalSeatCapForPlan(org.planId);
  const juniors = org.members.filter((m) => !m.isPlanOwner).length;
  const pending = org.invites.filter((i) => i.status === "pending").length;
  const used = juniors + pending;
  const remaining = cap === null ? null : Math.max(0, cap - used);
  return {
    planId: org.planId,
    ownerSeats: 1,
    additionalSeatCap: cap,
    membersUsed: juniors,
    invitesPending: pending,
    seatsRemaining: remaining,
    canInvite: remaining === null ? true : remaining > 0,
  };
}
