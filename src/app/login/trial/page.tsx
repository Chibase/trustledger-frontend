"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isPlanId } from "@/config/plans";
import {
  clearTrialWorkspaceData,
  startTrialCookies,
} from "@/lib/trial";
import { ensureTrialSeedProject } from "@/lib/trialStore";
import {
  setMustChangePassword,
  writeTrialBilling,
} from "@/lib/trialBillingClient";
import {
  readStoredActivationToken,
  writeStoredActivationToken,
} from "@/lib/trialProvisionClient";

export default function TrialLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const stored = readStoredActivationToken();
    if (stored) setToken(stored);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const activation = token.trim() || readStoredActivationToken() || "";
      if (!activation) {
        throw new Error(
          "Missing activation token. Open the link from your welcome email, or complete Subscribe again.",
        );
      }
      const res = await fetch("/api/trial/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email,
          password,
          token: activation,
        }),
      });
      const payload = (await res.json()) as {
        ok?: boolean;
        error?: string;
        email?: string;
        name?: string;
        planId?: string;
        organization?: string | null;
        startedAt?: string;
        billAt?: string;
        reference?: string;
        token?: string;
      };
      if (!res.ok || !payload.ok || !payload.planId || !isPlanId(payload.planId)) {
        throw new Error(payload.error || "Sign-in failed");
      }

      clearTrialWorkspaceData();
      startTrialCookies({
        email: payload.email || email,
        name: payload.name || email,
        planId: payload.planId,
        startedAt: payload.startedAt ? new Date(payload.startedAt) : undefined,
        organization: payload.organization || undefined,
      });
      ensureTrialSeedProject();
      if (payload.organization) {
        window.localStorage.setItem("tl-trial-org", payload.organization);
      }
      window.localStorage.setItem(
        "tl-lead-email",
        (payload.email || email).toLowerCase(),
      );
      if (payload.token) writeStoredActivationToken(payload.token);
      writeTrialBilling({
        email: payload.email || email,
        name: payload.name || email,
        planId: payload.planId,
        organization: payload.organization || undefined,
        reference: payload.reference || "login",
        billAt: payload.billAt || new Date().toISOString(),
        status: "scheduled",
        activatedAt: new Date().toISOString(),
      });
      setMustChangePassword(true);
      router.replace("/app/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">Trial sign-in</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Sign in to TrustLedger
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Use the work email and temporary password from your welcome note. You
        will be asked to change the password on first use.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
      >
        <div>
          <label htmlFor="trial-login-email" className="mb-1 block text-sm font-medium">
            Work email
          </label>
          <input
            id="trial-login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="trial-login-password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="trial-login-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label htmlFor="trial-login-token" className="mb-1 block text-sm font-medium">
            Activation token{" "}
            <span className="font-normal text-tl-ink-muted">
              (from email link — filled automatically on this device)
            </span>
          </label>
          <textarea
            id="trial-login-token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-tl-line px-3 py-2 font-mono text-xs"
          />
        </div>
        {error ? (
          <p className="text-sm text-tl-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-xs text-tl-ink-muted">
        New here?{" "}
        <Link href="/pay" className="font-medium text-tl-trust-ink underline">
          Subscribe to start a trial
        </Link>
      </p>
    </main>
  );
}
