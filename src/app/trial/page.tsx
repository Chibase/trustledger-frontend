"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HoneypotField, useRecaptcha } from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";
import { captureUtmFromSearchParams, formatUtmSummary, readUtm } from "@/lib/utm";
import { USER_ROLES, type UserRole } from "@/types/rbac";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type Step = "capture" | "choose";

function TrialForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useRecaptcha("demo_entry");
  const [step, setStep] = useState<Step>("capture");
  const [role, setRole] = useState<UserRole>("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [utmLabel, setUtmLabel] = useState("None");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const captured = captureUtmFromSearchParams(
        new URLSearchParams(searchParams.toString()),
        "/trial",
      );
      setUtmLabel(formatUtmSummary(captured ?? readUtm()));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [searchParams]);

  async function handleCapture(event: React.FormEvent<HTMLFormElement>) {
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
    if (comment.trim().length < 10) {
      setError(
        "Please share a short note on what you want to see or solve (at least 10 characters).",
      );
      return;
    }

    setSubmitting(true);
    const utm = readUtm();
    const captchaToken = await getToken();

    try {
      const res = await fetch("/api/demo/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          organization: organization.trim() || undefined,
          comment: comment.trim(),
          tl_hp: honeypot,
          captchaToken,
          role,
          source: "demo_entry",
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
        setError(data.error ?? "Could not start trial. Try again.");
        return;
      }

      window.localStorage.setItem("tl-lead-email", email.trim().toLowerCase());
      window.localStorage.setItem("tl-lead-name", name.trim());
      window.localStorage.setItem(
        "tl-lead-org",
        organization.trim() || "",
      );
      window.localStorage.setItem("tl-lead-dismissed", "1");
      window.localStorage.setItem("tl-demo-lead-source", "trial_entry");
      setStep("choose");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function enterDemo() {
    document.cookie = `session-role=${role}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    document.cookie = `tl-mode=demo; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
    router.push("/app/dashboard");
  }

  function quoteUrl(plan: "practitioner" | "project" | "institutional") {
    const params = new URLSearchParams({
      plan,
      email: email.trim().toLowerCase(),
      name: name.trim(),
      utm_source: "trial",
      utm_medium: "funnel",
      utm_campaign: `quote_${plan}`,
    });
    if (organization.trim()) params.set("organization", organization.trim());
    return `/quote?${params.toString()}`;
  }

  if (step === "choose") {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
        <p className="text-sm font-medium text-tl-trust">Trial started</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
          What would you like to do next?
        </h1>
        <p className="mt-3 text-sm text-tl-ink-muted">
          Thanks, {name.split(" ")[0] || "there"}. Explore sample data, or
          request a quote (EFT / invoice). Ops confirms payment; Plan Owner
          access is provisioned manually while lockdown is on.
        </p>

        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={enterDemo}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-4 py-3 text-left hover:border-tl-trust/40"
          >
            <span className="block font-semibold">Explore the demo</span>
            <span className="mt-0.5 block text-sm text-tl-ink-muted">
              Sample dashboards and AI assist — no live project data
            </span>
          </button>

          <Link
            href={quoteUrl("practitioner")}
            className="block w-full rounded-md bg-tl-trust px-4 py-3 text-left text-white hover:bg-tl-trust-ink"
          >
            <span className="block font-semibold">
              Request quote · Practitioner
            </span>
            <span className="mt-0.5 block text-sm text-white/80">
              Quote + EFT — single Plan Owner seat
            </span>
          </Link>

          <Link
            href={quoteUrl("project")}
            className="block w-full rounded-md border border-tl-trust bg-tl-surface px-4 py-3 text-left hover:bg-tl-paper"
          >
            <span className="block font-semibold text-tl-ink">
              Request quote · Project
            </span>
            <span className="mt-0.5 block text-sm text-tl-ink-muted">
              Quote + EFT — owner + per-project seats
            </span>
          </Link>

          <Link
            href={quoteUrl("institutional")}
            className="block w-full rounded-md border border-tl-line px-4 py-3 text-left text-sm hover:bg-tl-paper"
          >
            <span className="font-semibold">Institutional / custom</span>
            <span className="mt-0.5 block text-tl-ink-muted">
              Request quote — sales-scoped
            </span>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">Start trial</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Begin with TrustLedger
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Share your details once. Next you can explore the sample demo or
        request a quote for EFT / invoice.
      </p>

      <form
        onSubmit={handleCapture}
        className="relative mt-8 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
      >
        <HoneypotField value={honeypot} onChange={setHoneypot} />
        <div>
          <label htmlFor="trial-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="trial-name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="trial-email" className="mb-1 block text-sm font-medium">
            Work email
          </label>
          <input
            id="trial-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="trial-org" className="mb-1 block text-sm font-medium">
            Organization{" "}
            <span className="font-normal text-tl-ink-muted">(optional)</span>
          </label>
          <input
            id="trial-org"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label
            htmlFor="trial-comment"
            className="mb-1 block text-sm font-medium"
          >
            What do you want to see or solve?
          </label>
          <textarea
            id="trial-comment"
            required
            minLength={10}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="trial-role" className="mb-1 block text-sm font-medium">
            Demo role (if you explore sample data)
          </label>
          <select
            id="trial-role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            {USER_ROLES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <p className="text-sm text-tl-danger" role="alert">
            {error}
          </p>
        ) : null}

        <p className="text-xs text-tl-ink-muted">
          By continuing you agree we may contact you about TrustLedger.{" "}
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

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Continue"}
        </button>
      </form>

      <p className="mt-4 text-xs text-tl-ink-muted">
        Already decided?{" "}
        <Link href="/quote" className="font-medium text-tl-trust-ink underline">
          Request a quote
        </Link>
        {" · "}
        <Link href="/pay" className="font-medium text-tl-trust-ink underline">
          Paystack checkout
        </Link>
        {" · "}
        Campaign: {utmLabel}
      </p>
    </main>
  );
}

export default function TrialPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">Start trial</h1>
        </main>
      }
    >
      <TrialForm />
    </Suspense>
  );
}
