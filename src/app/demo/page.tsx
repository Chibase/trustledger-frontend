"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HoneypotField, useRecaptcha } from "@/components/forms/FormGuards";
import { isWorkEmail } from "@/data/assessment";
import { captureUtmFromSearchParams, formatUtmSummary, readUtm } from "@/lib/utm";
import { USER_ROLES, type UserRole } from "@/types/rbac";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sanitizeNext(value: string | null): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/app/dashboard";
}

function DemoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = sanitizeNext(searchParams.get("next"));
  const { getToken } = useRecaptcha("demo_entry");
  const [role, setRole] = useState<UserRole>("community");
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
        "/demo",
      );
      setUtmLabel(formatUtmSummary(captured ?? readUtm()));
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
        setError(data.error ?? "Could not start demo. Try again.");
        return;
      }

      window.localStorage.setItem("tl-lead-email", email.trim().toLowerCase());
      window.localStorage.setItem("tl-lead-dismissed", "1");
      window.localStorage.setItem("tl-demo-lead-source", "demo_entry");

      document.cookie = `session-role=${role}; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
      document.cookie = `tl-mode=demo; path=/; max-age=${SESSION_MAX_AGE_SECONDS}; samesite=lax`;
      router.push(next.startsWith("/app") ? next : "/app/dashboard");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-full max-w-lg flex-col justify-center px-4 py-12">
      <p className="text-sm font-medium text-tl-trust">TrustLedger Demo</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Try the product with sample data
      </h1>
      <p className="mt-3 text-sm text-tl-ink-muted">
        Enter your work details, pick a stakeholder role, then explore
        dashboards and AI assist on sample data — nothing writes to a live
        project.
      </p>

      <form
        onSubmit={handleSubmit}
        className="relative mt-8 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
      >
        <HoneypotField value={honeypot} onChange={setHoneypot} />
        <div>
          <label htmlFor="demo-name" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="demo-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="demo-email" className="mb-1 block text-sm font-medium">
            Work email
          </label>
          <input
            id="demo-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="demo-org" className="mb-1 block text-sm font-medium">
            Organization{" "}
            <span className="font-normal text-tl-ink-muted">(optional)</span>
          </label>
          <input
            id="demo-org"
            name="organization"
            autoComplete="organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="demo-comment" className="mb-1 block text-sm font-medium">
            What do you want to see or solve?
          </label>
          <textarea
            id="demo-comment"
            name="comment"
            required
            minLength={10}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Ward grievance intake and SLA reporting for two pilot projects"
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="role" className="mb-1 block text-sm font-medium">
            Enter as
          </label>
          <select
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value as UserRole)}
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
          By starting the demo you agree we may contact you about TrustLedger.
          See our{" "}
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
          {submitting ? "Starting…" : "Start demo"}
        </button>
      </form>

      <p className="mt-4 text-xs text-tl-ink-muted">Campaign: {utmLabel}</p>
    </main>
  );
}

export default function DemoPage() {
  return (
    <Suspense
      fallback={
        <main className="p-6">
          <h1 className="font-display text-2xl font-semibold">TrustLedger Demo</h1>
        </main>
      }
    >
      <DemoForm />
    </Suspense>
  );
}
