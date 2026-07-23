"use client";

import { useCallback, useState, startTransition } from "react";
import Link from "next/link";
import type { OperationalStepId } from "@/lib/operationalDelivery.constants";
import {
  OPERATIONAL_STEP1_REQUIRED_LABELS,
  OPERATIONAL_STEPS,
} from "@/lib/operationalDelivery.constants";

export type ReadinessPayload = {
  ok: boolean;
  generatedAt: string;
  activeStepId: OperationalStepId;
  summary: string;
  steps: Array<{
    id: OperationalStepId;
    title: string;
    status: "done" | "active" | "blocked";
    summary: string;
  }>;
  gateChecks: Array<{
    id: string;
    label: string;
    required: boolean;
    pass: boolean;
    detail: string;
  }>;
  blockedReasons: string[];
  goLiveReady: boolean;
  deskChecklist: string[];
  deploySha?: string | null;
  launchHardening?: {
    ready: boolean;
    missing: string[];
  };
};

const STATUS_CLASS: Record<"done" | "active" | "blocked", string> = {
  done: "border-tl-trust/40 bg-tl-trust/10 text-tl-trust-ink",
  active: "border-tl-amber/50 bg-tl-amber/10 text-tl-ink",
  blocked: "border-tl-line bg-tl-surface text-tl-ink-muted",
};

type Props = {
  initial: ReadinessPayload;
};

export function OperationalReadinessPanel({ initial }: Props) {
  const [data, setData] = useState<ReadinessPayload>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ops/readiness", { cache: "no-store" });
      const json = (await res.json()) as ReadinessPayload & { error?: string };
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      startTransition(() => {
        setData(json);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load readiness.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm font-medium text-tl-trust">Operational delivery</p>
        <h1 className="font-display text-3xl font-semibold text-tl-ink">
          Path to the real product
        </h1>
        <p className="max-w-3xl text-sm leading-relaxed text-tl-ink-muted">
          Paid customers stay on soft launch until Cloud is the system of record.
          Complete each step in order. Do not lift{" "}
          <code className="rounded bg-tl-surface px-1 text-tl-ink">
            PLATFORM_OPERATOR_ONLY
          </code>{" "}
          until Step 4.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-tl-ink-muted">Refreshing environment…</p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-tl-danger/40 bg-tl-danger/10 px-4 py-3 text-sm text-tl-danger">
          {error}
        </p>
      ) : null}

      <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
              Active step
            </p>
            <p className="mt-1 font-display text-xl font-semibold text-tl-ink">
              {OPERATIONAL_STEPS.find((s) => s.id === data.activeStepId)?.title}
            </p>
            <p className="mt-1 text-sm text-tl-ink-muted">{data.summary}</p>
            <p className="mt-1 text-xs text-tl-ink-muted">
              Checked {new Date(data.generatedAt).toLocaleString()}
              {data.deploySha ? ` · deploy ${data.deploySha}` : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span
              className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                data.goLiveReady
                  ? "border-tl-trust/40 bg-tl-trust/10 text-tl-trust-ink"
                  : "border-tl-amber/40 bg-tl-amber/10 text-tl-ink"
              }`}
            >
              {data.goLiveReady
                ? "GO LIVE ready"
                : data.blockedReasons.length > 0
                  ? "GO LIVE blocked — fix gates"
                  : "GO LIVE in progress"}
            </span>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-md border border-tl-line px-3 py-1 text-xs font-semibold text-tl-ink hover:bg-tl-paper"
            >
              Refresh
            </button>
          </div>
        </div>
        {data.blockedReasons.length > 0 ? (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-tl-danger">
            {data.blockedReasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        {data.launchHardening ? (
          <div
            className={`mt-4 rounded-md border px-3 py-2 text-sm ${
              data.launchHardening.ready
                ? "border-tl-trust/40 bg-tl-trust/10 text-tl-trust-ink"
                : "border-tl-amber/40 bg-tl-amber/10 text-tl-ink"
            }`}
          >
            <p className="font-semibold">
              {data.launchHardening.ready
                ? "First-days hardening green"
                : "First-days hardening — set remaining env"}
            </p>
            {!data.launchHardening.ready ? (
              <ul className="mt-1 list-disc pl-5 text-xs">
                {data.launchHardening.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs">
                Auto-provision, cron secret, Resend, and reCAPTCHA are configured.
              </p>
            )}
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          Delivery ladder
        </h2>
        <ol className="space-y-3">
          {data.steps.map((step, index) => (
            <li
              key={step.id}
              className={`rounded-lg border px-4 py-3 ${STATUS_CLASS[step.status]}`}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">
                  {index + 1}. {step.title}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wide">
                  {step.status}
                </span>
              </div>
              <p className="mt-1 text-sm opacity-90">{step.summary}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
          <h2 className="font-display text-lg font-semibold text-tl-ink">
            {data.activeStepId === "go"
              ? "GO LIVE — operational grade"
              : data.activeStepId === "5"
              ? "Step 5 — V002 depth"
              : data.activeStepId === "4"
              ? "Step 4 — Billing + lift lockdown (you)"
              : data.activeStepId === "3"
              ? "Step 3 — Sync + auto-provision (you)"
              : data.activeStepId === "2"
                ? "Step 2 — DocTypes + File (you)"
                : "Step 1 — Desk checklist (you)"}
          </h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-tl-ink-muted">
            {data.deskChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <p className="mt-4 text-sm text-tl-ink">
            {data.activeStepId === "go" ? (
              data.goLiveReady ? (
                <>
                  GO LIVE gates are green. Treat TrustLedger as operational-grade
                  for paying customers. Keep{" "}
                  <code className="text-xs">/demo</code> separate from live
                  workspaces.
                </>
              ) : (
                <>
                  Steps 1–5 are Done. Clear any failed Environment gates (and
                  buyer lockdown if still ON), then Refresh. Keep{" "}
                  <code className="text-xs">/demo</code> separate.
                </>
              )
            ) : data.activeStepId === "5" ? (
              <>
                When engagements → commitments → grievance → ESG are
                market-honest, reply: <strong>Step 5 complete</strong> — then GO
                LIVE criteria.
              </>
            ) : data.activeStepId === "4" ? (
              <>
                After charge-due smoke and buyer live login with lockdown off,
                reply: <strong>Step 4 complete</strong>.
              </>
            ) : data.activeStepId === "3" ? (
              <>
                When Paystack creates Customer+User without Ops click, reply:{" "}
                <strong>Step 3 complete</strong>.
              </>
            ) : data.activeStepId === "2" ? (
              <>
                When DocTypes + one Project/Incident/Evidence+file smoke pass,
                reply in chat: <strong>Step 2 complete</strong>.
              </>
            ) : (
              <>
                When smoke passes, reply in chat:{" "}
                <strong>Step 1 complete</strong> — then we open Step 2 (DocTypes
                + File).
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/ops/accounts"
              className="rounded-md bg-tl-trust px-4 py-2 text-xs font-semibold text-white hover:bg-tl-trust-ink"
            >
              Open provision console
            </Link>
            <Link
              href="/ops"
              className="rounded-md border border-tl-line px-4 py-2 text-xs font-semibold text-tl-ink hover:bg-tl-paper"
            >
              Ops overview
            </Link>
          </div>
          <p className="mt-3 text-xs text-tl-ink-muted">
            Full runbook:{" "}
            <code className="text-tl-ink">docs/OPERATIONAL_DELIVERY.md</code>
          </p>
        </div>

        <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
          <h2 className="font-display text-lg font-semibold text-tl-ink">
            Environment gates
          </h2>
          <ul className="mt-3 space-y-2">
            {data.gateChecks.map((check) => (
              <li
                key={check.id}
                className="flex items-start justify-between gap-3 rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-tl-ink">{check.label}</p>
                  <p className="text-xs text-tl-ink-muted">{check.detail}</p>
                </div>
                <span
                  className={`shrink-0 text-xs font-bold uppercase ${
                    check.pass ? "text-tl-trust-ink" : "text-tl-danger"
                  }`}
                >
                  {check.pass ? "pass" : "fail"}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-tl-ink-muted">
            Required for Step 1 smoke:{" "}
            {OPERATIONAL_STEP1_REQUIRED_LABELS.join(", ")}.
          </p>
        </div>
      </section>
    </div>
  );
}
