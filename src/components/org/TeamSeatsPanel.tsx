"use client";

import { useEffect, useState } from "react";
import { PLANS, isPlanId, type PlanId } from "@/config/plans";
import { useToast } from "@/components/ui/Toast";
import {
  DESK_TIERS,
  DESK_TIER_LABELS,
  DESK_TIER_RANK,
  type DeskTier,
} from "@/types/deskTier";
import {
  INVITEABLE_ROLES,
  type InviteableRole,
  type OrgRecord,
} from "@/types/org";
import {
  buildSeatSummary,
  canInviteDeskTier,
  defaultInviteDeskTier,
  inviteDeskUpgradeLabel,
} from "@/lib/orgSeats";
import {
  createOrgInvite,
  getActiveOrg,
  markOrgComplimentaryVip,
  revokeOrgInvite,
} from "@/lib/orgStore";
import { bootstrapPlanOwnerOrg } from "@/lib/orgSession";
import { isVipCustomerName } from "@/lib/planLabel";

type TeamSeatsPanelProps = {
  isPlanOwner: boolean;
  userEmail: string | null;
  userName: string;
  planId?: PlanId;
  /** Complimentary VIP Institutional — no seat/desk-level invite limits. */
  isVip?: boolean;
};

export function TeamSeatsPanel({
  isPlanOwner,
  userEmail,
  userName,
  planId,
  isVip = false,
}: TeamSeatsPanelProps) {
  const { pushToast } = useToast();
  const [org, setOrg] = useState<OrgRecord | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteableRole>("contractor");
  const [deskTier, setDeskTier] = useState<DeskTier>("clo");
  const [lastAcceptPath, setLastAcceptPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const orgIsVip =
    isVip ||
    Boolean(org?.complimentaryVip) ||
    isVipCustomerName(org?.name);
  const inviteOpts = orgIsVip ? { vip: true as const } : undefined;

  function refresh() {
    let active = getActiveOrg();
    // Cloud login sets isVip from Customer name; stamp local org once so
    // invite/accept gates match without trusting a per-invite client flag.
    if (active && isVip && !active.complimentaryVip) {
      active = markOrgComplimentaryVip(active.id) || active;
    }
    setOrg(active);
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      refresh();
      const active = getActiveOrg();
      if (active) {
        const vip =
          isVip ||
          Boolean(active.complimentaryVip) ||
          isVipCustomerName(active.name);
        setDeskTier(
          defaultInviteDeskTier(active.planId, vip ? { vip: true } : undefined),
        );
      } else if (planId && isPlanId(planId)) {
        setDeskTier(
          defaultInviteDeskTier(planId, isVip ? { vip: true } : undefined),
        );
      }
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isVip drives VIP stamp
  }, [planId, isVip]);

  function handleBootstrap() {
    const plan: PlanId =
      planId && isPlanId(planId) ? planId : "project";
    const emailSafe =
      userEmail ||
      `owner+${Date.now().toString(36)}@demo.trustledger.local`;
    bootstrapPlanOwnerOrg({
      email: emailSafe,
      name: userName || "Plan Owner",
      planId: plan,
      mode: "demo",
      complimentaryVip: isVip,
    });
    refresh();
    setDeskTier(defaultInviteDeskTier(plan, inviteOpts));
    pushToast("Plan Owner workspace created on this device", "success");
  }

  function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLastAcceptPath(null);
    if (!org) {
      setError("Create a Plan Owner workspace first.");
      return;
    }
    if (!canInviteDeskTier(org.planId, deskTier, inviteOpts)) {
      setError(
        "That desk exposure is above your plan. Choose a lower ranking or upgrade.",
      );
      return;
    }
    if (isVip) {
      markOrgComplimentaryVip(org.id);
    }
    const result = createOrgInvite({
      orgId: org.id,
      email,
      name,
      role,
      deskTier,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLastAcceptPath(result.acceptPath);
    setName("");
    setEmail("");
    setDeskTier(defaultInviteDeskTier(org.planId, inviteOpts));
    refresh();
    pushToast("Invite created — share the accept link", "success");
  }

  if (!isPlanOwner && !org) {
    return (
      <section
        id="team-seats"
        className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
      >
        <h2 className="font-semibold">Team / Seats</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Only the Plan Owner manages seats. Switch to an admin / Owner session
          or bootstrap a demo Owner workspace.
        </p>
        <button
          type="button"
          onClick={handleBootstrap}
          className="mt-3 rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-paper"
        >
          Bootstrap demo Plan Owner
        </button>
      </section>
    );
  }

  if (!org) {
    return (
      <section
        id="team-seats"
        className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
      >
        <h2 className="font-semibold">Team / Seats</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Create your master organisation on this device (demo tenancy).
        </p>
        <button
          type="button"
          onClick={handleBootstrap}
          className="mt-3 rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Create Plan Owner workspace
        </button>
      </section>
    );
  }

  const seats = buildSeatSummary(org, inviteOpts);
  const planName = PLANS[org.planId]?.name || org.planId;
  const pending = org.invites.filter((i) => i.status === "pending");

  return (
    <section
      id="team-seats"
      className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
    >
      <div>
        <h2 className="font-semibold">Invite team</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          {orgIsVip ? (
            <>
              {org.name} · VIP Institutional. Invite CEOs, Clients, and any desk
              with matching access — complimentary seats are not capped by paid
              plan rank rules.
            </>
          ) : (
            <>
              {org.name} · {planName}. Invite lower-rank seats only (never Plan
              Owner). Desk exposure is limited by your plan — higher desks stay
              listed but greyed until you upgrade.
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-tl-ink-muted">
          Seats:{" "}
          {orgIsVip || seats.additionalSeatCap === null
            ? `${seats.membersUsed} seated (unlimited)`
            : seats.additionalSeatCap === 0
              ? "Owner only"
              : `${seats.membersUsed + seats.invitesPending} / ${seats.additionalSeatCap} used (incl. pending)`}
        </p>
      </div>

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
          Members
        </h3>
        <ul className="mt-2 divide-y divide-tl-line rounded-md border border-tl-line">
          {org.members.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2"
            >
              <span>
                <span className="font-medium">{m.name}</span>
                <span className="ml-2 text-xs text-tl-ink-muted">
                  {m.email}
                </span>
              </span>
              <span className="text-xs text-tl-ink-muted">
                {m.isPlanOwner ? "Plan Owner" : m.role} ·{" "}
                {DESK_TIER_LABELS[m.deskTier]}
                {m.deskTierLocked ? " · locked" : ""}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {pending.length ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Pending invites
          </h3>
          <ul className="mt-2 space-y-2">
            {pending.map((inv) => (
              <li
                key={inv.id}
                className="rounded-md border border-tl-line px-3 py-2"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium">
                    {inv.name}{" "}
                    <span className="font-normal text-tl-ink-muted">
                      {inv.email}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="text-xs font-medium text-tl-danger underline"
                    onClick={() => {
                      revokeOrgInvite(org.id, inv.id);
                      refresh();
                      pushToast("Invite revoked", "success");
                    }}
                  >
                    Revoke
                  </button>
                </div>
                <p className="mt-1 text-xs text-tl-ink-muted">
                  {inv.role} · {DESK_TIER_LABELS[inv.deskTier]}
                </p>
                <p className="mt-1 break-all font-mono text-[0.65rem] text-tl-ink-muted">
                  /invite/accept?token={inv.token}&org={org.id}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {isPlanOwner ? (
        <form
          onSubmit={handleInvite}
          className="space-y-3 border-t border-tl-line pt-4"
        >
          <h3 className="font-medium">
            {orgIsVip ? "Invite colleague" : "Invite junior"}
          </h3>
          {!seats.canInvite ? (
            <p className="text-xs text-tl-ink-muted">
              {org.planId === "solo" ? (
                <>
                  Solo is Owner-only.{" "}
                  <a
                    href="/pay?plan=project"
                    className="text-tl-trust-ink underline"
                  >
                    Upgrade to Project
                  </a>{" "}
                  to invite seats.
                </>
              ) : org.planId === "practitioner" ? (
                <>
                  Practitioner is Owner-only.{" "}
                  <a
                    href="/pay?plan=project"
                    className="text-tl-trust-ink underline"
                  >
                    Upgrade to Project
                  </a>{" "}
                  to invite seats.
                </>
              ) : (
                "No seats remaining."
              )}
            </p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs">
                  <span className="mb-1 block font-medium">Name</span>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-medium">Work email</span>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-medium">
                    {orgIsVip ? "Role" : "Role (lower ranks only)"}
                  </span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as InviteableRole)}
                    className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  >
                    {INVITEABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[0.65rem] text-tl-ink-muted">
                    {orgIsVip
                      ? "Use client for Client stakeholders; contractor/community for field seats. Plan Owner (admin) cannot be invited."
                      : "Plan Owner (admin) cannot be invited."}
                  </span>
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-medium">Desk exposure</span>
                  <select
                    value={deskTier}
                    onChange={(e) => {
                      const next = e.target.value as DeskTier;
                      if (!canInviteDeskTier(org.planId, next, inviteOpts))
                        return;
                      setDeskTier(next);
                    }}
                    className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  >
                    {DESK_TIERS.map((t) => {
                      const allowed = canInviteDeskTier(
                        org.planId,
                        t,
                        inviteOpts,
                      );
                      const rank = DESK_TIER_RANK[t];
                      return (
                        <option key={t} value={t} disabled={!allowed}>
                          {allowed
                            ? `${rank}. ${DESK_TIER_LABELS[t]}`
                            : `${rank}. ${DESK_TIER_LABELS[t]} — ${inviteDeskUpgradeLabel(t)}`}
                        </option>
                      );
                    })}
                  </select>
                  <span className="mt-1 block text-[0.65rem] text-tl-ink-muted">
                    {orgIsVip
                      ? "All desks available on VIP — including Client/Board and CEO/MD."
                      : `Greyed desks are above ${planName}. Upgrade to unlock.`}
                  </span>
                </label>
              </div>
              {error ? (
                <p className="text-sm text-tl-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <button
                type="submit"
                className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
              >
                Create invite
              </button>
            </>
          )}
          {lastAcceptPath ? (
            <p className="break-all rounded-md border border-tl-line bg-tl-paper px-3 py-2 font-mono text-xs">
              Accept link:{" "}
              {typeof window !== "undefined" ? window.location.origin : ""}
              {lastAcceptPath}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
