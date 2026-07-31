"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";

/**
 * OD-4 — Ops Finance helper for trial-end + monthly recurring charge-due.
 */
export function ChargeDuePanel() {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");

  async function run(dryRun: boolean) {
    setBusy(true);
    setResult("");
    try {
      const res = await fetch("/api/cron/charge-due", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const json = (await res.json()) as {
        error?: string;
        message?: string;
      };
      if (!res.ok) {
        pushToast(json.error || "Charge-due failed", "error");
        setResult(JSON.stringify(json, null, 2));
        return;
      }
      pushToast(json.message || "Done", "success");
      setResult(JSON.stringify(json, null, 2));
    } catch {
      pushToast("Network error", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
      <h2 className="font-display text-lg font-semibold">
        Recurring charge due (OD-4)
      </h2>
      <p className="mt-1 text-sm text-tl-ink-muted">
        Lists Customers (trial, active, or past_due) with{" "}
        <code className="font-mono">custom_bill_at</code> due and a stored
        Paystack authorization. Success →{" "}
        <code className="font-mono">active</code> and{" "}
        <code className="font-mono">bill_at</code> advanced one month; failure →{" "}
        <code className="font-mono">past_due</code> (daily cron retries). Cron:{" "}
        <code className="font-mono">GET /api/cron/charge-due</code> with{" "}
        <code className="font-mono">CRON_SECRET</code>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(true)}
          className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-50"
        >
          Dry-run due list
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(false)}
          className="rounded-md border border-tl-amber/50 bg-tl-amber/10 px-3 py-2 text-sm font-medium hover:bg-tl-amber/20 disabled:opacity-50"
        >
          Charge due now
        </button>
      </div>
      {result ? (
        <pre className="mt-3 max-h-64 overflow-auto rounded-md border border-tl-line bg-tl-paper/50 p-3 font-mono text-[11px] text-tl-ink">
          {result}
        </pre>
      ) : null}
    </section>
  );
}
