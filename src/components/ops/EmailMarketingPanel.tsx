"use client";

import { useCallback, useState, startTransition } from "react";

type ProbePayload = {
  ok?: boolean;
  error?: string;
  detail?: string;
  apiKeysPresent?: boolean;
  emailDeliveryServiceInstalled?: boolean | null;
  salesAccountReady?: boolean;
  emailAccounts?: Array<{
    name: string;
    emailId: string;
    enableOutgoing: boolean;
    defaultOutgoing: boolean;
  }>;
  templates?: Record<string, string>;
  groups?: Record<string, string>;
  humanOnly?: string[];
  wrote?: boolean;
  dryRun?: boolean;
};

/**
 * EM-1 — operator tools to probe Desk email readiness and push HTML templates.
 */
export function EmailMarketingPanel() {
  const [data, setData] = useState<ProbePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"probe" | "apply" | null>(null);

  const run = useCallback(async (mode: "probe" | "apply") => {
    setBusy(mode);
    setError(null);
    try {
      const res = await fetch("/api/frappe/ensure-email-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "probe" ? { probe: true } : { dryRun: false },
        ),
      });
      const json = (await res.json()) as ProbePayload;
      if (!res.ok && !json.apiKeysPresent) {
        throw new Error(json.error || json.detail || `HTTP ${res.status}`);
      }
      if (!res.ok && json.error) {
        throw new Error(json.error);
      }
      startTransition(() => setData(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }, []);

  return (
    <section className="rounded-lg border border-tl-line bg-tl-paper p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-tl-ink">
            Bulk email marketing (EM-1)
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-tl-ink-muted">
            Pushes TrustLedger HTML templates and empty Email Groups to Cloud.
            Does not uninstall apps, set mailbox passwords, or send campaigns —
            those stay on your Desk / Cloud checklist.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("probe")}
            className="rounded-md border border-tl-line px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-surface disabled:opacity-60"
          >
            {busy === "probe" ? "Probing…" : "Probe Desk"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => void run("apply")}
            className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
          >
            {busy === "apply" ? "Applying…" : "Push templates"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-tl-danger/40 bg-tl-danger/10 px-3 py-2 text-sm text-tl-danger">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="mt-4 space-y-4 text-sm">
          <ul className="space-y-1 text-tl-ink">
            <li>
              API keys:{" "}
              {data.apiKeysPresent ? (
                <span className="text-tl-trust-ink">present</span>
              ) : (
                <span className="text-tl-danger">missing on this deploy</span>
              )}
            </li>
            <li>
              Email Delivery Service:{" "}
              {data.emailDeliveryServiceInstalled === true
                ? "installed (uninstall on Cloud)"
                : data.emailDeliveryServiceInstalled === false
                  ? "not detected"
                  : "unknown"}
            </li>
            <li>
              sales@ outgoing:{" "}
              {data.salesAccountReady ? "ready" : "not ready / not found"}
            </li>
          </ul>

          {data.emailAccounts && data.emailAccounts.length > 0 ? (
            <div>
              <p className="font-medium text-tl-ink">Email accounts</p>
              <ul className="mt-1 list-inside list-disc text-tl-ink-muted">
                {data.emailAccounts.map((a) => (
                  <li key={a.name}>
                    {a.emailId || a.name}
                    {a.enableOutgoing ? " · outgoing" : ""}
                    {a.defaultOutgoing ? " · default" : ""}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.templates ? (
            <div>
              <p className="font-medium text-tl-ink">Templates</p>
              <ul className="mt-1 list-inside list-disc text-tl-ink-muted">
                {Object.entries(data.templates).map(([name, status]) => (
                  <li key={name}>
                    {name}: {status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.groups ? (
            <div>
              <p className="font-medium text-tl-ink">Email groups</p>
              <ul className="mt-1 list-inside list-disc text-tl-ink-muted">
                {Object.entries(data.groups).map(([name, status]) => (
                  <li key={name}>
                    {name}: {status}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {data.humanOnly && data.humanOnly.length > 0 ? (
            <div>
              <p className="font-medium text-tl-ink">Still needs you</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-tl-ink-muted">
                {data.humanOnly.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
