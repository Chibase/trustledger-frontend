"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  acceptOrgInvite,
  findInviteByTokenAnywhere,
  hydratePortableInvite,
  rejectOrgInvite,
} from "@/lib/orgStore";

function OwnerSyncForm() {
  const search = useSearchParams();
  const receipt = (search.get("receipt") ?? "").trim();
  const [message, setMessage] = useState(
    receipt ? "Updating your seat list…" : "Missing sync link.",
  );
  const [ok, setOk] = useState<boolean | null>(receipt ? null : false);

  useEffect(() => {
    if (!receipt) return;
    const frame = requestAnimationFrame(() => {
      void (async () => {
        try {
          const res = await fetch("/api/invite/owner-sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ receipt }),
          });
          const json = (await res.json()) as {
            ok?: boolean;
            error?: string;
            decision?: "accepted" | "rejected";
            payload?: {
              orgId: string;
              inviteId: string;
              token: string;
              orgName: string;
              planId: string;
              ownerEmail: string;
              ownerName: string;
              email: string;
              name: string;
              role: string;
              deskTier: string;
            };
          };
          if (!res.ok || !json.payload || !json.decision) {
            setOk(false);
            setMessage(json.error || "Sync link is invalid or expired.");
            return;
          }
          const p = json.payload;
          hydratePortableInvite({
            orgId: p.orgId,
            orgName: p.orgName,
            planId: p.planId as
              | "solo"
              | "practitioner"
              | "project"
              | "institutional",
            ownerEmail: p.ownerEmail,
            ownerName: p.ownerName || "Plan Owner",
            inviteId: p.inviteId,
            token: p.token,
            email: p.email,
            name: p.name || p.email,
            role: p.role as "client" | "contractor" | "community",
            deskTier: p.deskTier as
              | "funder"
              | "executive"
              | "delivery"
              | "supervisor"
              | "clo",
          });
          if (json.decision === "rejected") {
            const result = rejectOrgInvite({
              token: p.token,
              orgId: p.orgId,
            });
            setOk(result.ok);
            setMessage(
              result.ok
                ? "Invite marked declined on this device."
                : result.error,
            );
            return;
          }
          const found = findInviteByTokenAnywhere(p.token, p.orgId);
          if (found?.invite.status === "pending") {
            acceptOrgInvite({
              token: p.token,
              orgId: p.orgId,
              fullName: p.name,
            });
          }
          setOk(true);
          setMessage("Invite marked accepted on this device.");
        } catch {
          setOk(false);
          setMessage("Could not apply invite decision.");
        }
      })();
    });
    return () => cancelAnimationFrame(frame);
  }, [receipt]);

  return (
    <div className="mt-6 space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
      <p
        className={ok === false ? "text-tl-danger" : "text-tl-ink-muted"}
        role={ok === false ? "alert" : undefined}
      >
        {message}
      </p>
      <Link
        href="/app/settings#team-seats"
        className="text-tl-trust-ink underline"
      >
        Open Team / Seats
      </Link>
    </div>
  );
}

export default function OwnerInviteSyncPage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">
        Update invite status
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Sync the invitee’s Accept or Decline onto this browser’s seat list.
      </p>
      <Suspense
        fallback={
          <p className="mt-6 text-sm text-tl-ink-muted">Loading…</p>
        }
      >
        <OwnerSyncForm />
      </Suspense>
    </main>
  );
}
