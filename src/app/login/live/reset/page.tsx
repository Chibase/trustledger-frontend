"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LiveResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(
    token ? null : "This reset link is missing. Request a new one from sign-in.",
  );
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use a new password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/auth/live/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Could not update password");
      }
      setDone(true);
      window.setTimeout(() => router.push("/login/live"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-sm font-medium text-tl-trust">Live session</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-tl-ink">
        Set a new password
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Choose a password for this TrustLedger Cloud login, then sign in.
      </p>

      {done ? (
        <p className="mt-6 text-sm text-tl-trust-ink" role="status">
          Password updated. Opening sign-in…
        </p>
      ) : (
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
        >
          <div>
            <label htmlFor="new-password" className="mb-1 block text-sm font-medium">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              minLength={8}
              required
              disabled={!token || pending}
            />
          </div>
          <div>
            <label
              htmlFor="confirm-password"
              className="mb-1 block text-sm font-medium"
            >
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              minLength={8}
              required
              disabled={!token || pending}
            />
          </div>
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={!token || pending}
            className="w-full rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
          >
            {pending ? "Saving…" : "Save password"}
          </button>
        </form>
      )}

      <p className="mt-4 text-xs text-tl-ink-muted">
        <Link href="/login/live" className="text-tl-trust-ink underline">
          Back to sign-in
        </Link>
      </p>
    </main>
  );
}

export default function LiveResetPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
        </main>
      }
    >
      <LiveResetForm />
    </Suspense>
  );
}
