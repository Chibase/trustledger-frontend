"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PLANS } from "@/config/plans";
import { buildSeatSummary } from "@/lib/orgSeats";
import { getActiveOrg } from "@/lib/orgStore";
import type { OrgRecord, SeatSummary } from "@/types/org";

/**
 * Plan Owner master strip — seats, invites, data-space stub.
 */
export function PlanOwnerMasterPanel() {
  const [org, setOrg] = useState<OrgRecord | null>(null);
  const [seats, setSeats] = useState<SeatSummary | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const active = getActiveOrg();
      setOrg(active);
      setSeats(active ? buildSeatSummary(active) : null);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!org || !seats) {
    return (
      <section className="rounded-lg border border-dashed border-tl-line bg-tl-surface/60 p-4 text-sm">
        <h2 className="font-semibold text-tl-ink">Plan Owner master desk</h2>
        <p className="mt-1 text-tl-ink-muted">
          No organisation on this device yet. Complete Subscribe / Start trial,
          or open Settings → Team to bootstrap a demo Plan Owner workspace.
        </p>
        <Link
          href="/app/settings"
          className="mt-3 inline-block text-sm font-medium text-tl-trust-ink underline"
        >
          Open Team / Seats
        </Link>
      </section>
    );
  }

  const planName = PLANS[org.planId]?.name || org.planId;
  const seatLabel =
    seats.additionalSeatCap === null
      ? `${seats.membersUsed} juniors · unlimited seats`
      : seats.additionalSeatCap === 0
        ? "Owner only (no junior seats)"
        : `${seats.membersUsed} / ${seats.additionalSeatCap} junior seats used`;

  return (
    <section className="rounded-lg border border-tl-trust/30 bg-tl-paper p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
            Master dashboard
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold text-tl-ink">
            {org.name}
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Plan Owner · {planName} · {seatLabel}
            {seats.invitesPending
              ? ` · ${seats.invitesPending} pending invite${seats.invitesPending === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/app/settings#team-seats"
            className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Invite team
          </Link>
          <Link
            href="/app/settings#data-space"
            className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-surface"
          >
            Data space
          </Link>
          <Link
            href="/app/settings#media-library"
            className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium hover:bg-tl-surface"
          >
            Media
          </Link>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
        <div className="rounded-md border border-tl-line bg-tl-surface px-3 py-2">
          <dt className="text-xs text-tl-ink-muted">Members</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {org.members.length}
          </dd>
        </div>
        <div className="rounded-md border border-tl-line bg-tl-surface px-3 py-2">
          <dt className="text-xs text-tl-ink-muted">Pending invites</dt>
          <dd className="mt-0.5 font-semibold tabular-nums">
            {seats.invitesPending}
          </dd>
        </div>
        <div className="rounded-md border border-tl-line bg-tl-surface px-3 py-2">
          <dt className="text-xs text-tl-ink-muted">Data &amp; media</dt>
          <dd className="mt-0.5 text-xs text-tl-ink-muted">
            CSV import · quota meter
          </dd>
        </div>
      </dl>
    </section>
  );
}
