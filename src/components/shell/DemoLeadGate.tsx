"use client";

import { useEffect, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [utmLabel, setUtmLabel] = useState("None");

  useEffect(() => {
    setUtmLabel(formatUtmSummary(readUtm()));
    function evaluate() {
      const dismissed = window.localStorage.getItem("tl-lead-dismissed");
      if (dismissed === "1") return;
      if (readCount() >= THRESHOLD) setOpen(true);
    }
    evaluate();
    window.addEventListener("tl-demo-action", evaluate);
    return () => window.removeEventListener("tl-demo-action", evaluate);
  }, []);

  if (!open) return null;

  function dismiss() {
    window.localStorage.setItem("tl-lead-dismissed", "1");
    setOpen(false);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const utm = readUtm();
    window.localStorage.setItem("tl-lead-email", email);
    window.localStorage.setItem(
      "tl-lead-payload",
      JSON.stringify({
        email,
        utm,
        capturedAt: new Date().toISOString(),
      }),
    );
    window.localStorage.setItem("tl-lead-dismissed", "1");
    setSent(true);
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
              Thanks — we will follow up
            </h2>
            <p className="mt-2 text-sm text-tl-ink-muted">
              Your demo interest is saved locally for now. Connect a form endpoint
              later for CRM capture.
            </p>
            <button
              type="button"
              onClick={dismiss}
              className="mt-4 rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white"
            >
              Continue exploring
            </button>
          </>
        ) : (
          <>
            <h2 id="lead-title" className="font-display text-xl font-semibold">
              Want this for your projects?
            </h2>
            <p className="mt-2 text-sm text-tl-ink-muted">
              You have explored the demo. Leave an email to book a live TrustLedger
              walkthrough.
            </p>
            <p className="mt-2 text-xs text-tl-ink-muted">Source: {utmLabel}</p>
            <form onSubmit={submit} className="mt-4 space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@organisation.co.za"
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
                >
                  Book a demo
                </button>
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
