"use client";

import { FormEvent, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { getActiveOrg } from "@/lib/orgStore";

type PasswordAccessPanelProps = {
  isPlanOwner: boolean;
  userEmail: string | null;
  /** Live Cloud session required for password APIs. */
  liveMode: boolean;
};

/**
 * Package Plan Owner: change own Cloud password, or issue a temporary
 * password for themselves / Cloud Users on their Customer.
 */
export function PasswordAccessPanel({
  isPlanOwner,
  userEmail,
  liveMode,
}: PasswordAccessPanelProps) {
  const { pushToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [memberEmail, setMemberEmail] = useState(userEmail || "");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [busyOwn, setBusyOwn] = useState(false);
  const [busyReset, setBusyReset] = useState(false);

  const rosterEmails = useMemo(() => {
    const org = getActiveOrg();
    if (!org) return userEmail ? [userEmail] : [];
    const emails = new Set<string>();
    if (org.ownerEmail) emails.add(org.ownerEmail.toLowerCase());
    for (const m of org.members) {
      if (m.email) emails.add(m.email.toLowerCase());
    }
    for (const inv of org.invites) {
      if (inv.status === "accepted" && inv.email) {
        emails.add(inv.email.toLowerCase());
      }
    }
    if (userEmail) emails.add(userEmail.toLowerCase());
    return [...emails];
  }, [userEmail]);

  if (!isPlanOwner) return null;

  async function onChangeOwn(event: FormEvent) {
    event.preventDefault();
    if (!liveMode) {
      pushToast("Sign in live (/login/live) to change your Cloud password.", "error");
      return;
    }
    if (newPassword.length < 8) {
      pushToast("New password must be at least 8 characters.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      pushToast("New password and confirmation do not match.", "error");
      return;
    }
    setBusyOwn(true);
    setTempPassword(null);
    try {
      const res = await fetch("/api/org/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "change-own",
          currentPassword,
          newPassword,
        }),
      });
      const json = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        pushToast(json.error || "Could not change password", "error");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      pushToast(json.message || "Password updated", "success");
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusyOwn(false);
    }
  }

  async function onResetMember(event: FormEvent) {
    event.preventDefault();
    if (!liveMode) {
      pushToast(
        "Sign in live (/login/live) to issue Cloud passwords for your package.",
        "error",
      );
      return;
    }
    const email = memberEmail.trim().toLowerCase();
    if (!email.includes("@")) {
      pushToast("Choose a valid member email.", "error");
      return;
    }
    setBusyReset(true);
    setTempPassword(null);
    try {
      const res = await fetch("/api/org/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-member",
          email,
          emailCredentials: true,
        }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
        temporaryPassword?: string;
        emailed?: boolean;
      };
      if (!res.ok) {
        pushToast(json.error || "Could not reset password", "error");
        return;
      }
      if (json.temporaryPassword) {
        setTempPassword(json.temporaryPassword);
      }
      pushToast(json.message || "Temporary password set", "success");
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusyReset(false);
    }
  }

  return (
    <section
      id="password-access"
      className="space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4 text-sm"
    >
      <div>
        <h2 className="font-semibold">Passwords</h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          As package Plan Owner you can update your own Cloud password and issue
          a temporary password for Cloud logins on your package (yourself or
          invited Users who already have a TrustLedger Cloud account). Lost
          password? Issue a temp password below, or use Forgot password on{" "}
          <a href="/login/live" className="text-tl-trust-ink underline">
            /login/live
          </a>
          .
        </p>
        {!liveMode ? (
          <p className="mt-2 text-xs text-tl-amber" role="status">
            You are not in a live Cloud session. Open{" "}
            <a href="/login/live" className="underline">
              /login/live
            </a>{" "}
            as Plan Owner to use these controls.
          </p>
        ) : null}
      </div>

      <form onSubmit={onChangeOwn} className="space-y-3 border-t border-tl-line pt-4">
        <h3 className="font-medium">Change my password</h3>
        <label className="block text-xs">
          <span className="mb-1 block font-medium">Current password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="mb-1 block font-medium">New password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="mb-1 block font-medium">Confirm new password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busyOwn || !liveMode}
          className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {busyOwn ? "Updating…" : "Update my password"}
        </button>
      </form>

      <form
        onSubmit={onResetMember}
        className="space-y-3 border-t border-tl-line pt-4"
      >
        <h3 className="font-medium">Issue temporary password</h3>
        <p className="text-xs text-tl-ink-muted">
          Use when you or an invited Cloud user lost access. A one-time
          temporary password is set on TrustLedger Cloud and emailed when Resend
          is configured.
        </p>
        <label className="block text-xs">
          <span className="mb-1 block font-medium">User email</span>
          <input
            list="tl-password-roster"
            type="email"
            required
            value={memberEmail}
            onChange={(e) => setMemberEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
          <datalist id="tl-password-roster">
            {rosterEmails.map((email) => (
              <option key={email} value={email} />
            ))}
          </datalist>
        </label>
        <button
          type="submit"
          disabled={busyReset || !liveMode}
          className="rounded-md border border-tl-line bg-tl-paper px-4 py-2 text-sm font-medium hover:border-tl-trust/40 disabled:opacity-60"
        >
          {busyReset ? "Issuing…" : "Issue temporary password"}
        </button>
        {tempPassword ? (
          <p className="break-all rounded-md border border-tl-line bg-tl-paper px-3 py-2 font-mono text-xs">
            Temporary password (copy now): {tempPassword}
          </p>
        ) : null}
      </form>
    </section>
  );
}
