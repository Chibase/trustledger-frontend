"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { DESK_TIER_LABELS } from "@/types/deskTier";
import {
  acceptOrgInvite,
  findInviteByTokenAnywhere,
  hydratePortableInvite,
} from "@/lib/orgStore";
import { applyOrgInviteeSession } from "@/lib/orgSession";

type PortablePreview = {
  orgName: string;
  deskTier: string;
  role: string;
  email: string;
  name: string;
  token: string;
  orgId: string;
};

function AcceptInviteForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = (search.get("token") ?? "").trim();
  const orgId = (search.get("org") ?? "").trim() || null;
  const portableRaw = (search.get("invite") ?? "").trim();

  const [portable, setPortable] = useState<PortablePreview | null>(null);
  const [portableError, setPortableError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

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
              projectId?: string;
              projectName?: string;
              complimentaryVip?: boolean;
            };
          };
          if (!res.ok || !json.payload) {
            setPortableError(json.error || "Invite link is invalid or expired.");
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
            projectId: p.projectId,
            projectName: p.projectName,
            complimentaryVip: p.complimentaryVip,
            portableToken: portableRaw,
          });
          setPortable({
            orgName: p.orgName,
            deskTier: p.deskTier,
            role: p.role,
            email: p.email,
            name: p.name,
            token: p.token,
            orgId: p.orgId,
          });
          setHydrated(true);
        } catch {
          setPortableError("Could not open this invite link.");
        }
      })();
    });
    return () => cancelAnimationFrame(frame);
  }, [portableRaw]);

  const localToken = portable?.token || token;
  const localOrgId = portable?.orgId || orgId;
  const found = useMemo(
    () =>
      localToken && hydrated
        ? findInviteByTokenAnywhere(localToken, localOrgId)
        : localToken && !portableRaw
          ? findInviteByTokenAnywhere(localToken, localOrgId)
          : null,
    [localToken, localOrgId, hydrated, portableRaw],
  );

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!localToken || !found) {
      setError("Invite link is missing or invalid.");
      return;
    }
    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    let cloudSeat = false;
    try {
      if (portableRaw) {
        const peek = await fetch("/api/invite/peek", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ invite: portableRaw }),
        });
        const peeked = (await peek.json()) as { error?: string };
        if (!peek.ok) {
          setError(peeked.error || "Invite link is invalid or revoked.");
          return;
        }
      }
      if (portableRaw) {
        const seatRes = await fetch("/api/invite/accept-seat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invite: portableRaw,
            password: password.trim(),
            fullName: fullName.trim() || found.invite.name,
          }),
        });
        const seatJson = (await seatRes.json()) as {
          error?: string;
          cloud?: boolean;
        };
        if (!seatRes.ok) {
          setError(seatJson.error || "Could not create your Cloud seat.");
          return;
        }
        cloudSeat = Boolean(seatJson.cloud);
      }
      const accepted = acceptOrgInvite({
        token: localToken,
        orgId: found.org.id,
        fullName: fullName.trim() || found.invite.name,
      });
      if (!accepted.ok) {
        setError(accepted.error);
        return;
      }
      applyOrgInviteeSession({
        orgId: accepted.org.id,
        email: accepted.member.email,
        name: accepted.member.name,
        role: accepted.member.role,
        deskTier: accepted.member.deskTier,
        planId: accepted.org.planId,
        mode: cloudSeat ? "live" : "trial",
      });
      if (portableRaw) {
        void fetch("/api/invite/respond", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invite: portableRaw,
            decision: "accepted",
          }),
        });
      }
      router.replace("/app/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (portableRaw && !hydrated && !portableError) {
    return (
      <p className="mt-6 text-sm text-tl-ink-muted">Opening your invite…</p>
    );
  }

  if (portableError) {
    return (
      <p
        className="rounded-md border border-tl-danger/40 bg-tl-surface px-3 py-2 text-sm text-tl-danger"
        role="alert"
      >
        {portableError}
      </p>
    );
  }

  if (!localToken) {
    return (
      <p
        className="rounded-md border border-tl-danger/40 bg-tl-surface px-3 py-2 text-sm text-tl-danger"
        role="alert"
      >
        Missing invite token. Open the link from your invitation email.
      </p>
    );
  }

  if (!found) {
    return (
      <p
        className="rounded-md border border-tl-danger/40 bg-tl-surface px-3 py-2 text-sm text-tl-danger"
        role="alert"
      >
        This invite is invalid or was created on another browser without an email
        link. Ask your Plan Owner to resend from Settings → Team / Seats (email
        invite works on any device).
      </p>
    );
  }

  const { org, invite } = found;

  if (invite.status === "accepted") {
    return (
      <p className="text-sm text-tl-ink-muted">
        This invite was already accepted.{" "}
        <Link href="/login" className="text-tl-trust-ink underline">
          Sign in
        </Link>{" "}
        to continue.
      </p>
    );
  }

  if (invite.status === "revoked") {
    return (
      <p
        className="rounded-md border border-tl-danger/40 bg-tl-surface px-3 py-2 text-sm text-tl-danger"
        role="alert"
      >
        This invite was revoked by the Plan Owner.
      </p>
    );
  }

  if (invite.status === "rejected") {
    return (
      <p className="text-sm text-tl-ink-muted">
        You declined this invite. Ask your Plan Owner if you need a new one.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
    >
      <p className="text-sm text-tl-ink-muted">
        Joining <strong className="text-tl-ink">{org.name}</strong> as{" "}
        <strong className="text-tl-ink">
          {DESK_TIER_LABELS[invite.deskTier]}
        </strong>{" "}
        ({invite.role}). Your Plan Owner sets seats and desk exposure.
      </p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Work email</span>
        <input
          type="email"
          value={invite.email}
          readOnly
          className="w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Full name</span>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          placeholder={invite.name}
          className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium">Choose a password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-tl-ink-muted">
          If this organisation is on TrustLedger Cloud, this password is your
          Cloud login at /login/live. Trial workspaces stay in this browser.
        </span>
      </label>
      {error ? (
        <p className="text-sm text-tl-danger" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {busy ? "Joining…" : "Accept invite"}
        </button>
        {portableRaw ? (
          <Link
            href={`/invite/reject?invite=${encodeURIComponent(portableRaw)}`}
            className="flex-1 rounded-md border border-tl-line bg-tl-paper px-4 py-2 text-center text-sm font-medium hover:border-tl-trust/40"
          >
            Decline
          </Link>
        ) : null}
      </div>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-2 font-display text-2xl font-semibold">
        Accept team invite
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Join your organisation’s workspace. Your Plan Owner controls seats and
        which desk you see.
      </p>
      <Suspense
        fallback={
          <p className="mt-6 text-sm text-tl-ink-muted">Loading invite…</p>
        }
      >
        <AcceptInviteForm />
      </Suspense>
      <p className="mt-6 text-sm text-tl-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-tl-trust-ink underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
