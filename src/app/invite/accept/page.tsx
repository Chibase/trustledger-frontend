"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { DESK_TIER_LABELS } from "@/types/deskTier";
import { acceptOrgInvite, findInviteByTokenAnywhere } from "@/lib/orgStore";
import { applyOrgInviteeSession } from "@/lib/orgSession";

function AcceptInviteForm() {
  const router = useRouter();
  const search = useSearchParams();
  const token = (search.get("token") ?? "").trim();
  const orgId = (search.get("org") ?? "").trim() || null;
  const found = useMemo(
    () => (token ? findInviteByTokenAnywhere(token, orgId) : null),
    [token, orgId],
  );

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!token || !found) {
      setError("Invite link is missing or invalid.");
      return;
    }
    if (password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const accepted = acceptOrgInvite({
        token,
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
        mode: "demo",
      });
      // Demo only: password is not persisted until Frappe User SoT (T5).
      router.replace("/app/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="rounded-md border border-tl-danger/40 bg-tl-surface px-3 py-2 text-sm text-tl-danger" role="alert">
        Missing invite token. Open the link from your Plan Owner’s invitation.
      </p>
    );
  }

  if (!found) {
    return (
      <p className="rounded-md border border-tl-danger/40 bg-tl-surface px-3 py-2 text-sm text-tl-danger" role="alert">
        This invite is invalid or was created on another browser. Ask your Plan
        Owner to resend from Settings → Team / Seats on the same device (demo
        tenancy).
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
      <p className="rounded-md border border-tl-danger/40 bg-tl-surface px-3 py-2 text-sm text-tl-danger" role="alert">
        This invite was revoked by the Plan Owner.
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
        <strong className="text-tl-ink">{DESK_TIER_LABELS[invite.deskTier]}</strong>{" "}
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
          Demo session only — credentials sync to TrustLedger Cloud when Owner
          issuance is unlocked.
        </span>
      </label>
      {error ? (
        <p className="text-sm text-tl-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
      >
        {busy ? "Joining…" : "Accept invite"}
      </button>
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
