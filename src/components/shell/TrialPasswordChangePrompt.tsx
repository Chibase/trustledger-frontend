"use client";

import { useEffect, useState } from "react";
import {
  mustChangePassword,
  setMustChangePassword,
} from "@/lib/trialBillingClient";
import {
  readStoredActivationToken,
  writeStoredActivationToken,
} from "@/lib/trialProvisionClient";

/**
 * Prompt after card-verified trial: change temporary password on first use.
 */
export function TrialPasswordChangePrompt() {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setOpen(mustChangePassword());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!open) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    const token = readStoredActivationToken();
    if (!token) {
      setError("Missing activation token. Sign in from your welcome email link.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/trial/login", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          token,
          currentPassword,
          newPassword,
        }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        token?: string;
        error?: string;
      };
      if (!res.ok || !payload.ok || !payload.token) {
        throw new Error(payload.error || "Could not update password");
      }
      writeStoredActivationToken(payload.token);
      setMustChangePassword(false);
      setDone(true);
      setTimeout(() => setOpen(false), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-labelledby="trial-password-title"
        className="w-full max-w-md rounded-lg border border-tl-line bg-tl-paper p-5 shadow-lg"
      >
        <h2
          id="trial-password-title"
          className="font-display text-xl font-semibold text-tl-ink"
        >
          Change your temporary password
        </h2>
        <p className="mt-2 text-sm text-tl-ink-muted">
          For security, replace the password from your welcome email before you
          continue.
        </p>
        {done ? (
          <p className="mt-4 text-sm font-medium text-tl-trust">Password updated.</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="cur-pass" className="mb-1 block text-sm font-medium">
                Temporary password
              </label>
              <input
                id="cur-pass"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label htmlFor="new-pass" className="mb-1 block text-sm font-medium">
                New password
              </label>
              <input
                id="new-pass"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label htmlFor="confirm-pass" className="mb-1 block text-sm font-medium">
                Confirm new password
              </label>
              <input
                id="confirm-pass"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            {error ? (
              <p className="text-sm text-tl-danger" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save new password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMustChangePassword(false);
                  setOpen(false);
                }}
                className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium text-tl-ink hover:bg-tl-surface"
              >
                Later
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
