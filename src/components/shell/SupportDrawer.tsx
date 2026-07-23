"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { HoneypotField, useRecaptcha } from "@/components/forms/FormGuards";
import {
  SUPPORT_CATEGORIES,
  type SupportCategoryCode,
} from "@/data/supportCatalog";
import { isWorkEmail } from "@/data/assessment";

type SupportDrawerProps = {
  userName: string;
  role: string;
  mode: "demo" | "live";
  variant?: "ink" | "light";
};

type HealthSnapshot = {
  ok: boolean;
  checkedAt: string;
  checks: { label: string; ok: boolean; status?: number; ms: number }[];
};

export function SupportDrawer({
  userName,
  role,
  mode,
  variant = "ink",
}: SupportDrawerProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { getToken } = useRecaptcha("support_ticket");
  const [open, setOpen] = useState(false);
  const [category, setCategory] =
    useState<SupportCategoryCode>("SESSION_EXPIRED");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [repairing, setRepairing] = useState(false);

  const selected = SUPPORT_CATEGORIES.find((c) => c.code === category);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/health")
      .then((r) => r.json())
      .then((data: HealthSnapshot) => {
        if (!cancelled) setHealth(data);
      })
      .catch(() => {
        if (!cancelled) setHealth(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function repairSession() {
    setRepairing(true);
    try {
      await fetch("/auth/logout", { method: "POST" });
      await fetch("/auth/live/logout", { method: "POST" }).catch(() => null);
      document.cookie = "session-role=; path=/; max-age=0; samesite=lax";
      document.cookie = "tl-mode=; path=/; max-age=0; samesite=lax";
      // Land on the account chooser — never auto-jump into demo.
      router.push("/login?repaired=1");
      router.refresh();
    } finally {
      setRepairing(false);
      setOpen(false);
    }
  }

  async function submitTicket(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isWorkEmail(email)) {
      setError("Please use a work email address.");
      return;
    }
    if (description.trim().length < 8) {
      setError("Add a short description of what went wrong.");
      return;
    }

    setSubmitting(true);
    const captchaToken = await getToken();
    try {
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          name: userName,
          category,
          description: description.trim(),
          path: pathname,
          role,
          mode,
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
          health,
          tl_hp: honeypot,
          captchaToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ticketId?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not submit ticket.");
        return;
      }
      setTicketId(data.ticketId ?? "submitted");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const triggerClass =
    variant === "ink"
      ? "w-full rounded-md border border-white/15 px-2.5 py-2 text-left text-sm text-white/80 hover:bg-white/10 hover:text-white"
      : "w-full rounded-md border border-tl-line px-2.5 py-2 text-left text-sm text-tl-ink hover:bg-tl-paper";

  return (
    <>
      <button type="button" className={triggerClass} onClick={() => setOpen(true)}>
        Support
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-title"
            className="flex h-full w-full max-w-md flex-col border-l border-tl-line bg-tl-surface shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-tl-line px-4 py-3">
              <div>
                <h2 id="support-title" className="font-display text-lg font-semibold">
                  Support
                </h2>
                <p className="text-xs text-tl-ink-muted">
                  Platform issues · self-serve first
                </p>
              </div>
              <button
                type="button"
                className="rounded-md border border-tl-line px-2 py-1 text-sm"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 text-sm">
              <section className="rounded-lg border border-tl-line p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                  Status
                </p>
                {health ? (
                  <ul className="mt-2 space-y-1">
                    {health.checks.map((c) => (
                      <li key={c.label} className="flex justify-between gap-2">
                        <span>{c.label}</span>
                        <span
                          className={
                            c.ok ? "text-tl-trust-ink" : "text-tl-danger"
                          }
                        >
                          {c.ok ? "OK" : "Down"}
                          {c.ms ? ` · ${c.ms}ms` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-tl-ink-muted">Checking…</p>
                )}
                <a
                  href="/status"
                  className="mt-2 inline-block text-xs font-medium text-tl-trust-ink underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open status page
                </a>
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                  Self-serve
                </p>
                <button
                  type="button"
                  disabled={repairing}
                  onClick={repairSession}
                  className="w-full rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
                >
                  {repairing ? "Repairing…" : "Repair session"}
                </button>
                <a
                  href="/login/live"
                  className="block w-full rounded-md border border-tl-line px-3 py-2 text-center font-medium hover:bg-tl-paper"
                >
                  Live sign-in
                </a>
                <p className="text-xs text-tl-ink-muted">
                  Hard-refresh (Ctrl+Shift+R) if the UI looks stale after a deploy.
                </p>
              </section>

              <section>
                {ticketId ? (
                  <div className="rounded-lg border border-tl-trust/30 bg-tl-trust/5 p-3">
                    <p className="font-medium text-tl-trust-ink">Ticket sent</p>
                    <p className="mt-1 text-tl-ink-muted">
                      Reference <span className="font-mono">{ticketId}</span>. We
                      received diagnostics with your report.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submitTicket} className="relative space-y-3">
                    <HoneypotField value={honeypot} onChange={setHoneypot} />
                    <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                      Escalate to support
                    </p>
                    <div>
                      <label
                        htmlFor="support-category"
                        className="mb-1 block text-xs font-medium"
                      >
                        Issue type
                      </label>
                      <select
                        id="support-category"
                        value={category}
                        onChange={(e) =>
                          setCategory(e.target.value as SupportCategoryCode)
                        }
                        className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                      >
                        {SUPPORT_CATEGORIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      {selected?.selfServe ? (
                        <p className="mt-1 text-xs text-tl-ink-muted">
                          Tip: {selected.selfServe}
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label
                        htmlFor="support-email"
                        className="mb-1 block text-xs font-medium"
                      >
                        Work email
                      </label>
                      <input
                        id="support-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                        placeholder="you@organisation.co.za"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="support-desc"
                        className="mb-1 block text-xs font-medium"
                      >
                        What happened?
                      </label>
                      <textarea
                        id="support-desc"
                        required
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
                        placeholder="e.g. Report brief stays blank after clicking Generate…"
                      />
                    </div>
                    {error ? (
                      <p className="text-sm text-tl-danger" role="alert">
                        {error}
                      </p>
                    ) : null}
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm font-medium hover:bg-tl-line/30 disabled:opacity-60"
                    >
                      {submitting ? "Sending…" : "Submit ticket"}
                    </button>
                  </form>
                )}
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
