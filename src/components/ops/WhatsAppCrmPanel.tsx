"use client";

import { useCallback, useState, startTransition } from "react";

type ProbePayload = {
  ok?: boolean;
  error?: string;
  detail?: string;
  apiKeysPresent?: boolean;
  appInstalled?: boolean | null;
  accounts?: Array<{ name: string }>;
  leadSourceWhatsApp?: string;
  views?: Record<string, string>;
  humanOnly?: string[];
  wrote?: boolean;
};

/**
 * WA-1 — probe Frappe WhatsApp + ensure CRM source; log WhatsApp chats as leads.
 */
export function WhatsAppCrmPanel() {
  const [data, setData] = useState<ProbePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"probe" | "ensure" | "lead" | null>(null);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [leadResult, setLeadResult] = useState<string | null>(null);

  const run = useCallback(async (mode: "probe" | "ensure") => {
    setBusy(mode);
    setError(null);
    try {
      const res = await fetch("/api/frappe/ensure-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "probe" ? { probe: true } : { dryRun: false },
        ),
      });
      const json = (await res.json()) as ProbePayload;
      if (!res.ok && json.error) throw new Error(json.error);
      if (!res.ok && !json.apiKeysPresent) {
        throw new Error(json.detail || `HTTP ${res.status}`);
      }
      startTransition(() => setData(json));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(null);
    }
  }, []);

  const createLead = useCallback(async () => {
    setBusy("lead");
    setError(null);
    setLeadResult(null);
    try {
      const res = await fetch("/api/frappe/ensure-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createLead: {
            name: name.trim(),
            mobile: mobile.trim(),
            email: email.trim() || undefined,
            message: message.trim() || undefined,
          },
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        detail?: string;
        error?: string;
      };
      if (!res.ok || !json.ok) {
        throw new Error(json.error || json.detail || `HTTP ${res.status}`);
      }
      setLeadResult(json.detail || "Lead created");
      setName("");
      setMobile("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create lead");
    } finally {
      setBusy(null);
    }
  }, [name, mobile, email, message]);

  return (
    <section className="rounded-lg border border-tl-line bg-tl-paper p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold text-tl-ink">
            WhatsApp CRM (WA-1)
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-tl-ink-muted">
            Chat runs on Desk via Frappe WhatsApp + Meta. This panel probes the
            Cloud app, ensures Lead Source “WhatsApp”, and lets you log a chat as
            a CRM Lead (with mobile) until webhooks are live.
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
            onClick={() => void run("ensure")}
            className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
          >
            {busy === "ensure" ? "Saving…" : "Ensure WhatsApp source"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-md border border-tl-danger/40 bg-tl-danger/10 px-3 py-2 text-sm text-tl-danger">
          {error}
        </p>
      ) : null}

      {data ? (
        <div className="mt-4 space-y-3 text-sm text-tl-ink">
          <ul className="space-y-1">
            <li>
              API keys:{" "}
              {data.apiKeysPresent ? (
                <span className="text-tl-trust-ink">present</span>
              ) : (
                <span className="text-tl-danger">missing</span>
              )}
            </li>
            <li>
              Frappe WhatsApp app:{" "}
              {data.appInstalled === true
                ? "installed"
                : data.appInstalled === false
                  ? "not detected"
                  : "unknown"}
            </li>
            <li>
              WhatsApp accounts / settings:{" "}
              {data.accounts && data.accounts.length
                ? data.accounts.map((a) => a.name).join(", ")
                : "none found — configure in Desk"}
            </li>
            <li>Lead source WhatsApp: {data.leadSourceWhatsApp}</li>
          </ul>
          {data.humanOnly && data.humanOnly.length > 0 ? (
            <div>
              <p className="font-medium">Still needs you (Meta / Desk)</p>
              <ol className="mt-1 list-decimal space-y-1 pl-5 text-tl-ink-muted">
                {data.humanOnly.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mt-6 border-t border-tl-line pt-4">
        <h3 className="font-medium text-tl-ink">Log WhatsApp chat as lead</h3>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Use when someone messages you on WhatsApp before Meta webhook is
          connected — or to backfill. Put their mobile so Desk chat can match.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
              placeholder="Nombuso M"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Mobile (WhatsApp)</span>
            <input
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
              placeholder="082… or +27…"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">
              Email (optional — holding used if blank)
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
              placeholder="name@company.co.za"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Message / quote</span>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
              placeholder="Paste their WhatsApp message…"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={busy !== null || name.trim().length < 2 || !mobile.trim()}
            onClick={() => void createLead()}
            className="rounded-md border border-tl-trust px-3 py-2 text-sm font-medium text-tl-trust-ink hover:bg-tl-trust/5 disabled:opacity-60"
          >
            {busy === "lead" ? "Creating…" : "Create CRM Lead"}
          </button>
          {leadResult ? (
            <span className="text-sm text-tl-trust-ink">{leadResult}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
