"use client";

import { useEffect, useState } from "react";
import { PLANS, type PlanId } from "@/config/plans";
import { useToast } from "@/components/ui/Toast";
import {
  DESK_TIERS,
  DESK_TIER_LABELS,
  type DeskTier,
} from "@/types/deskTier";
import {
  INVITEABLE_ROLES,
  type InviteableRole,
  type OrgRecord,
} from "@/types/org";
import { buildSeatSummary } from "@/lib/orgSeats";
import {
  createOrgInvite,
  getActiveOrg,
  revokeOrgInvite,
} from "@/lib/orgStore";
import { bootstrapPlanOwnerOrg } from "@/lib/orgSession";
import { isPlanId } from "@/config/plans";

type TeamSeatsPanelProps = {
  isPlanOwner: boolean;
  userEmail: string | null;
  userName: string;
  planId?: PlanId;
};

export function TeamSeatsPanel({
  isPlanOwner,
  userEmail,
  userName,
  planId,
}: TeamSeatsPanelProps) {
  const { pushToast } = useToast();
  const [org, setOrg] = useState<OrgRecord | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<InviteableRole>("contractor");
  const [deskTier, setDeskTier] = useState<DeskTier>("clo");
  const [lastAcceptPath, setLastAcceptPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    setOrg(getActiveOrg());
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => refresh());
    return () => cancelAnimationFrame(frame);
  }, []);

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
    });
    refresh();
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

  const seats = buildSeatSummary(org);
  const planName = PLANS[org.planId]?.name || org.planId;
  const pending = org.invites.filter((i) => i.status === "pending");

  return (
    <section
      id="team-seats"
      className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
    >
      <div>
        <h2 className="font-semibold">Team / Seats</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          {org.name} · {planName}. Plan Owner invites juniors and sets their
          exposure (role + desk tier). Practitioner has no junior seats —
          upgrade to Project to invite.
        </p>
        <p className="mt-2 text-xs text-tl-ink-muted">
          Seats:{" "}
          {seats.additionalSeatCap === null
            ? `${seats.membersUsed} juniors (unlimited)`
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
        <form onSubmit={handleInvite} className="space-y-3 border-t border-tl-line pt-4">
          <h3 className="font-medium">Invite junior</h3>
          {!seats.canInvite ? (
            <p className="text-xs text-tl-ink-muted">
              {org.planId === "practitioner" ? (
                <>
                  Practitioner is Owner-only.{" "}
                  <a href="/pay?plan=project" className="text-tl-trust-ink underline">
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
                  <span className="mb-1 block font-medium">Role</span>
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
                </label>
                <label className="block text-xs">
                  <span className="mb-1 block font-medium">
                    Desk exposure
                  </span>
                  <select
                    value={deskTier}
                    onChange={(e) => setDeskTier(e.target.value as DeskTier)}
                    className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                  >
                    {DESK_TIERS.map((t) => (
                      <option key={t} value={t}>
                        {DESK_TIER_LABELS[t]}
                      </option>
                    ))}
                  </select>
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
              Accept link: {typeof window !== "undefined" ? window.location.origin : ""}
              {lastAcceptPath}
            </p>
          ) : null}
        </form>
      ) : null}
    </section>
  );
}
