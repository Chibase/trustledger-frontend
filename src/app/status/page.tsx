"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type HealthSnapshot = {
  ok: boolean;
  checkedAt: string;
  checks: { label: string; ok: boolean; status?: number; ms: number }[];
};

export default function StatusPage() {
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: HealthSnapshot) => setHealth(data))
      .catch(() => setError("Could not load status."));
  }, []);

  return (
    <main className="mx-auto max-w-lg px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-2 font-display text-3xl font-semibold">System status</h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Live checks for the product app and TrustLedger Cloud backend.
      </p>

      {error ? <p className="mt-6 text-sm text-tl-danger">{error}</p> : null}

      {health ? (
        <div className="mt-8 space-y-3">
          <p
            className={`text-sm font-semibold ${health.ok ? "text-tl-trust-ink" : "text-tl-danger"}`}
          >
            {health.ok ? "All systems operational" : "Degraded / partial outage"}
          </p>
          <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
            {health.checks.map((c) => (
              <li
                key={c.label}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="font-medium">{c.label}</span>
                <span className={c.ok ? "text-tl-trust-ink" : "text-tl-danger"}>
                  {c.ok ? "Operational" : "Unavailable"}
                  {typeof c.status === "number" ? ` (${c.status})` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-tl-ink-muted">
            Checked {new Date(health.checkedAt).toLocaleString()}
          </p>
        </div>
      ) : !error ? (
        <p className="mt-8 text-sm text-tl-ink-muted">Checking…</p>
      ) : null}

      <p className="mt-8 text-sm">
        <Link href="/demo" className="font-medium text-tl-trust-ink underline">
          Back to demo
        </Link>
        {" · "}
        <Link href="/login/live" className="font-medium text-tl-trust-ink underline">
          Live sign-in
        </Link>
      </p>
    </main>
  );
}
