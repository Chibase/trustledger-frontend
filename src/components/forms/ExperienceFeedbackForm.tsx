"use client";

import { useEffect, useState } from "react";
import { HoneypotField, RecaptchaLegalNote, useRecaptcha } from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";

type ExperienceFeedbackFormProps = {
  /** Where the form is shown — stored on the CRM lead. */
  contextPath: string;
  /** Prefill email when known (assessment unlock / demo lead). */
  defaultEmail?: string;
  defaultName?: string;
  heading?: string;
  description?: string;
  compact?: boolean;
  onSubmitted?: () => void;
};

export function ExperienceFeedbackForm({
  contextPath,
  defaultEmail = "",
  defaultName = "",
  heading = "Share feedback",
  description = "Tell us what worked and what we should improve before launch.",
  compact = false,
  onSubmitted,
}: ExperienceFeedbackFormProps) {
  const { getToken } = useRecaptcha("product_feedback");
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  useEffect(() => {
    if (defaultName) setName(defaultName);
  }, [defaultName]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!isWorkEmail(email)) {
      setError(
        "Please use a work email address. Personal free-mail domains are not accepted.",
      );
      return;
    }
    if (rating === null) {
      setError("Please choose a rating from 1 to 5.");
      return;
    }
    if (message.trim().length < 10) {
      setError(
        "Please share a short note on what worked or what we should improve (at least 10 characters).",
      );
      return;
    }

    setSubmitting(true);
    const captchaToken = await getToken();
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "feedback",
          name: name.trim() || undefined,
          email: email.trim().toLowerCase(),
          rating,
          message: message.trim(),
          path: contextPath,
          tl_hp: honeypot,
          captchaToken,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not send feedback. Try again.");
        return;
      }
      setDone(true);
      onSubmitted?.();
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div
        className={
          compact
            ? "rounded-lg border border-tl-trust/30 bg-tl-trust/5 p-4"
            : "rounded-lg border border-tl-trust/30 bg-tl-trust/5 p-5"
        }
      >
        <p className="font-display text-lg font-semibold text-tl-ink">
          Thank you
        </p>
        <p className="mt-1 text-sm text-tl-ink-muted">
          Your feedback helps us shape TrustLedger for launch.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? "relative space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4"
          : "relative space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
      }
    >
      <HoneypotField value={honeypot} onChange={setHoneypot} />
      <div>
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-tl-ink-muted">{description}</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-tl-ink">
          Overall experience
        </legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = rating === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className={
                  selected
                    ? "min-w-10 rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white"
                    : "min-w-10 rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper"
                }
                aria-pressed={selected}
              >
                {value}
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-xs text-tl-ink-muted">1 = poor · 5 = excellent</p>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="fb-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="fb-name"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="fb-email" className="mb-1 block text-sm font-medium">
            Work email
          </label>
          <input
            id="fb-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="fb-message" className="mb-1 block text-sm font-medium">
          What should we know?
        </label>
        <textarea
          id="fb-message"
          name="message"
          rows={compact ? 3 : 4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Clarity, missing features, confusion, what you’d tell a colleague…"
          className="w-full rounded-md border border-tl-line bg-white px-3 py-2 text-sm"
        />
      </div>

      {error ? <p className="text-sm text-tl-danger">{error}</p> : null}

      <RecaptchaLegalNote />

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send feedback"}
      </button>
    </form>
  );
}
