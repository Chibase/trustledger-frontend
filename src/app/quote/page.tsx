"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HoneypotField, RecaptchaLegalNote, useRecaptcha } from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";
import { captureUtmFromSearchParams, formatUtmSummary, readUtm } from "@/lib/utm";
import type { PaystackPlanId } from "@/lib/paystackPlans";

const PLANS: { id: PaystackPlanId; label: string; blurb: string }[] = [
  {
    id: "practitioner",
    label: "Practitioner",
    blurb: "Single Plan Owner — dashboard and standard reporting.",
  },
  {
    id: "project",
    label: "Project",
    blurb: "Owner + per-project seats for client, contractor, community.",
  },
  {
    id: "institutional",
    label: "Institutional",
    blurb: "Custom seats, regions, and compliance — sales-scoped.",
  },
];

function QuoteForm() {
  const searchParams = useSearchParams();
  const { getToken } = useRecaptcha("quote_request");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [plan, setPlan] = useState<PaystackPlanId>("practitioner");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [utmLabel, setUtmLabel] = useState("None");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const captured = captureUtmFromSearchParams(
        new URLSearchParams(searchParams.toString()),
        "/quote",
      );
      setUtmLabel(formatUtmSummary(captured ?? readUtm()));
      const prefillPlan = searchParams.get("plan");
      if (
        prefillPlan === "practitioner" ||
        prefillPlan === "project" ||
        prefillPlan === "institutional"
      ) {
        setPlan(prefillPlan);
      }
      const prefillEmail = searchParams.get("email");
      if (prefillEmail) setEmail(prefillEmail);
      const prefillName = searchParams.get("name");
      if (prefillName) setName(prefillName);
      const prefillOrg = searchParams.get("organization");
      if (prefillOrg) setOrganization(prefillOrg);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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
      setError(
        "Please share a short note on scope or timeline (at least 10 characters).",
      );
      return;
    }

    setSubmitting(true);
    const utm = readUtm();
    const captchaToken = await getToken();

    try {
      const res = await fetch("/api/quote/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          organization: organization.trim() || undefined,
          plan,
          message: message.trim(),
          tl_hp: honeypot,
          captchaToken,
          utm: utm
            ? {
                source: utm.source,
                medium: utm.medium,
                campaign: utm.campaign,
                content: utm.content,
                term: utm.term,
              }
            : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit quote request.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
        <p className="text-sm font-medium text-tl-trust">Quote requested</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
          Thank you — we will send your quote
        </h1>
        <p className="mt-3 text-sm text-tl-ink-muted">
          Our team will follow up with a quotation / invoice for EFT. After
          payment clears, we provision your Plan Owner (admin) login. You will
          then invite teammates at lower roles per your plan.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 text-sm">
          <Link
            href="/product"
            className="rounded-md bg-tl-trust px-4 py-2 font-medium text-white hover:bg-tl-trust-ink"
          >
            Product overview
          </Link>
          <Link
            href="/trial"
            className="rounded-md border border-tl-line px-4 py-2 font-medium hover:bg-tl-paper"
          >
            Back to trial options
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">Request a quote</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Quote &amp; EFT for TrustLedger
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Soft-launch path while card checkout finalises. We send a quote /
        invoice; you pay by EFT; we confirm payment and issue your Plan Owner
        access.
      </p>

      <form
        onSubmit={handleSubmit}
        className="relative mt-8 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
      >
        <HoneypotField value={honeypot} onChange={setHoneypot} />
        <div>
          <label htmlFor="quote-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="quote-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="quote-email" className="mb-1 block text-sm font-medium">
            Work email
          </label>
          <input
            id="quote-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="quote-org" className="mb-1 block text-sm font-medium">
            Organization{" "}
            <span className="font-normal text-tl-ink-muted">(optional)</span>
          </label>
          <input
            id="quote-org"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Plan</legend>
          <div className="space-y-2">
            {PLANS.map((p) => (
              <label
                key={p.id}
                className="flex cursor-pointer gap-3 rounded-md border border-tl-line px-3 py-2 text-sm has-[:checked]:border-tl-trust"
              >
                <input
                  type="radio"
                  name="plan"
                  value={p.id}
                  checked={plan === p.id}
                  onChange={() => setPlan(p.id)}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold">{p.label}</span>
                  <span className="mt-0.5 block text-tl-ink-muted">{p.blurb}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label
            htmlFor="quote-message"
            className="mb-1 block text-sm font-medium"
          >
            Scope, timeline, or notes
          </label>
          <textarea
            id="quote-message"
            required
            minLength={10}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>

        {error ? (
          <p className="text-sm text-tl-danger" role="alert">
            {error}
          </p>
        ) : null}

        <RecaptchaLegalNote />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Request quote"}
        </button>
      </form>

      <p className="mt-4 text-xs text-tl-ink-muted">
        Prefer card checkout when available?{" "}
        <Link href="/pay" className="font-medium text-tl-trust-ink underline">
          Open Paystack checkout
        </Link>
        {" · "}
        Campaign: {utmLabel}
      </p>
    </main>
  );
}

export default function QuotePage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Request a quote</h1>
        </main>
      }
    >
      <QuoteForm />
    </Suspense>
  );
}
