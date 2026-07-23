"use client";

import Link from "next/link";
import { useState } from "react";
import { HoneypotField, RecaptchaLegalNote, useRecaptcha } from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";

export default function ContactPage() {
  const { getToken } = useRecaptcha("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
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
      setError("Please include a short message (at least 10 characters).");
      return;
    }

    setSubmitting(true);
    const captchaToken = await getToken();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "contact",
          name: name.trim(),
          email: email.trim().toLowerCase(),
          organization: organization.trim() || undefined,
          message: message.trim(),
          path: "/contact",
          tl_hp: honeypot,
          captchaToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send your message. Try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Contact us
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Ask about a pilot, pricing, or how TrustLedger fits your sites. We reply
        from the Chibase Consulting team.
      </p>

      {done ? (
        <div className="mt-8 rounded-lg border border-tl-trust/30 bg-tl-trust/5 p-5">
          <p className="font-display text-lg font-semibold">Message sent</p>
          <p className="mt-2 text-sm text-tl-ink-muted">
            Thanks — we will follow up on your work email shortly.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/product"
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Product overview
            </Link>
            <Link
              href="/assessment"
              className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Take assessment
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative mt-8 space-y-4">
          <HoneypotField value={honeypot} onChange={setHoneypot} />
          <div>
            <label htmlFor="contact-name" className="mb-1 block text-sm font-medium">
              Name
            </label>
            <input
              id="contact-name"
              name="name"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="mb-1 block text-sm font-medium">
              Work email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="contact-org"
              className="mb-1 block text-sm font-medium"
            >
              Organization
            </label>
            <input
              id="contact-org"
              name="organization"
              autoComplete="organization"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="contact-message"
              className="mb-1 block text-sm font-medium"
            >
              How can we help?
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
            />
          </div>
          {error ? <p className="text-sm text-tl-danger">{error}</p> : null}
          <RecaptchaLegalNote />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-tl-trust px-5 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send message"}
          </button>
        </form>
      )}

      <p className="mt-8 text-xs text-tl-ink-muted">
        Prefer the product first?{" "}
        <Link href="/product" className="font-medium text-tl-trust-ink underline">
          Product overview
        </Link>{" "}
        or{" "}
        <Link
          href="/assessment"
          className="font-medium text-tl-trust-ink underline"
        >
          run the readiness assessment
        </Link>
        .
      </p>
    </main>
  );
}
