"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  hydratePortableInvite,
  rejectOrgInvite,
} from "@/lib/orgStore";

function RejectInviteForm() {
  const search = useSearchParams();
  const portableRaw = (search.get("invite") ?? "").trim();
  const [status, setStatus] = useState<
    "loading" | "ready" | "done" | "error"
  >(portableRaw ? "loading" : "error");
  const [message, setMessage] = useState<string | null>(
    portableRaw ? null : "Missing invite link.",
  );
  const [orgName, setOrgName] = useState("the organisation");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!portableRaw) return;
    const frame = requestAnimationFrame(() => {
      void (async () => {
        try {
          const res = await fetch("/api/invite/peek", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ invite: portableRaw }),
          });
          const json = (await res.json()) as {
            ok?: boolean;
            error?: string;
            payload?: {
              orgId: string;
              orgName: string;
              planId: string;
              ownerEmail: string;
              ownerName: string;
              inviteId: string;
              token: string;
              email: string;
              name: string;
              role: string;
              deskTier: string;
              complimentaryVip?: boolean;
            };
          };
          if (!res.ok || !json.payload) {
            setStatus("error");
            setMessage(json.error || "Invite link is invalid or expired.");
            return;
          }
          const p = json.payload;
          hydratePortableInvite({
            orgId: p.orgId,
            orgName: p.orgName,
            planId: p.planId as "solo" | "practitioner" | "project" | "institutional",
            ownerEmail: p.ownerEmail,
            ownerName: p.ownerName,
            inviteId: p.inviteId,
            token: p.token,
            email: p.email,
            name: p.name,
            role: p.role as "client" | "contractor" | "community",
            deskTier: p.deskTier as
              | "funder"
              | "executive"
              | "delivery"
              | "supervisor"
              | "clo",
            complimentaryVip: p.complimentaryVip,
            portableToken: portableRaw,
          });
          setOrgName(p.orgName);
          setStatus("ready");
        } catch {
          setStatus("error");
          setMessage("Could not open this invite link.");
        }
      })();
    });
    return () => cancelAnimationFrame(frame);
  }, [portableRaw]);

  async function onDecline() {
    if (!portableRaw) return;
    setBusy(true);
    setMessage(null);
    try {
      const peek = await fetch("/api/invite/peek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invite: portableRaw }),
      });
      const peeked = (await peek.json()) as {
        error?: string;
        payload?: { token: string; orgId: string };
      };
      if (!peek.ok || !peeked.payload) {
        setStatus("error");
        setMessage(peeked.error || "Invite link is invalid or revoked.");
        return;
      }
      const rejected = rejectOrgInvite({
        token: peeked.payload.token,
        orgId: peeked.payload.orgId,
      });
      if (!rejected.ok) {
        setMessage(rejected.error);
        return;
      }
      await fetch("/api/invite/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invite: portableRaw,
          decision: "rejected",
        }),
      });
      setStatus("done");
    } catch {
      setMessage("Could not record your decline. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") {
    return <p className="mt-6 text-sm text-tl-ink-muted">Opening invite…</p>;
  }

  if (status === "error") {
    return (
      <p
        className="mt-6 rounded-md border border-tl-danger/40 bg-tl-surface px-3 py-2 text-sm text-tl-danger"
        role="alert"
      >
        {message}
      </p>
    );
  }

  if (status === "done") {
    return (
      <div className="mt-6 space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
        <p className="font-medium text-tl-ink">Invite declined</p>
        <p className="text-tl-ink-muted">
          You declined the invitation to {orgName}. The Plan Owner has been
          notified.
        </p>
        <Link href="/" className="text-tl-trust-ink underline">
          Back to TrustLedger
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm">
      <p className="text-tl-ink-muted">
        Decline the invitation to join{" "}
        <strong className="text-tl-ink">{orgName}</strong>?
      </p>
      {message ? (
        <p className="text-sm text-tl-danger" role="alert">
          {message}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onDecline()}
          className="flex-1 rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {busy ? "Declining…" : "Decline invite"}
        </button>
        <Link
          href={`/invite/accept?invite=${encodeURIComponent(portableRaw)}`}
          className="flex-1 rounded-md border border-tl-line bg-tl-paper px-4 py-2 text-center text-sm font-medium hover:border-tl-trust/40"
        >
          Accept instead
        </Link>
      </div>
    </div>
  );
}

export default function RejectInvitePage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">
        Decline team invite
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Tell the Plan Owner you will not join this workspace.
      </p>
      <Suspense
        fallback={
          <p className="mt-6 text-sm text-tl-ink-muted">Loading invite…</p>
        }
      >
        <RejectInviteForm />
      </Suspense>
    </main>
  );
}
