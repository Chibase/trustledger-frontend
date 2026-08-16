/**
 * Browser org store (demo tenancy). Keyed by org id.
 */

import { isPlanId, type PlanId } from "@/config/plans";
import type { DeskTier } from "@/types/deskTier";
import { normalizeDeskTier, PLAN_OWNER_DESK_TIER } from "@/types/deskTier";
import type {
  InviteableRole,
  OrgInvite,
  OrgMember,
  OrgRecord,
} from "@/types/org";
import { INVITEABLE_ROLES } from "@/types/org";
import { buildSeatSummary, canInviteDeskTier } from "@/lib/orgSeats";
import { isVipCustomerName } from "@/lib/planLabel";

/** VIP Pilot org names / complimentaryVip stamp skip paid seat/desk gates. */
function seatInviteOpts(org: OrgRecord): { vip?: boolean } {
  const isVip =
    Boolean(org.complimentaryVip) || isVipCustomerName(org.name);
  return isVip ? { vip: true } : {};
}

/**
 * Stamp complimentary VIP on a local org after Cloud login set `isVip`.
 * Does not invent VIP from a caller flag on each invite.
 */
export function markOrgComplimentaryVip(orgId: string): OrgRecord | null {
  const org = getOrg(orgId);
  if (!org) return null;
  if (org.complimentaryVip) return org;
  org.complimentaryVip = true;
  saveOrg(org);
  return org;
}

/**
 * Align local org plan with the live/trial session plan so desk gates match
 * Settings (e.g. Institutional / VIP cookie) instead of a stale Project org.
 */
export function syncOrgPlanFromSession(
  orgId: string,
  sessionPlanId: PlanId,
): OrgRecord | null {
  const org = getOrg(orgId);
  if (!org) return null;
  if (!isPlanId(sessionPlanId) || org.planId === sessionPlanId) return org;
  const rank: Record<PlanId, number> = {
    solo: 0,
    practitioner: 1,
    project: 2,
    institutional: 3,
  };
  // Only raise (or set) plan to match session — never demote from a higher local plan.
  if (rank[sessionPlanId] < rank[org.planId]) return org;
  org.planId = sessionPlanId;
  const owner = org.members.find((m) => m.isPlanOwner);
  if (owner) {
    owner.deskTier = PLAN_OWNER_DESK_TIER[sessionPlanId];
  }
  saveOrg(org);
  return org;
}

const ORGS_KEY = "tl-orgs";
const ACTIVE_ORG_KEY = "tl-active-org-id";

function readOrgs(): Record<string, OrgRecord> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ORGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, OrgRecord>;
  } catch {
    return {};
  }
}

function writeOrgs(map: Record<string, OrgRecord>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ORGS_KEY, JSON.stringify(map));
}

export function getActiveOrgId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTIVE_ORG_KEY);
}

export function setActiveOrgId(orgId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_ORG_KEY, orgId);
}

export function getOrg(orgId: string): OrgRecord | null {
  return readOrgs()[orgId] || null;
}

export function getActiveOrg(): OrgRecord | null {
  const id = getActiveOrgId();
  if (!id) return null;
  return getOrg(id);
}

function saveOrg(org: OrgRecord) {
  const map = readOrgs();
  map[org.id] = org;
  writeOrgs(map);
  setActiveOrgId(org.id);
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Ensure a Plan Owner org exists for this purchaser (demo/trial). */
export function ensureOwnerOrg(input: {
  email: string;
  name: string;
  planId: PlanId;
  organization?: string;
  complimentaryVip?: boolean;
}): OrgRecord {
  const email = input.email.trim().toLowerCase();
  const planId = isPlanId(input.planId) ? input.planId : "practitioner";
  const existing = Object.values(readOrgs()).find(
    (o) => o.ownerEmail === email && o.planId === planId,
  );
  if (existing) {
    if (input.complimentaryVip && !existing.complimentaryVip) {
      existing.complimentaryVip = true;
      saveOrg(existing);
    }
    setActiveOrgId(existing.id);
    return existing;
  }

  const orgId = newId("org");
  const now = new Date().toISOString();
  const owner: OrgMember = {
    id: newId("mem"),
    email,
    name: input.name.trim() || email.split("@")[0] || "Plan Owner",
    role: "admin",
    deskTier: PLAN_OWNER_DESK_TIER[planId],
    isPlanOwner: true,
    deskTierLocked: false,
    joinedAt: now,
  };
  const org: OrgRecord = {
    id: orgId,
    name:
      input.organization?.trim() ||
      `${owner.name}'s TrustLedger workspace`,
    planId,
    createdAt: now,
    ownerEmail: email,
    ownerName: owner.name,
    members: [owner],
    invites: [],
    complimentaryVip: input.complimentaryVip || undefined,
  };
  saveOrg(org);
  return org;
}

export function createOrgInvite(input: {
  orgId: string;
  email: string;
  name: string;
  role: InviteableRole;
  deskTier: DeskTier;
  projectId?: string;
  projectName?: string;
}): { ok: true; invite: OrgInvite; acceptPath: string } | { ok: false; error: string } {
  const org = getOrg(input.orgId);
  if (!org) return { ok: false, error: "Organisation not found." };

  // Paid seat/desk gates only. VIP bypass is org-stamped (complimentaryVip /
  // VIP Pilot name) — never a caller-supplied flag (cookie/devtools).
  const inviteOpts = seatInviteOpts(org);
  const seats = buildSeatSummary(org, inviteOpts);
  if (!seats.canInvite) {
    return {
      ok: false,
      error:
        org.planId === "solo"
          ? "Solo includes the Plan Owner only. Upgrade to Practitioner for AI Assist, or Project to invite juniors."
          : org.planId === "practitioner"
            ? "Practitioner includes the Plan Owner only. Upgrade to Project to invite juniors."
            : "No seats remaining on this plan.",
    };
  }

  if (!INVITEABLE_ROLES.includes(input.role)) {
    return { ok: false, error: "Invitees cannot be Plan Owner (admin)." };
  }

  if (!canInviteDeskTier(org.planId, input.deskTier, inviteOpts)) {
    return {
      ok: false,
      error:
        "That desk exposure is above your plan. Upgrade to assign higher desks, or pick a lower ranking.",
    };
  }

  const email = input.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "Valid email required." };
  }
  if (org.members.some((m) => m.email === email)) {
    return { ok: false, error: "That person is already a member." };
  }
  if (
    org.invites.some((i) => i.email === email && i.status === "pending")
  ) {
    return { ok: false, error: "An invite is already pending for that email." };
  }

  const token = newId("inv");
  const invite: OrgInvite = {
    id: newId("invite"),
    token,
    email,
    name: input.name.trim() || email.split("@")[0] || "Invitee",
    role: input.role,
    deskTier: input.deskTier,
    projectId: input.projectId,
    projectName: input.projectName,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  org.invites.unshift(invite);
  saveOrg(org);
  return {
    ok: true,
    invite,
    acceptPath: `/invite/accept?token=${encodeURIComponent(token)}&org=${encodeURIComponent(org.id)}`,
  };
}

export function findInviteByToken(
  orgId: string,
  token: string,
): { org: OrgRecord; invite: OrgInvite } | null {
  const org = getOrg(orgId);
  if (!org) return null;
  const invite = org.invites.find((i) => i.token === token);
  if (!invite) return null;
  return { org, invite };
}

/** Resolve invite when only the token is known (scan local orgs). */
export function findInviteByTokenAnywhere(
  token: string,
  orgId?: string | null,
): { org: OrgRecord; invite: OrgInvite } | null {
  if (orgId) {
    const scoped = findInviteByToken(orgId, token);
    if (scoped) return scoped;
  }
  for (const org of Object.values(readOrgs())) {
    const invite = org.invites.find((i) => i.token === token);
    if (invite) return { org, invite };
  }
  return null;
}

/** Accept invite → add member; caller sets session cookies. */
export function acceptOrgInvite(input: {
  token: string;
  orgId?: string;
  fullName?: string;
}):
  | { ok: true; org: OrgRecord; member: OrgMember }
  | { ok: false; error: string } {
  const found = findInviteByTokenAnywhere(input.token, input.orgId);
  if (!found) {
    return { ok: false, error: "Invite not found or already used." };
  }
  if (found.invite.status === "accepted") {
    return { ok: false, error: "This invite was already accepted." };
  }
  if (found.invite.status === "revoked") {
    return { ok: false, error: "This invite was revoked by the Plan Owner." };
  }
  if (found.invite.status === "rejected") {
    return { ok: false, error: "This invite was declined." };
  }
  if (found.invite.status !== "pending") {
    return { ok: false, error: "Invite not found or already used." };
  }
  const { org, invite } = found;
  const inviteOpts = seatInviteOpts(org);
  const deskTier = normalizeDeskTier(invite.deskTier) || invite.deskTier;
  if (!canInviteDeskTier(org.planId, deskTier, inviteOpts)) {
    return {
      ok: false,
      error:
        "This invite’s desk exposure is above the organisation’s plan. Ask your Plan Owner to send a new invite at a lower rank.",
    };
  }
  const seats = buildSeatSummary(org, inviteOpts);
  // Pending invite already counted in seats; accepting converts pending → member.
  if (
    !inviteOpts.vip &&
    seats.additionalSeatCap === 0 &&
    (org.planId === "solo" || org.planId === "practitioner")
  ) {
    return {
      ok: false,
      error: "This plan does not allow junior seats.",
    };
  }

  const now = new Date().toISOString();
  const member: OrgMember = {
    id: newId("mem"),
    email: invite.email,
    name: input.fullName?.trim() || invite.name,
    role: invite.role,
    deskTier,
    isPlanOwner: false,
    deskTierLocked: true,
    projectId: invite.projectId,
    joinedAt: now,
  };
  org.members.push(member);
  invite.status = "accepted";
  invite.acceptedAt = now;
  saveOrg(org);
  setActiveOrgId(org.id);
  return { ok: true, org, member };
}

export function revokeOrgInvite(orgId: string, inviteId: string): boolean {
  const org = getOrg(orgId);
  if (!org) return false;
  const invite = org.invites.find((i) => i.id === inviteId);
  if (!invite || invite.status !== "pending") return false;
  invite.status = "revoked";
  saveOrg(org);
  return true;
}

export function rejectOrgInvite(input: {
  token: string;
  orgId?: string;
}): { ok: true; org: OrgRecord; invite: OrgInvite } | { ok: false; error: string } {
  const found = findInviteByTokenAnywhere(input.token, input.orgId);
  if (!found) {
    return { ok: false, error: "Invite not found or already used." };
  }
  if (found.invite.status === "accepted") {
    return { ok: false, error: "This invite was already accepted." };
  }
  if (found.invite.status === "revoked") {
    return { ok: false, error: "This invite was revoked by the Plan Owner." };
  }
  if (found.invite.status === "rejected") {
    return { ok: true, org: found.org, invite: found.invite };
  }
  if (found.invite.status !== "pending") {
    return { ok: false, error: "Invite not found or already used." };
  }
  found.invite.status = "rejected";
  found.invite.rejectedAt = new Date().toISOString();
  saveOrg(found.org);
  return { ok: true, org: found.org, invite: found.invite };
}

/** Store portable Accept/Decline token; stamp emailSentAt only when mail left. */
export function markInviteEmailSent(input: {
  orgId: string;
  inviteId: string;
  portableToken: string;
  /** When false, keep portable link for manual share without claiming email sent. */
  emailSent?: boolean;
}): boolean {
  const org = getOrg(input.orgId);
  if (!org) return false;
  const invite = org.invites.find((i) => i.id === input.inviteId);
  if (!invite) return false;
  invite.portableToken = input.portableToken;
  if (input.emailSent !== false) {
    invite.emailSentAt = new Date().toISOString();
  }
  saveOrg(org);
  return true;
}

/**
 * Seed / merge a portable invite into this browser so accept/reject works
 * when the invitee opens the email on another device.
 */
export function hydratePortableInvite(payload: {
  orgId: string;
  orgName: string;
  planId: PlanId;
  ownerEmail: string;
  ownerName: string;
  inviteId: string;
  token: string;
  email: string;
  name: string;
  role: InviteableRole;
  deskTier: DeskTier;
  projectId?: string;
  projectName?: string;
  complimentaryVip?: boolean;
  portableToken?: string;
}): { org: OrgRecord; invite: OrgInvite } {
  const now = new Date().toISOString();
  let org = getOrg(payload.orgId);
  if (!org) {
    const owner: OrgMember = {
      id: newId("mem"),
      email: payload.ownerEmail.trim().toLowerCase(),
      name: payload.ownerName.trim() || "Plan Owner",
      role: "admin",
      deskTier: PLAN_OWNER_DESK_TIER[payload.planId],
      isPlanOwner: true,
      deskTierLocked: false,
      joinedAt: now,
    };
    org = {
      id: payload.orgId,
      name: payload.orgName,
      planId: payload.planId,
      createdAt: now,
      ownerEmail: owner.email,
      ownerName: owner.name,
      members: [owner],
      invites: [],
      complimentaryVip: isVipCustomerName(payload.orgName) || undefined,
    };
  }

  // VIP stamp only from VIP Pilot naming — never trust portable payload flag.
  if (isVipCustomerName(payload.orgName)) {
    org.complimentaryVip = true;
  }

  let invite = org.invites.find(
    (i) => i.id === payload.inviteId || i.token === payload.token,
  );
  if (!invite) {
    invite = {
      id: payload.inviteId,
      token: payload.token,
      email: payload.email.trim().toLowerCase(),
      name: payload.name,
      role: payload.role,
      deskTier: payload.deskTier,
      projectId: payload.projectId,
      projectName: payload.projectName,
      status: "pending",
      createdAt: now,
      portableToken: payload.portableToken,
    };
    org.invites.unshift(invite);
  } else if (payload.portableToken && !invite.portableToken) {
    invite.portableToken = payload.portableToken;
  }

  saveOrg(org);
  return { org, invite };
}

export function listPendingInvites(orgId: string): OrgInvite[] {
  return (getOrg(orgId)?.invites || []).filter((i) => i.status === "pending");
}
