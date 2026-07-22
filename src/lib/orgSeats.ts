/**
 * Seat limits by plan (ACCESS_MODEL) — demo enforcement.
 */

import type { PlanId } from "@/config/plans";
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
