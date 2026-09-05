"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import type { LeadSmokeSnapshot } from "@/lib/leadSmoke";

type WriteResult = {
  ok: boolean;
  backend?: string;
  status?: number;
  detail?: string;
  email?: string;
  jobTitle?: string;
};

/**
 * P3 — HS-2 inventory + CRM Lead smoke, and EM-1 Desk remaining steps.
 * Not buyer-desk work. HS-3/HS-4 HubSpot teardown stays deferred.
 */
export function AcquisitionOpsPanel() {
  const { pushToast } = useToast();
  const [busy, setBusy] = useState<"load" | "write" | null>(null);
  const [smoke, setSmoke] = useState<LeadSmokeSnapshot | null>(null);
  const [write, setWrite] = useState<WriteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setBusy("load");
    setError(null);
    try {
      const res = await fetch("/api/ops/lead-smoke", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const json = (await res.json()) as {
        error?: string;
        smoke?: LeadSmokeSnapshot;
      };
      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      if (!json.smoke) {
        throw new Error("No acquisition snapshot");
      }
      setSmoke(json.smoke);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not load HS-2 inventory.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setBusy(null);
    }
  }

  async function writeSmokeLead() {
    setBusy("write");
    setError(null);
    try {
      const res = await fetch("/api/ops/lead-smoke", {
        method: "POST",
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const json = (await res.json()) as {
        error?: string;
        smoke?: LeadSmokeSnapshot;
        write?: WriteResult;
      };
      if (json.smoke) setSmoke(json.smoke);
      if (!res.ok && !json.write) {
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      if (!json.write) {
        throw new Error("No smoke write result");
      }
      setWrite(json.write);
      pushToast(
        json.write.ok
          ? "CRM Lead smoke wrote. Confirm the row in Desk."
          : json.write.detail || "CRM Lead smoke failed.",
        json.write.ok ? "success" : "error",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "HS-2 smoke write failed.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setBusy(null);
    }
  }

  const backend = smoke?.leadBackend;
  const cutover = backend?.cutoverComplete === true;

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-5">
      <h2 className="font-display text-lg font-semibold text-tl-ink">
        Acquisition / ops (HS-2 + EM-1)
      </h2>
      <p className="mt-1 text-sm text-tl-ink-muted">
        Parallel track — not the buyer desk. In-repo: form inventory and one
        CRM Lead writer check. Still operator sitting: Production{" "}
        <code className="font-mono text-xs text-tl-ink">LEAD_BACKEND=frappe</code>
        , click each public form once, Webway CTAs, Desk SMTP. HubSpot teardown
        (HS-3/HS-4) stays deferred.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void load()}
          className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-semibold text-tl-ink hover:bg-tl-paper disabled:opacity-60"
        >
          {busy === "load" ? "Loading…" : smoke ? "Refresh inventory" : "Load inventory"}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => void writeSmokeLead()}
          className="rounded-md bg-tl-trust px-3 py-1.5 text-xs font-semibold text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {busy === "write" ? "Writing…" : "Write HS-2 smoke lead"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-tl-danger">{error}</p>
      ) : null}

      {backend ? (
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3 rounded-md border border-tl-line px-3 py-2">
            <dt className="text-tl-ink-muted">Lead backend</dt>
            <dd className={cutover ? "font-semibold text-tl-trust-ink" : "font-semibold text-tl-danger"}>
              {backend.preference}
              {backend.envExplicit ? " (explicit)" : " (default)"}
            </dd>
          </div>
          <div className="flex justify-between gap-3 rounded-md border border-tl-line px-3 py-2">
            <dt className="text-tl-ink-muted">Cutover</dt>
            <dd>{cutover ? "Frappe-only writes" : "not complete"}</dd>
          </div>
          <div className="flex justify-between gap-3 rounded-md border border-tl-line px-3 py-2">
            <dt className="text-tl-ink-muted">Cloud keys</dt>
            <dd>{backend.frappeConfigured ? "set" : "missing"}</dd>
          </div>
          <div className="flex justify-between gap-3 rounded-md border border-tl-line px-3 py-2">
            <dt className="text-tl-ink-muted">HubSpot fallback</dt>
            <dd>{backend.hubspotFallbackActive ? "on (emergency)" : "off"}</dd>
          </div>
        </dl>
      ) : null}

      {write ? (
        <p
          className={`mt-3 text-sm ${write.ok ? "text-tl-trust-ink" : "text-tl-danger"}`}
        >
          Smoke write {write.ok ? "ok" : "failed"} · {write.backend}
          {write.status != null ? ` · HTTP ${write.status}` : ""}
          {write.email ? ` · ${write.email}` : ""}
          {write.jobTitle ? ` · ${write.jobTitle}` : ""}
          {write.detail ? ` — ${write.detail}` : ""}
        </p>
      ) : null}

      {smoke ? (
        <>
          <h3 className="mt-5 font-display text-sm font-semibold text-tl-ink">
            HS-2 public forms (operator click still required)
          </h3>
          <ul className="mt-2 divide-y divide-tl-line rounded-md border border-tl-line text-sm">
            {smoke.smokeRequired.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2"
              >
                <span>
                  {row.label}{" "}
                  <code className="font-mono text-xs text-tl-ink-muted">
                    {row.path}
                  </code>
                </span>
                <span className="font-mono text-xs text-tl-ink-muted">
                  {row.crmSource}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-tl-ink-muted">
            Full inventory {smoke.inventory.length} routes · Webway sitting{" "}
            <code className="font-mono">{smoke.webway}</code>
          </p>

          <h3 className="mt-5 font-display text-sm font-semibold text-tl-ink">
            EM-1 branded bulk email (Desk remaining)
          </h3>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Templates live in{" "}
            <code className="font-mono text-xs">{smoke.em1.templates}</code>.
            From {smoke.em1.from}. Runbook{" "}
            <code className="font-mono text-xs">{smoke.em1.runbook}</code>.
            This panel does not send Newsletter blasts.
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-tl-ink">
            {smoke.em1.remaining.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-tl-ink-muted">{smoke.hs34.note}</p>
        </>
      ) : null}
    </section>
  );
}
