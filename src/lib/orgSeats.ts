/**
 * Seat limits + inviteable desk exposure by plan (ACCESS_MODEL).
 * Desk rank 1 (Client/Board/funder) → 5 (CLO); Owner invites only lower ranks.
 */

import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";
import {
  DESK_TIERS,
  DESK_TIER_RANK,
  PLAN_OWNER_DESK_TIER,
  desksBelow,
  type DeskTier,
} from "@/types/deskTier";
import type { OrgRecord, SeatSummary } from "@/types/org";

export function additionalSeatCapForPlan(planId: PlanId): number | null {
  switch (planId) {
    case "practitioner":
      return 0;
    case "project":
      return null;
    case "institutional":
      return null;
  }
}

/** Owner desk for this plan (highest control seat on the account). */
export function ownerDeskForPlan(planId: PlanId): DeskTier {
  return PLAN_OWNER_DESK_TIER[planId];
}

/**
 * Desks an Owner may assign to juniors: strictly below Owner rank.
 * Practitioner has no junior seats (empty). Higher desks stay in the UI greyed.
 */
export function inviteableDeskTiersForPlan(planId: PlanId): DeskTier[] {
  if (planId === "practitioner") return [];
  return desksBelow(ownerDeskForPlan(planId));
}

export function canInviteDeskTier(planId: PlanId, tier: DeskTier): boolean {
  return inviteableDeskTiersForPlan(planId).includes(tier);
}

export function defaultInviteDeskTier(planId: PlanId): DeskTier {
  const allowed = inviteableDeskTiersForPlan(planId);
  // Prefer the most junior allowed seat as default.
  return allowed[allowed.length - 1] ?? "clo";
}

/** Lowest commercial plan whose Owner sits above this desk (can invite it). */
export function lowestPlanForInviteDesk(tier: DeskTier): PlanId {
  const order: PlanId[] = ["practitioner", "project", "institutional"];
  for (const id of order) {
    if (canInviteDeskTier(id, tier)) return id;
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

export function allDeskTiersForInviteUi(): readonly DeskTier[] {
  return DESK_TIERS;
}

export function deskRank(tier: DeskTier): number {
  return DESK_TIER_RANK[tier];
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
