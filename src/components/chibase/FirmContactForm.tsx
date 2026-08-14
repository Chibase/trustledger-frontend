"use client";

import { useState } from "react";
import { HoneypotField, RecaptchaLegalNote, useRecaptcha } from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";
import { CHIBASE_EMAIL } from "@/lib/chibase/content";
import type { ChibasePackageCopy } from "@/lib/chibase/packages";

export function FirmContactForm({
  initialPackage = null,
}: {
  initialPackage?: ChibasePackageCopy | null;
}) {
  const { getToken } = useRecaptcha("chibase_contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState(
    initialPackage
      ? `I would like to request the ${initialPackage.label} package.`
      : "",
  );
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (!isWorkEmail(email)) {
      setError(
        "Please use a work email address. Personal free-mail domains are not accepted.",
      );
      return;
    }
    if (message.trim().length < 10) {
      setError("Please include a short note (at least 10 characters).");
      return;
    }
    setSubmitting(true);
    const captchaToken = await getToken();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          organization: organization.trim(),
          message: message.trim(),
          kind: "contact",
          source: "chibase",
          package: initialPackage?.id,
          path:
            typeof window !== "undefined"
              ? window.location.pathname
              : "/firm/contact",
          tl_hp: honeypot,
          captchaToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send. Try again or email us.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Try again or use email.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-tl-line bg-tl-surface p-4 text-sm text-tl-ink">
        Thank you. We will reply to that work email. For the SRM desk itself,
        you can also start a TrustLedger trial in parallel.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink"
        autoComplete="name"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Work email"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink"
        autoComplete="email"
        required
      />
      <input
        type="text"
        value={organization}
        onChange={(e) => setOrganization(e.target.value)}
        placeholder="Organisation (optional)"
        className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink"
        autoComplete="organization"
      />
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="What you need — facilitation, MEL, a live-site issue, or the TrustLedger desk. No CAPEX form."
        rows={5}
        className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink"
        required
      />
      {error ? <p className="text-sm text-tl-danger">{error}</p> : null}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-tl-trust px-5 py-2.5 text-sm font-semibold text-white hover:bg-tl-trust-ink disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send"}
      </button>
      <RecaptchaLegalNote />
      <p className="text-xs text-tl-ink-muted">
        Or write {CHIBASE_EMAIL} — mail is hosted separately from this site.
      </p>
    </form>
  );
}
