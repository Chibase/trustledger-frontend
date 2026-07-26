/**
 * VIP complimentary guest access (ADR-037).
 * VIP Plan Owners may invite freely; invitees are view + comment only.
 */

export const VIP_ACCESS_MODES = ["full", "vip_viewer"] as const;
export type VipAccessMode = (typeof VIP_ACCESS_MODES)[number];

export function isVipAccessMode(value: string | null | undefined): value is VipAccessMode {
  return value === "full" || value === "vip_viewer";
}

/** Customer / org names stamped by Ops VIP provision. */
export function isVipPilotCustomerName(name: string | null | undefined): boolean {
  if (!name) return false;
  return /^VIP Pilot\b/i.test(name.trim());
}

export type VipGuestProfile = {
  displayName: string;
  email: string;
  /** Role on the specific project (e.g. Community liaison, Client sponsor). */
  roleOnProject: string;
  /** Rank / seniority label (e.g. Director, Ward councillor). */
  rank: string;
  /** Organisation / entity. */
  entity: string;
  /** Optional face picture as data URL (soft size-capped). */
  faceDataUrl?: string;
};

export type VipGuestComment = {
  id: string;
  orgId: string;
  projectId?: string;
  projectName?: string;
  profile: VipGuestProfile;
  body: string;
  createdAt: string;
  /** Consent to surface on TrustLedger marketing / client comment wall later. */
  publishConsent: boolean;
};
