/**
 * Who may edit the SEP execution overlay vs snapshot-only.
 * Practitioner / Plan Owner = full edit. Client / Board / CEO = read-only.
 */

import type { DeskTier } from "@/types/deskTier";
import { DESK_TIER_RANK } from "@/types/deskTier";

export function canEditSepExecution(input: {
  deskTier: DeskTier;
  isPlanOwner: boolean;
}): boolean {
  if (input.isPlanOwner) return true;
  return DESK_TIER_RANK[input.deskTier] >= DESK_TIER_RANK.delivery;
}
