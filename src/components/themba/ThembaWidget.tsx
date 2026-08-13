"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  HoneypotField,
  RecaptchaLegalNote,
  useRecaptcha,
} from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";
import { THEMBA_GREETING } from "@/lib/themba/knowledge";

type ChatLink = { href: string; label: string };

type ChatTurn = {
  id: string;
  role: "assistant" | "user";
  content: string;
  links?: ChatLink[];
  escalate?: boolean;
};

type ThembaWidgetProps = {
  /** Limit to these paths; default Phase A marketing set. */
  allowPaths?: string[];
};

const DEFAULT_PATHS = ["/", "/product", "/faq"];

export function ThembaWidget({ allowPaths = DEFAULT_PATHS }: ThembaWidgetProps) {
  const pathname = usePathname() || "/";
  const allowed = allowPaths.includes(pathname);
  const titleId = useId();
  const { getToken } = useRecaptcha("themba_escalate");
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [escName, setEscName] = useState("");
  const [escEmail, setEscEmail] = useState("");
  const [escNote, setEscNote] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: "greet",
      role: "assistant",
      content: THEMBA_GREETING,
      links: [
        { href: "/product", label: "Product" },
        { href: "/trial", label: "Trial" },
        { href: "/faq", label: "FAQ" },
      ],
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    inputRef.current?.focus();
  }, [open, turns, showEscalate]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!allowed) return null;

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");
    const userTurn: ChatTurn = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setTurns((prev) => [...prev, userTurn]);
    setBusy(true);
    try {
      const res = await fetch("/api/themba/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          path: pathname,
          tl_hp: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reply?: string;
        escalate?: boolean;
        links?: ChatLink[];
      };
      if (!res.ok) {
        setError(data.error ?? "Could not reach Themba. Try again.");
        return;
      }
      setTurns((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.reply ?? "I could not form an answer — please use Contact.",
          links: data.links,
          escalate: Boolean(data.escalate),
        },
      ]);
      if (data.escalate) {
        setShowEscalate(true);
        if (!escNote) setEscNote(text);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitEscalate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (escName.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!isWorkEmail(escEmail)) {
      setError(
        "Please use a work email address. Personal free-mail domains are not accepted.",
      );
      return;
    }
    if (escNote.trim().length < 10) {
      setError("Please include a short note (at least 10 characters).");
      return;
    }
    setBusy(true);
    const captchaToken = await getToken();
    try {
      const res = await fetch("/api/themba/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          tl_hp: honeypot,
          captchaToken,
          escalate: {
            name: escName.trim(),
            email: escEmail.trim().toLowerCase(),
            message: escNote.trim(),
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reply?: string;
        links?: ChatLink[];
      };
      if (!res.ok) {
        setError(data.error ?? "Could not send handoff. Try Contact.");
        return;
      }
      setShowEscalate(false);
      setTurns((prev) => [
        ...prev,
        {
          id: `a-esc-${Date.now()}`,
          role: "assistant",
          content:
            data.reply ??
            "Thanks — a TrustLedger person will follow up on that work email.",
          links: data.links,
        },
      ]);
    } catch {
      setError("Network error. Try again or use Contact.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-md bg-tl-trust px-3.5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-tl-trust-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="font-display tracking-tight">Themba</span>
        <span className="hidden text-white/85 sm:inline">· Ask The Trust</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-tl-ink/25 p-3 sm:p-5">
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label="Close Themba"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex max-h-[min(34rem,85vh)] w-full max-w-md flex-col overflow-hidden rounded-lg border border-tl-line bg-tl-surface shadow-lg"
          >
            <header className="flex items-start justify-between gap-3 border-b border-tl-line bg-gradient-to-br from-[#e8eef2] to-tl-surface px-4 py-3">
              <div>
                <p id={titleId} className="font-display text-lg font-semibold text-tl-ink">
                  Themba
                </p>
                <p className="text-xs text-tl-ink-muted">The Trust · TrustLedger guide</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-tl-line px-2 py-1 text-sm text-tl-ink-muted hover:bg-tl-paper hover:text-tl-ink"
              >
                Close
              </button>
            </header>

            <div
              ref={listRef}
              className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
            >
              {turns.map((t) => (
                <div
                  key={t.id}
                  className={
                    t.role === "user"
                      ? "ml-8 rounded-md bg-tl-trust/10 px-3 py-2 text-sm text-tl-ink"
                      : "mr-4 rounded-md border border-tl-line/80 bg-tl-paper/80 px-3 py-2 text-sm leading-relaxed text-tl-ink"
                  }
                >
                  <p>{t.content}</p>
                  {t.links && t.links.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {t.links.map((l) => (
                        <Link
                          key={`${t.id}-${l.href}`}
                          href={l.href}
                          className="text-xs font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
                        >
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {t.escalate && !showEscalate ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
                      onClick={() => setShowEscalate(true)}
                    >
                      Leave a note for a person
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            {showEscalate ? (
              <form
                onSubmit={submitEscalate}
                className="space-y-2 border-t border-tl-line bg-tl-paper/60 px-4 py-3"
              >
                <p className="text-xs font-semibold text-tl-ink">
                  Hand off to a TrustLedger person
                </p>
                <HoneypotField value={honeypot} onChange={setHoneypot} />
                <input
                  type="text"
                  value={escName}
                  onChange={(e) => setEscName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-md border border-tl-line bg-tl-surface px-2.5 py-2 text-sm text-tl-ink"
                  autoComplete="name"
                />
                <input
                  type="email"
                  value={escEmail}
                  onChange={(e) => setEscEmail(e.target.value)}
                  placeholder="Work email"
                  className="w-full rounded-md border border-tl-line bg-tl-surface px-2.5 py-2 text-sm text-tl-ink"
                  autoComplete="email"
                />
                <textarea
                  value={escNote}
                  onChange={(e) => setEscNote(e.target.value)}
                  placeholder="Short note (what you need)"
                  rows={3}
                  className="w-full rounded-md border border-tl-line bg-tl-surface px-2.5 py-2 text-sm text-tl-ink"
                />
                <RecaptchaLegalNote />
                {error ? (
                  <p className="text-xs text-tl-danger" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-md bg-tl-trust px-3 py-2 text-sm font-semibold text-white hover:bg-tl-trust-ink disabled:opacity-60"
                  >
                    {busy ? "Sending…" : "Send handoff"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEscalate(false)}
                    className="rounded-md border border-tl-line px-3 py-2 text-sm text-tl-ink hover:bg-tl-surface"
                  >
                    Cancel
                  </button>
                  <Link
                    href="/contact"
                    className="rounded-md px-3 py-2 text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
                  >
                    Contact page
                  </Link>
                </div>
              </form>
            ) : (
              <form
                onSubmit={sendMessage}
                className="border-t border-tl-line px-4 py-3"
              >
                <HoneypotField value={honeypot} onChange={setHoneypot} />
                {error ? (
                  <p className="mb-2 text-xs text-tl-danger" role="alert">
                    {error}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about TrustLedger…"
                    maxLength={2000}
                    className="min-w-0 flex-1 rounded-md border border-tl-line bg-tl-paper px-2.5 py-2 text-sm text-tl-ink"
                    disabled={busy}
                    aria-label="Message Themba"
                  />
                  <button
                    type="submit"
                    disabled={busy || !input.trim()}
                    className="rounded-md bg-tl-trust px-3 py-2 text-sm font-semibold text-white hover:bg-tl-trust-ink disabled:opacity-60"
                  >
                    {busy ? "…" : "Ask"}
                  </button>
                </div>
                <p className="mt-2 text-[0.7rem] text-tl-ink-muted">
                  Simple product Q&A. Complex matters go to a person.
                </p>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
