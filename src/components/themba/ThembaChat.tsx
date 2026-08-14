"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import {
  HoneypotField,
  RecaptchaLegalNote,
  useRecaptcha,
} from "@/components/forms/FormGuards";
import { ThembaAvatar } from "@/components/themba/ThembaAvatar";
import { ThembaMarkdown } from "@/components/themba/ThembaMarkdown";
import { isWorkEmail } from "@/data/assessment";
import type { ResourcePackId } from "@/data/resources";
import {
  THEMBA_BUBBLE_GREETING,
  THEMBA_CONVERSION_ACTIONS,
  THEMBA_GREETING,
  THEMBA_PROFILE_CHIPS,
  THEMBA_STARTER_CHIPS,
  mentionsBugKeyword,
  type ThembaAction,
  type ThembaChip,
  type ThembaProfile,
} from "@/lib/themba";

type ChatLink = { href: string; label: string };

type ChatTurn = {
  id: string;
  role: "assistant" | "user";
  content: string;
  links?: ChatLink[];
  chips?: ThembaChip[];
  escalate?: boolean;
  magnet?: { packId: ResourcePackId; title: string } | null;
};

type ThembaChatProps = {
  /** If set, only these exact paths show the widget. Default: all public landing pages. */
  allowPaths?: string[];
};

const HIDE_PREFIXES = ["/app", "/ops", "/login", "/pay", "/invite", "/auth"];

function isPublicLandingPath(pathname: string): boolean {
  return !HIDE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function ThembaChat({ allowPaths }: ThembaChatProps) {
  const pathname = usePathname() || "/";
  const allowed = allowPaths
    ? allowPaths.includes(pathname)
    : isPublicLandingPath(pathname);
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [bubble, setBubble] = useState(true);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [showMagnet, setShowMagnet] = useState(false);
  const [magnetPack, setMagnetPack] = useState<{
    packId: ResourcePackId;
    title: string;
  } | null>(null);
  const [profile, setProfile] = useState<ThembaProfile | null>(null);
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
        { href: "/assessment", label: "Readiness check" },
        { href: "/trial", label: "Start 14-day trial" },
        { href: "/faq", label: "FAQ" },
      ],
      chips: [...THEMBA_PROFILE_CHIPS, ...THEMBA_STARTER_CHIPS.slice(0, 2)],
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const turnSeq = useRef(0);

  function nextTurnId(prefix: string): string {
    turnSeq.current += 1;
    return `${prefix}-${turnSeq.current}`;
  }

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    inputRef.current?.focus();
  }, [open, turns, showEscalate, showMagnet, busy]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function dismissBubble() {
    setBubble(false);
  }

  function openChat() {
    dismissBubble();
    setOpen(true);
  }

  function reportBugIfNeeded(userQuery: string) {
    if (typeof window === "undefined") return;
    if (!mentionsBugKeyword(userQuery)) return;
    const history = turns.slice(-5).map((t) => ({
      role: t.role,
      content: t.content.slice(0, 500),
    }));
    void fetch("/api/telemetry/bug-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        user_query: userQuery.slice(0, 2000),
        page_url: window.location.href,
        browser_info: navigator.userAgent,
        chat_history: history,
        tl_hp: honeypot,
      }),
    }).catch(() => {
      /* telemetry must not block chat */
    });
  }

  async function askThemba(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setError(null);
    setInput("");
    const userTurn: ChatTurn = {
      id: nextTurnId("u"),
      role: "user",
      content: text,
    };
    setTurns((prev) => [...prev, userTurn]);
    reportBugIfNeeded(text);
    setBusy(true);
    try {
      const res = await fetch("/api/themba/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          path: pathname,
          profile,
          tl_hp: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reply?: string;
        escalate?: boolean;
        links?: ChatLink[];
        chips?: ThembaChip[];
        actions?: ThembaAction[];
        profile?: ThembaProfile | null;
        magnet?: { packId: ResourcePackId; title: string } | null;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not reach Themba. Try again.");
        return;
      }
      if (data.profile) setProfile(data.profile);
      if (data.magnet?.packId) {
        setMagnetPack(data.magnet);
        setShowMagnet(true);
        setShowEscalate(false);
      }
      setTurns((prev) => [
        ...prev,
        {
          id: nextTurnId("a"),
          role: "assistant",
          content: data.reply ?? "I could not form an answer — please use Contact.",
          links: data.links,
          chips: data.chips,
          escalate: Boolean(data.escalate),
          magnet: data.magnet,
        },
      ]);
      if (data.escalate) {
        setShowEscalate(true);
        setShowMagnet(false);
        if (!escNote) setEscNote(text);
      }
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage(event?: React.FormEvent) {
    event?.preventDefault();
    await askThemba(input);
  }

  if (!allowed) return null;

  const lastChips =
    !showEscalate && !showMagnet
      ? turns.filter((t) => t.role === "assistant").at(-1)?.chips
      : undefined;

  return (
    <>
      {!open && bubble ? (
        <div className="fixed bottom-20 right-5 z-40 w-[min(18.5rem,calc(100vw-2.5rem))] animate-[tl-banner-in_350ms_ease-out] sm:bottom-[4.75rem]">
          <div className="relative rounded-lg border border-tl-line bg-tl-surface px-3 py-2.5 shadow-md">
            <button
              type="button"
              onClick={openChat}
              className="flex items-start gap-2 pr-6 text-left"
            >
              <ThembaAvatar size={32} className="mt-0.5 h-8 w-8 shrink-0" />
              <p className="text-sm leading-snug text-tl-ink">
                {THEMBA_BUBBLE_GREETING}
              </p>
            </button>
            <button
              type="button"
              onClick={dismissBubble}
              className="absolute right-1.5 top-1.5 rounded px-1.5 text-sm text-tl-ink-muted hover:text-tl-ink"
              aria-label="Dismiss Themba greeting"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat())}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-tl-trust py-1.5 pl-1.5 pr-3.5 text-sm font-semibold text-white shadow-md transition hover:bg-tl-trust-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tl-trust"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <ThembaAvatar size={36} decorative className="h-9 w-9 border border-white/30" />
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
            className="relative z-10 flex max-h-[min(38rem,88vh)] w-full max-w-md flex-col overflow-hidden rounded-lg border border-tl-line bg-tl-surface shadow-lg"
          >
            <header className="flex items-start justify-between gap-3 border-b border-tl-line bg-gradient-to-br from-[#e8eef2] to-tl-surface px-4 py-3">
              <div className="flex items-center gap-3">
                <ThembaAvatar size={44} className="h-11 w-11" />
                <div>
                  <p
                    id={titleId}
                    className="font-display text-lg font-semibold text-tl-ink"
                  >
                    Themba
                  </p>
                  <p className="text-xs text-tl-ink-muted">
                    The Trust · TrustLedger guide
                  </p>
                </div>
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
                      : "mr-2 flex gap-2"
                  }
                >
                  {t.role === "assistant" ? (
                    <ThembaAvatar
                      size={28}
                      decorative
                      className="mt-0.5 h-7 w-7 shrink-0"
                    />
                  ) : null}
                  <div
                    className={
                      t.role === "assistant"
                        ? "min-w-0 flex-1 rounded-md border border-tl-line/80 bg-tl-paper/80 px-3 py-2 text-sm leading-relaxed text-tl-ink"
                        : undefined
                    }
                  >
                    {t.role === "assistant" ? (
                      <ThembaMarkdown text={t.content} />
                    ) : (
                      <p>{t.content}</p>
                    )}
                    {t.links && t.links.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {t.links.map((l) => (
                          <Link
                            key={`${t.id}-${l.href}-${l.label}`}
                            href={l.href}
                            className="rounded-md border border-tl-line bg-tl-surface px-2 py-1 text-xs font-semibold text-tl-trust-ink hover:border-tl-trust"
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
                        onClick={() => {
                          setShowMagnet(false);
                          setShowEscalate(true);
                        }}
                      >
                        Leave a note for a person
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
              {busy ? (
                <p className="pl-9 text-xs text-tl-ink-muted" aria-live="polite">
                  Themba is writing…
                </p>
              ) : null}
              {lastChips && lastChips.length > 0 && !busy ? (
                <div className="flex flex-wrap gap-2 pl-9 pt-1">
                  {lastChips.map((chip) => (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => void askThemba(chip.prompt)}
                      className="rounded-md border border-tl-line bg-tl-surface px-2.5 py-1.5 text-left text-xs font-medium text-tl-ink hover:border-tl-trust hover:text-tl-trust-ink"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="border-t border-tl-line bg-tl-paper/40 px-4 py-2">
              <p className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-wide text-tl-ink-muted">
                Next step
              </p>
              <div className="flex flex-wrap gap-1.5">
                {THEMBA_CONVERSION_ACTIONS.map((a) => (
                  <Link
                    key={`${a.href}-${a.label}`}
                    href={a.href}
                    className={
                      a.kind === "primary"
                        ? "rounded-md bg-tl-trust px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-tl-trust-ink"
                        : "rounded-md border border-tl-line bg-tl-surface px-2.5 py-1.5 text-xs font-semibold text-tl-ink hover:border-tl-trust"
                    }
                  >
                    {a.label}
                  </Link>
                ))}
              </div>
            </div>

            {showEscalate ? (
              <ThembaHandoffForm
                honeypot={honeypot}
                onHoneypot={setHoneypot}
                name={escName}
                email={escEmail}
                note={escNote}
                onName={setEscName}
                onEmail={setEscEmail}
                onNote={setEscNote}
                error={error}
                busy={busy}
                onCancel={() => setShowEscalate(false)}
                onSuccess={(reply, links) => {
                  setShowEscalate(false);
                  setTurns((prev) => [
                    ...prev,
                    {
                      id: nextTurnId("a-esc"),
                      role: "assistant",
                      content: reply,
                      links,
                    },
                  ]);
                }}
                onError={setError}
                setBusy={setBusy}
                pathname={pathname}
                profile={profile}
              />
            ) : showMagnet && magnetPack ? (
              <ThembaMagnetForm
                pack={magnetPack}
                honeypot={honeypot}
                onHoneypot={setHoneypot}
                error={error}
                busy={busy}
                onCancel={() => setShowMagnet(false)}
                onError={setError}
                setBusy={setBusy}
                onSuccess={(reply, links) => {
                  setShowMagnet(false);
                  setTurns((prev) => [
                    ...prev,
                    {
                      id: nextTurnId("a-mag"),
                      role: "assistant",
                      content: reply,
                      links,
                    },
                  ]);
                }}
              />
            ) : (
              <form onSubmit={sendMessage} className="border-t border-tl-line px-4 py-3">
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
                  Simple product Q&amp;A. Complex matters go to a person.
                </p>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}

function ThembaHandoffForm({
  honeypot,
  onHoneypot,
  name,
  email,
  note,
  onName,
  onEmail,
  onNote,
  error,
  busy,
  onCancel,
  onSuccess,
  onError,
  setBusy,
  pathname,
  profile,
}: {
  honeypot: string;
  onHoneypot: (v: string) => void;
  name: string;
  email: string;
  note: string;
  onName: (v: string) => void;
  onEmail: (v: string) => void;
  onNote: (v: string) => void;
  error: string | null;
  busy: boolean;
  onCancel: () => void;
  onSuccess: (reply: string, links?: ChatLink[]) => void;
  onError: (msg: string | null) => void;
  setBusy: (v: boolean) => void;
  pathname: string;
  profile: ThembaProfile | null;
}) {
  const { getToken } = useRecaptcha("themba_escalate");

  async function submitEscalate(event: React.FormEvent) {
    event.preventDefault();
    onError(null);
    if (name.trim().length < 2) {
      onError("Please enter your name.");
      return;
    }
    if (!isWorkEmail(email)) {
      onError(
        "Please use a work email address. Personal free-mail domains are not accepted.",
      );
      return;
    }
    if (note.trim().length < 10) {
      onError("Please include a short note (at least 10 characters).");
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
          profile,
          tl_hp: honeypot,
          captchaToken,
          escalate: {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            message: note.trim(),
          },
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        reply?: string;
        links?: ChatLink[];
      };
      if (!res.ok) {
        onError(data.error ?? "Could not send handoff. Try Contact.");
        return;
      }
      onSuccess(
        data.reply ??
          "Thanks — a TrustLedger person will follow up on that work email.",
        data.links,
      );
    } catch {
      onError("Network error. Try again or use Contact.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submitEscalate}
      className="space-y-2 border-t border-tl-line bg-tl-paper/60 px-4 py-3"
    >
      <p className="text-xs font-semibold text-tl-ink">
        Hand off to a TrustLedger person
      </p>
      <HoneypotField value={honeypot} onChange={onHoneypot} />
      <input
        type="text"
        value={name}
        onChange={(e) => onName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-2.5 py-2 text-sm text-tl-ink"
        autoComplete="name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => onEmail(e.target.value)}
        placeholder="Work email"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-2.5 py-2 text-sm text-tl-ink"
        autoComplete="email"
      />
      <textarea
        value={note}
        onChange={(e) => onNote(e.target.value)}
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
          onClick={onCancel}
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
  );
}

function ThembaMagnetForm({
  pack,
  honeypot,
  onHoneypot,
  error,
  busy,
  onCancel,
  onError,
  setBusy,
  onSuccess,
}: {
  pack: { packId: ResourcePackId; title: string };
  honeypot: string;
  onHoneypot: (v: string) => void;
  error: string | null;
  busy: boolean;
  onCancel: () => void;
  onError: (msg: string | null) => void;
  setBusy: (v: boolean) => void;
  onSuccess: (reply: string, links?: ChatLink[]) => void;
}) {
  const { getToken } = useRecaptcha("resource_download");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  async function submitMagnet(event: React.FormEvent) {
    event.preventDefault();
    onError(null);
    if (name.trim().length < 2) {
      onError("Please enter your name.");
      return;
    }
    if (!isWorkEmail(email)) {
      onError(
        "Please use a work email address. Personal free-mail domains are not accepted.",
      );
      return;
    }
    setBusy(true);
    const captchaToken = await getToken();
    try {
      const res = await fetch("/api/resources/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packId: pack.packId,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          organization: organization.trim() || undefined,
          comment: `Themba chat request for ${pack.title}.`,
          tl_hp: honeypot,
          captchaToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        downloadUrl?: string;
        filename?: string;
      };
      if (!res.ok) {
        onError(data.error ?? "Could not unlock the pack. Try Resources.");
        return;
      }
      const href = data.downloadUrl || "/resources";
      onSuccess(
        `Your **${pack.title}** is ready. The link expires in about an hour. These packs are maturity aids — not a substitute for a 14-day trial.`,
        [
          { href, label: data.filename ? `Download ${data.filename}` : "Download pack" },
          { href: "/trial", label: "Start 14-day trial" },
          { href: "/contact", label: "Book live demo" },
        ],
      );
    } catch {
      onError("Network error. Try Resources instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submitMagnet}
      className="space-y-2 border-t border-tl-line bg-tl-paper/60 px-4 py-3"
    >
      <p className="text-xs font-semibold text-tl-ink">
        Unlock “{pack.title}” with a work email
      </p>
      <HoneypotField value={honeypot} onChange={onHoneypot} />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-2.5 py-2 text-sm text-tl-ink"
        autoComplete="name"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-2.5 py-2 text-sm text-tl-ink"
        autoComplete="email"
      />
      <input
        type="text"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="Organisation (optional)"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-2.5 py-2 text-sm text-tl-ink"
        autoComplete="organization"
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
          {busy ? "Unlocking…" : "Send pack"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-tl-line px-3 py-2 text-sm text-tl-ink hover:bg-tl-surface"
        >
          Cancel
        </button>
        <Link
          href="/resources"
          className="rounded-md px-3 py-2 text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          Resources
        </Link>
      </div>
    </form>
  );
}
