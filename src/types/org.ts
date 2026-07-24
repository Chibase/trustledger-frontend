/**
 * Demo org tenancy — Plan Owner master + junior invites (ADR-012).
 * Browser-local until Frappe Customer/User SoT (packet T5 / lockdown lift).
 */

import type { PlanId } from "@/config/plans";
import type { DeskTier } from "@/types/deskTier";
import type { UserRole } from "@/types/rbac";

/** Roles an Owner may invite (never admin). */
export const INVITEABLE_ROLES = ["client", "contractor", "community"] as const;
export type InviteableRole = (typeof INVITEABLE_ROLES)[number];

export type OrgInviteStatus = "pending" | "accepted" | "revoked";

export type OrgInvite = {
  id: string;
  token: string;
  email: string;
  name: string;
  role: InviteableRole;
  deskTier: DeskTier;
  projectId?: string;
  projectName?: string;
  status: OrgInviteStatus;
  createdAt: string;
  acceptedAt?: string;
};

export type OrgMember = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  deskTier: DeskTier;
  isPlanOwner: boolean;
  /** When true, member cannot raise desk tier in Settings. */
  deskTierLocked: boolean;
  projectId?: string;
  joinedAt: string;
};

export type OrgRecord = {
  id: string;
  name: string;
  planId: PlanId;
  createdAt: string;
  ownerEmail: string;
  ownerName: string;
  members: OrgMember[];
  invites: OrgInvite[];
};

export type SeatSummary = {
  planId: PlanId;
  ownerSeats: number;
  /** Max additional junior seats; null = unlimited (demo Project/Institutional). */
  additionalSeatCap: number | null;
  membersUsed: number;
  invitesPending: number;
  seatsRemaining: number | null;
  canInvite: boolean;
};
