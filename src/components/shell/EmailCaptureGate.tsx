"use client";

import { useEffect, useState } from "react";
import { hasCapturedEmail, saveCapturedEmail } from "@/lib/emailGate";

type PendingAction = {
  reason: "print" | "save";
  onReady: () => void;
};

let pending: PendingAction | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

/** Run action immediately if email known; otherwise open gate then continue. */
export function requireEmailThen(
  reason: "print" | "save",
  onReady: () => void,
) {
  if (hasCapturedEmail()) {
    onReady();
    return;
  }
  pending = { reason, onReady };
  notify();
}

export function EmailCaptureGate() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<"print" | "save">("save");
  const [email, setEmail] = useState("");

  useEffect(() => {
    function sync() {
      if (pending) {
        setReason(pending.reason);
        setOpen(true);
      } else {
        setOpen(false);
      }
    }
    listeners.add(sync);
    sync();
    return () => {
      listeners.delete(sync);
    };
  }, []);

  if (!open) return null;

  function cancel() {
    pending = null;
    setOpen(false);
    notify();
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    saveCapturedEmail(email, reason);
    const action = pending;
    pending = null;
    setOpen(false);
    notify();
    action?.onReady();
  }

  const verb = reason === "print" ? "print" : "save";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-gate-title"
        className="w-full max-w-md rounded-lg border border-tl-line bg-tl-surface p-5 shadow-lg"
      >
        <h2 id="email-gate-title" className="font-display text-xl font-semibold">
          Email to {verb}
        </h2>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Explore freely. We only need an email when you {verb} data from this
          trial.
        </p>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            autoFocus
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
              Continue
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-md border border-tl-line px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
