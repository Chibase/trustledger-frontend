"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HoneypotField, useRecaptcha } from "@/components/forms/FormGuards";
import { formatUtmSummary, readUtm } from "@/lib/utm";

const STORAGE_KEY = "tl-demo-actions";
const THRESHOLD = 3;

function readCount(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export function trackDemoAction() {
  if (typeof window === "undefined") return;
  const next = readCount() + 1;
  window.localStorage.setItem(STORAGE_KEY, String(next));
  window.dispatchEvent(new Event("tl-demo-action"));
}

export function DemoLeadGate() {
  const { getToken } = useRecaptcha("demo_soft_gate");
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [utmLabel, setUtmLabel] = useState("None");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUtmLabel(formatUtmSummary(readUtm()));
      const dismissed = window.localStorage.getItem("tl-lead-dismissed");
      if (dismissed === "1") return;
      if (readCount() >= THRESHOLD) setOpen(true);
    }, 0);

    function evaluate() {
      const dismissed = window.localStorage.getItem("tl-lead-dismissed");
      if (dismissed === "1") return;
      if (readCount() >= THRESHOLD) setOpen(true);
    }

    window.addEventListener("tl-demo-action", evaluate);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("tl-demo-action", evaluate);
    };
  }, []);

  if (!open) return null;

  function dismiss() {
    window.localStorage.setItem("tl-lead-dismissed", "1");
    setOpen(false);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const utm = readUtm();
    const captchaToken = await getToken();

    try {
      const res = await fetch("/api/demo/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          utm,
          source: "demo_soft_gate",
          tl_hp: honeypot,
          captchaToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit. Try again.");
        return;
      }

      window.localStorage.setItem("tl-lead-email", email);
      window.localStorage.setItem("tl-lead-dismissed", "1");
      setSent(true);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-title"
        className="w-full max-w-md rounded-lg border border-tl-line bg-tl-surface p-5 shadow-lg"
      >
        {sent ? (
          <>
            <h2 id="lead-title" className="font-display text-xl font-semibold">
              Thanks — choose your next step
            </h2>
            <p className="mt-2 text-sm text-tl-ink-muted">
              Keep exploring sample data, or request a quote for EFT / invoice.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/quote?utm_source=demo_gate&utm_medium=modal&utm_campaign=upgrade"
                className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white"
              >
                Request quote
              </Link>
              <button
                type="button"
                onClick={dismiss}
                className="rounded-md border border-tl-line px-4 py-2 text-sm"
              >
                Continue exploring
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 id="lead-title" className="font-display text-xl font-semibold">
              Want this for your projects?
            </h2>
            <p className="mt-2 text-sm text-tl-ink-muted">
              You have explored the demo. Leave a work email — then you can
              request a quote or keep exploring.
            </p>
            <p className="mt-2 text-xs text-tl-ink-muted">Source: {utmLabel}</p>
            <form onSubmit={submit} className="relative mt-4 space-y-3">
              <HoneypotField value={honeypot} onChange={setHoneypot} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organisation.co.za"
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
              {error ? (
                <p className="text-sm text-tl-danger" role="alert">
                  {error}
                </p>
              ) : null}
              <p className="text-xs text-tl-ink-muted">
                By submitting you agree we may contact you about TrustLedger. See
                our{" "}
                <a
                  href="https://trustledger.co.za/privacy/"
                  className="underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Privacy Policy
                </a>
                .
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Continue"}
                </button>
                <Link
                  href="/quote?utm_source=demo_gate&utm_medium=modal&utm_campaign=quote_now"
                  className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium"
                >
                  Quote now
                </Link>
                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-md border border-tl-line px-4 py-2 text-sm"
                >
                  Not now
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
