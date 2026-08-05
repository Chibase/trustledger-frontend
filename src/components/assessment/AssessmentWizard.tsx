"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ASSESSMENT_DIMENSIONS,
  ASSESSMENT_LEAD_KEY,
  ASSESSMENT_QUESTIONS,
  ASSESSMENT_SECTORS,
  ASSESSMENT_STORAGE_KEY,
  LIKERT_OPTIONS,
  dimensionById,
  isWorkEmail,
  scoreAssessment,
} from "@/data/assessment";
import {
  ASSESSMENT_PENDING_KEY,
  ASSESSMENT_UNLOCK_KEY,
} from "@/lib/assessmentClient";
import { HoneypotField, RecaptchaLegalNote, useRecaptcha } from "@/components/forms/FormGuards";
import { captureUtmFromSearchParams, readUtm } from "@/lib/utm";
import type {
  AssessmentAnswers,
  AssessmentLeadPayload,
  AssessmentResult,
  LikertValue,
} from "@/types/assessment";

type Step = "intro" | "questions" | "lead" | "verify";

export function AssessmentWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  const [step, setStep] = useState<Step>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const { getToken } = useRecaptcha("assessment_lead");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");
  const [sector, setSector] = useState("");
  const [comment, setComment] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [leadError, setLeadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [pendingToken, setPendingToken] = useState("");
  const [otp, setOtp] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    captureUtmFromSearchParams(
      new URLSearchParams(searchParams.toString()),
      "/assessment",
    );

    const timer = window.setTimeout(() => {
      try {
        const unlock = sessionStorage.getItem(ASSESSMENT_UNLOCK_KEY);
        const raw = sessionStorage.getItem(ASSESSMENT_STORAGE_KEY);
        if (unlock && raw) {
          router.replace("/readiness/next");
          return;
        }
        const pending = sessionStorage.getItem(ASSESSMENT_PENDING_KEY);
        if (pending && raw) {
          const saved = JSON.parse(raw) as {
            answers: AssessmentAnswers;
            result: AssessmentResult;
          };
          if (saved?.result && saved?.answers) {
            setAnswers(saved.answers);
            setResult(saved.result);
            setPendingToken(pending);
            const leadRaw = sessionStorage.getItem(ASSESSMENT_LEAD_KEY);
            if (leadRaw) {
              const lead = JSON.parse(leadRaw) as {
                name?: string;
                email?: string;
              };
              if (lead.name) setName(lead.name);
              if (lead.email) setEmail(lead.email);
            }
            setStep("verify");
            return;
          }
        }
        // Resume lead unlock if the visitor refreshed after finishing questions.
        if (raw && !unlock && !pending) {
          const saved = JSON.parse(raw) as {
            answers: AssessmentAnswers;
            result: AssessmentResult;
          };
          if (saved?.result && saved?.answers) {
            setAnswers(saved.answers);
            setResult(saved.result);
            const leadRaw = sessionStorage.getItem(ASSESSMENT_LEAD_KEY);
            if (leadRaw) {
              const lead = JSON.parse(leadRaw) as {
                name?: string;
                email?: string;
              };
              if (lead.name) setName(lead.name);
              if (lead.email) setEmail(lead.email);
            }
            setStep("lead");
          }
        }
      } catch {
        /* ignore corrupt session */
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchParams, router]);

  const total = ASSESSMENT_QUESTIONS.length;
  const question = ASSESSMENT_QUESTIONS[index];
  const answeredProgress = useMemo(() => {
    if (step === "intro") return 0;
    if (step === "lead" || step === "verify") return 100;
    return Math.round((index / total) * 100);
  }, [index, step, total]);

  function persistResult(nextAnswers: AssessmentAnswers, nextResult: AssessmentResult) {
    sessionStorage.setItem(
      ASSESSMENT_STORAGE_KEY,
      JSON.stringify({ answers: nextAnswers, result: nextResult }),
    );
  }

  function finishUnlock(grantToken: string, leadName: string, leadEmail: string) {
    sessionStorage.setItem(ASSESSMENT_UNLOCK_KEY, grantToken);
    sessionStorage.setItem(
      ASSESSMENT_LEAD_KEY,
      JSON.stringify({ name: leadName, email: leadEmail }),
    );
    sessionStorage.removeItem(ASSESSMENT_PENDING_KEY);
    router.push("/readiness/next");
  }

  function start() {
    setStep("questions");
    setIndex(0);
    setAnswers({});
    setResult(null);
    sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    sessionStorage.removeItem(ASSESSMENT_LEAD_KEY);
    sessionStorage.removeItem(ASSESSMENT_PENDING_KEY);
    sessionStorage.removeItem(ASSESSMENT_UNLOCK_KEY);
  }

  function selectAnswer(value: LikertValue) {
    if (!question) return;
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);

    if (index < total - 1) {
      setIndex((i) => i + 1);
      return;
    }

    const scored = scoreAssessment(nextAnswers);
    setResult(scored);
    persistResult(nextAnswers, scored);
    setStep("lead");
  }

  function goBack() {
    if (step === "questions" && index > 0) {
      setIndex((i) => i - 1);
      return;
    }
    if (step === "questions" && index === 0) {
      setStep("intro");
      return;
    }
    if (step === "lead") {
      setStep("questions");
      setIndex(total - 1);
    }
    if (step === "verify") {
      setStep("lead");
    }
  }

  async function submitLead(event: React.FormEvent) {
    event.preventDefault();
    setLeadError(null);

    if (name.trim().length < 2) {
      setLeadError("Please enter your name.");
      return;
    }
    if (!isWorkEmail(email)) {
      setLeadError(
        "Please use a work email address. Personal free-mail domains are not accepted.",
      );
      return;
    }
    if (comment.trim().length < 10) {
      setLeadError(
        "Please share a short comment on what you need help with (at least 10 characters).",
      );
      return;
    }
    if (!result) {
      setLeadError("Complete the questions before requesting results.");
      return;
    }

    const utm = readUtm();
    const dimensionScores = Object.fromEntries(
      result.dimensions.map((d) => [d.id, d.score]),
    ) as AssessmentLeadPayload["dimensionScores"];
    const captchaToken = await getToken();

    const payload: AssessmentLeadPayload & {
      tl_hp?: string;
      captchaToken?: string;
    } = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      organization: organization.trim() || undefined,
      sector: sector || undefined,
      comment: comment.trim(),
      overallScore: result.overallScore,
      riskBand: result.riskBand,
      dimensionScores,
      topPriorities: result.topPriorities,
      answers,
      utm: utm
        ? {
            source: utm.source,
            medium: utm.medium,
            campaign: utm.campaign,
            content: utm.content,
            term: utm.term,
          }
        : undefined,
      landingPath: "/assessment",
      completedAt: result.completedAt,
      tl_hp: honeypot,
      captchaToken,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/assessment/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        requiresOtp?: boolean;
        pendingToken?: string;
        grantToken?: string;
      };
      if (!res.ok) {
        setLeadError(data.error ?? "Could not save your details. Try again.");
        return;
      }

      persistResult(answers, result);
      sessionStorage.setItem(
        ASSESSMENT_LEAD_KEY,
        JSON.stringify({ name: payload.name, email: payload.email }),
      );

      if (data.requiresOtp && data.pendingToken) {
        sessionStorage.setItem(ASSESSMENT_PENDING_KEY, data.pendingToken);
        setPendingToken(data.pendingToken);
        setOtp("");
        setVerifyError(null);
        setStep("verify");
        return;
      }

      if (data.grantToken) {
        finishUnlock(data.grantToken, payload.name, payload.email);
        return;
      }

      setLeadError("Could not unlock results. Try again.");
    } catch {
      setLeadError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function submitOtp(event: React.FormEvent) {
    event.preventDefault();
    setVerifyError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/assessment/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp.trim(), pendingToken }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        grantToken?: string;
        name?: string;
        email?: string;
      };
      if (!res.ok) {
        setVerifyError(data.error ?? "Could not verify code.");
        return;
      }
      if (!data.grantToken) {
        setVerifyError("Verification succeeded but unlock failed. Try again.");
        return;
      }
      finishUnlock(
        data.grantToken,
        data.name || name,
        data.email || email.trim().toLowerCase(),
      );
    } catch {
      setVerifyError("Network error. Check your connection and try again.");
    } finally {
      setVerifying(false);
    }
  }

  async function resendOtp() {
    setVerifyError(null);
    setResending(true);
    try {
      const res = await fetch("/api/assessment/verify", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pendingToken }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        pendingToken?: string;
      };
      if (!res.ok) {
        setVerifyError(data.error ?? "Could not resend code.");
        return;
      }
      if (data.pendingToken) {
        sessionStorage.setItem(ASSESSMENT_PENDING_KEY, data.pendingToken);
        setPendingToken(data.pendingToken);
      }
    } catch {
      setVerifyError("Network error. Check your connection and try again.");
    } finally {
      setResending(false);
    }
  }

  const shellClass = embed
    ? "mx-auto w-full max-w-2xl px-3 py-4"
    : "mx-auto w-full max-w-2xl px-4 py-10 sm:py-14";

  return (
    <main className={shellClass}>
      {!embed && (
        <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      )}

      {step !== "intro" && (
        <div className="mt-4" aria-hidden="true">
          <div className="h-1.5 overflow-hidden rounded-full bg-tl-line">
            <div
              className="h-full rounded-full bg-tl-trust transition-[width] duration-300"
              style={{ width: `${answeredProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-tl-ink-muted">
            {step === "questions"
              ? `Question ${index + 1} of ${total}`
              : step === "verify"
                ? "Confirm your email to open the hub"
                : "Almost done — unlock your results"}
          </p>
        </div>
      )}

      {step === "intro" && (
        <section className="mt-2">
          <h1 className="font-display text-3xl font-semibold text-tl-ink sm:text-4xl">
            SRM Readiness &amp; Risk Diagnostic
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-tl-ink-muted sm:text-base">
            A 5–8 minute assessment of grievance management, community
            engagement, and governance reporting maturity — built for
            organisations operating in the Global South.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-tl-ink">
            <li>Readiness score across 6 governance dimensions</li>
            <li>Risk level classification</li>
            <li>Top 3 priority actions with TrustLedger turnaround lanes</li>
            <li>Choice hub: report, product intro, trial, or walkthrough</li>
          </ul>
          <p className="mt-4 text-xs text-tl-ink-muted">
            {ASSESSMENT_QUESTIONS.length} questions · Likert scale · Work email
            + confirmation unlocks your report
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-8 w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink sm:w-auto"
          >
            Start assessment
          </button>
          {!embed && (
            <p className="mt-4 text-xs text-tl-ink-muted">
              Prefer the overview first?{" "}
              <a href="/readiness" className="underline underline-offset-2">
                Readiness promo
              </a>
            </p>
          )}
        </section>
      )}

      {step === "questions" && question && (
        <section className="mt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            {dimensionById(question.dimensionId).shortLabel}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-tl-ink">
            {question.prompt}
          </h2>
          {question.help && (
            <p className="mt-2 text-sm text-tl-ink-muted">{question.help}</p>
          )}

          <div
            className="mt-6 space-y-2"
            role="radiogroup"
            aria-label="Maturity rating"
          >
            {LIKERT_OPTIONS.map((option) => {
              const selected = answers[question.id] === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => selectAnswer(option.value)}
                  className={`flex w-full items-center justify-between rounded-md border px-4 py-3 text-left text-sm transition-colors ${
                    selected
                      ? "border-tl-trust bg-tl-trust/5 text-tl-trust-ink"
                      : "border-tl-line bg-tl-surface hover:border-tl-trust/50"
                  }`}
                >
                  <span>{option.label}</span>
                  <span className="font-medium tabular-nums text-tl-ink-muted">
                    {option.value}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper"
            >
              Back
            </button>
            <p className="text-xs text-tl-ink-muted">
              {answeredProgress}% complete
            </p>
          </div>
        </section>
      )}

      {step === "lead" && result && (
        <section className="mt-6">
          <h2 className="font-display text-2xl font-semibold text-tl-ink">
            Unlock your readiness report
          </h2>
          <p className="mt-2 text-sm text-tl-ink-muted">
            Enter your work details. We email a confirmation code so you can
            open your score, priorities, and next-step hub — not to share your
            answers publicly.
          </p>

          <form
            onSubmit={submitLead}
            className="relative mt-6 space-y-4 rounded-lg border border-tl-line bg-tl-surface p-5"
          >
            <HoneypotField value={honeypot} onChange={setHoneypot} />
            <div>
              <label htmlFor="lead-name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <input
                id="lead-name"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="lead-email"
                className="mb-1 block text-sm font-medium"
              >
                Work email
              </label>
              <input
                id="lead-email"
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
              <label
                htmlFor="lead-org"
                className="mb-1 block text-sm font-medium"
              >
                Organization{" "}
                <span className="font-normal text-tl-ink-muted">(optional)</span>
              </label>
              <input
                id="lead-org"
                name="organization"
                autoComplete="organization"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="lead-sector"
                className="mb-1 block text-sm font-medium"
              >
                Sector{" "}
                <span className="font-normal text-tl-ink-muted">(optional)</span>
              </label>
              <select
                id="lead-sector"
                name="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              >
                <option value="">Select sector</option>
                {ASSESSMENT_SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="lead-comment"
                className="mb-1 block text-sm font-medium"
              >
                What prompted this assessment?
              </label>
              <textarea
                id="lead-comment"
                name="comment"
                required
                minLength={10}
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Escalating community complaints and weak SLA visibility on current projects"
                className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
              />
            </div>

            {leadError && (
              <p className="text-sm text-tl-danger" role="alert">
                {leadError}
              </p>
            )}

            <p className="text-xs text-tl-ink-muted">
              By unlocking results you agree we may contact you about TrustLedger.
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

            <RecaptchaLegalNote />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Email me the unlock code"}
              </button>
            </div>
          </form>
        </section>
      )}

      {step === "verify" && (
        <section className="mt-6">
          <h2 className="font-display text-2xl font-semibold text-tl-ink">
            Confirm your email
          </h2>
          <p className="mt-2 text-sm text-tl-ink-muted">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-tl-ink">
              {email || "your work inbox"}
            </span>
            . Enter it to open your readiness hub.
          </p>

          <form onSubmit={submitOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="assessment-otp" className="mb-1 block text-sm font-medium">
                Verification code
              </label>
              <input
                id="assessment-otp"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="\d{6}"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-md border border-tl-line px-3 py-2 text-center font-mono text-lg tracking-[0.35em]"
                placeholder="••••••"
              />
            </div>

            {verifyError && (
              <p className="text-sm text-tl-danger" role="alert">
                {verifyError}
              </p>
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={goBack}
                className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                className="rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
              >
                {verifying ? "Verifying…" : "Open readiness hub"}
              </button>
            </div>
          </form>

          <button
            type="button"
            onClick={resendOtp}
            disabled={resending}
            className="mt-4 text-sm font-medium text-tl-trust-ink underline disabled:opacity-60"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>

          <p className="mt-6 text-xs text-tl-ink-muted">
            Dimensions covered:{" "}
            {ASSESSMENT_DIMENSIONS.map((d) => d.shortLabel).join(" · ")}
          </p>
        </section>
      )}
    </main>
  );
}
