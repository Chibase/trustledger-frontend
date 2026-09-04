import { isPlatformOperatorIdentity } from "@/lib/platformOperator";

/** Copy for 403s — hide, do not upsell a commercial SKU. */
export const SEP_DESK_UNAVAILABLE =
  "Engagement plans are on the operator desk while being built.";

export type SepDeskIdentity = {
  email?: string | null;
  isVip?: boolean | null;
};

/**
 * SEP is not a commercial plan module until the composer matches the product
 * vision. Access is the Platform Operator allowlist and complimentary VIP —
 * the operator's own desk — not Project / Institutional / demo entitlements.
 */
export function canAccessSepDesk(identity: SepDeskIdentity): boolean {
  if (identity.isVip) return true;
  return isPlatformOperatorIdentity(identity.email);
}
