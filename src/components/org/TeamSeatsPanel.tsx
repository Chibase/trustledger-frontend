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
  markInviteEmailSent,
  markOrgComplimentaryVip,
  revokeOrgInvite,
  syncOrgPlanFromSession,
} from "@/lib/orgStore";
import { bootstrapPlanOwnerOrg } from "@/lib/orgSession";
import { isVipCustomerName } from "@/lib/planLabel";
import type { OrgInvite } from "@/types/org";

type TeamSeatsPanelProps = {
  isPlanOwner: boolean;
  userEmail: string | null;
  userName: string;
  planId?: PlanId;
  /** Complimentary VIP Institutional — no seat/desk-level invite limits. */
  isVip?: boolean;
};

const PLAN_RANK: Record<PlanId, number> = {
  solo: 0,
  practitioner: 1,
  project: 2,
  institutional: 3,
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
  const [sending, setSending] = useState(false);

  const orgIsVip =
    isVip ||
    Boolean(org?.complimentaryVip) ||
    isVipCustomerName(org?.name);
  const inviteOpts = orgIsVip ? { vip: true as const } : undefined;
  /** Prefer session plan (Settings cookie) so Institutional Rank 1 is not stuck on a stale Project org. */
  const effectivePlanId: PlanId = (() => {
    const session = planId && isPlanId(planId) ? planId : null;
    const local = org?.planId;
    if (session && local) {
      return PLAN_RANK[session] >= PLAN_RANK[local] ? session : local;
    }
    return session || local || "project";
  })();
  const clientBoardOpen =
    orgIsVip || effectivePlanId === "institutional";

  function refresh() {
    let active = getActiveOrg();
    // Cloud login sets isVip from Customer name; stamp local org once so
    // invite/accept gates match without trusting a per-invite client flag.
    if (active && isVip && !active.complimentaryVip) {
      active = markOrgComplimentaryVip(active.id) || active;
    }
    if (active && planId && isPlanId(planId)) {
      active = syncOrgPlanFromSession(active.id, planId) || active;
    }
    setOrg(active);
  }

  async function sendInviteEmail(inv: OrgInvite, activeOrg = org) {
    if (!activeOrg) return { sent: false, detail: "No organisation" };
    try {
      const res = await fetch("/api/invite/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: activeOrg.id,
          orgName: activeOrg.name,
          planId: activeOrg.planId,
          ownerEmail: activeOrg.ownerEmail || userEmail || "",
          ownerName: activeOrg.ownerName || userName || "Plan Owner",
          inviteId: inv.id,
          token: inv.token,
          email: inv.email,
          name: inv.name,
          role: inv.role,
          deskTier: inv.deskTier,
          projectId: inv.projectId,
          projectName: inv.projectName,
          complimentaryVip: Boolean(activeOrg.complimentaryVip) || isVip,
        }),
      });
      const json = (await res.json()) as {
        sent?: boolean;
        error?: string;
        portableToken?: string;
        acceptUrl?: string;
      };
      if (json.portableToken) {
        markInviteEmailSent({
          orgId: activeOrg.id,
          inviteId: inv.id,
          portableToken: json.portableToken,
          emailSent: Boolean(json.sent),
        });
      }
      if (json.acceptUrl) {
        try {
          const path =
            new URL(json.acceptUrl).pathname + new URL(json.acceptUrl).search;
          setLastAcceptPath(path);
        } catch {
          setLastAcceptPath(json.acceptUrl);
        }
      }
      if (json.sent) {
        return { sent: true as const };
      }
      return {
        sent: false as const,
        detail: json.error || "Email was not sent",
      };
    } catch {
      return { sent: false as const, detail: "Network error sending invite email" };
    }
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      refresh();
      const active = getActiveOrg();
      const session = planId && isPlanId(planId) ? planId : null;
      const gatePlan =
        session && active
          ? PLAN_RANK[session] >= PLAN_RANK[active.planId]
            ? session
            : active.planId
          : session || active?.planId;
      if (gatePlan) {
        const vip =
          isVip ||
          Boolean(active?.complimentaryVip) ||
          isVipCustomerName(active?.name);
        setDeskTier(
          defaultInviteDeskTier(gatePlan, vip ? { vip: true } : undefined),
        );
      }
    });
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isVip drives VIP stamp
  }, [planId, isVip]);

  function handleBootstrap() {
    const plan: PlanId =
      planId && isPlanId(planId) ? planId : "project";
    const emailSafe = userEmail || "owner@demo.trustledger.local";
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

  async function handleInvite(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLastAcceptPath(null);
    if (!org) {
      setError("Create a Plan Owner workspace first.");
      return;
    }
    if (planId && isPlanId(planId)) {
      syncOrgPlanFromSession(org.id, planId);
    }
    if (!canInviteDeskTier(effectivePlanId, deskTier, inviteOpts)) {
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
    setSending(true);
    const mail = await sendInviteEmail(result.invite, getActiveOrg() || org);
    setSending(false);
    setName("");
    setEmail("");
    setDeskTier(defaultInviteDeskTier(effectivePlanId, inviteOpts));
    refresh();
    if (mail.sent) {
      pushToast("Invite email sent — they can Accept or Decline", "success");
    } else {
      pushToast(
        mail.detail
          ? `Invite created — email not sent (${mail.detail}). Share the accept link.`
          : "Invite created — share the accept link",
        "error",
      );
    }
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
  const planName = PLANS[effectivePlanId]?.name || effectivePlanId;
  const pending = org.invites.filter(
    (i) => i.status === "pending" || i.status === "rejected",
  );

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
              with matching access — an email is sent so they can Accept or
              Decline.
            </>
          ) : clientBoardOpen ? (
            <>
              {org.name} · {planName}. Invite Client/Board, CEO, and junior desks.
              Creating an invite emails Accept / Decline links automatically.
            </>
          ) : (
            <>
              {org.name} · {planName}. Invite lower-rank seats only (never Plan
              Owner). Creating an invite emails Accept / Decline links
              automatically.
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
            Pending &amp; declined invites
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
                  <span className="flex flex-wrap gap-2">
                    {inv.status === "pending" ? (
                      <>
                        <button
                          type="button"
                          className="text-xs font-medium text-tl-trust-ink underline"
                          onClick={() => {
                            void (async () => {
                              const mail = await sendInviteEmail(inv);
                              refresh();
                              pushToast(
                                mail.sent
                                  ? "Invite email resent"
                                  : mail.detail || "Could not resend email",
                                mail.sent ? "success" : "error",
                              );
                            })();
                          }}
                        >
                          Resend email
                        </button>
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
                      </>
                    ) : (
                      <span className="text-xs text-tl-amber">Declined</span>
                    )}
                  </span>
                </div>
                <p className="mt-1 text-xs text-tl-ink-muted">
                  {inv.role} · {DESK_TIER_LABELS[inv.deskTier]}
                  {inv.emailSentAt
                    ? ` · email sent ${new Date(inv.emailSentAt).toLocaleString("en-ZA")}`
                    : " · email not sent yet"}
                  {inv.rejectedAt
                    ? ` · declined ${new Date(inv.rejectedAt).toLocaleString("en-ZA")}`
                    : ""}
                </p>
                {inv.status === "pending" ? (
                  <p className="mt-1 break-all font-mono text-[0.65rem] text-tl-ink-muted">
                    {inv.portableToken
                      ? `/invite/accept?invite=…`
                      : `/invite/accept?token=${inv.token}&org=${org.id}`}
                  </p>
                ) : null}
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
                      if (!canInviteDeskTier(effectivePlanId, next, inviteOpts))
                        return;
                      setDeskTier(next);
                    }}
                    className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  >
                    {DESK_TIERS.map((t) => {
                      const allowed = canInviteDeskTier(
                        effectivePlanId,
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
                      : clientBoardOpen
                        ? "Rank 1 Client/Board through Rank 5 CLO are available on Institutional."
                        : `Greyed desks (including Rank 1 Client) are above ${planName}. Upgrade to Institutional to unlock.`}
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
                disabled={sending}
                className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
              >
                {sending ? "Sending invite…" : "Create invite & email"}
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
