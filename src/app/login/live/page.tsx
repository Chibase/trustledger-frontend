"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function sanitizeNext(value: string | null): string {
  if (
    value &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    (value.startsWith("/app") || value.startsWith("/ops"))
  ) {
    return value;
  }
  // Operators home to Executive Board; customers use /app.
  return "/ops/executive";
}

function gateErrorCopy(code: string | null): string | null {
  if (code === "lockdown_misconfigured") {
    return "Live access is locked to the Platform Operator, but the allowlist is not configured on the server.";
  }
  if (code === "not_operator") {
    return "Live access is limited to the Platform Operator. Customer and staff logins are paused until lockdown is lifted.";
  }
  return null;
}

function LiveLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const gateError = gateErrorCopy(searchParams.get("error"));
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState<string | null>(gateError);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/auth/live/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ usr, pwd }),
      });
      const payload = (await response.json()) as {
        error?: string;
        role?: string;
        home?: string;
        platformOperator?: boolean;
      };
      if (!response.ok) {
        throw new Error(payload.error || "Login failed");
      }
      // Clear any leftover demo-mode cookie from a prior /demo visit
      document.cookie = "tl-mode=live; path=/; max-age=604800; samesite=lax";
      // Server decides operator home (/ops/executive). Never fall to customer desk.
      const dest =
        payload.home ||
        (payload.platformOperator ? "/ops/executive" : null) ||
        (next.startsWith("/ops") || next.startsWith("/app")
          ? next
          : "/ops/executive");
      router.push(dest);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <p className="text-sm font-medium text-tl-trust">Live session</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-tl-ink">
        Sign in with TrustLedger
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Use your TrustLedger Cloud email and password (Administrator or System
        Manager for admin). This opens the live product, not the sample demo.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-4"
      >
        <div>
          <label htmlFor="usr" className="mb-1 block text-sm font-medium">
            Email / User
          </label>
          <input
            id="usr"
            type="text"
            autoComplete="username"
            value={usr}
            onChange={(e) => setUsr(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="pwd" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="pwd"
            type="password"
            autoComplete="current-password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
      <p className="mt-4 text-xs text-tl-ink-muted">
        Want sample data only?{" "}
        <Link href="/demo" className="text-tl-trust-ink underline">
          Open the demo
        </Link>
        .
      </p>
    </main>
  );
}

export default function LiveLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Sign in</h1>
        </main>
      }
    >
      <LiveLoginForm />
    </Suspense>
  );
}
