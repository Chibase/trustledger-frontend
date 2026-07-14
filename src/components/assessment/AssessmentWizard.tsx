"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { ExperienceFeedbackForm } from "@/components/forms/ExperienceFeedbackForm";
import { HoneypotField, useRecaptcha } from "@/components/forms/FormGuards";
import { captureUtmFromSearchParams, readUtm } from "@/lib/utm";
import type {
  AssessmentAnswers,
  AssessmentLeadPayload,
  AssessmentResult,
  LikertValue,
} from "@/types/assessment";

type Step = "intro" | "questions" | "lead" | "results";

function demoHref(campaign: string): string {
  const params = new URLSearchParams({
    utm_source: "assessment",
    utm_medium: "cta",
    utm_campaign: campaign,
  });
  return `/demo?${params.toString()}`;
}

function dashboardHref(): string {
  const params = new URLSearchParams({
    utm_source: "assessment",
    utm_medium: "cta",
    utm_campaign: "assessment",
  });
  return `/app/dashboard?${params.toString()}`;
}

function riskTone(band: AssessmentResult["riskBand"]): string {
  switch (band) {
    case "critical":
      return "text-tl-danger";
    case "elevated":
      return "text-tl-amber";
    case "moderate":
      return "text-tl-demo";
    case "strong":
      return "text-tl-trust-ink";
  }
}

export function AssessmentWizard() {
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

  useEffect(() => {
    captureUtmFromSearchParams(
      new URLSearchParams(searchParams.toString()),
      "/assessment",
    );

    const timer = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(ASSESSMENT_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw) as {
          answers: AssessmentAnswers;
          result: AssessmentResult;
        };
        if (saved?.result && saved?.answers) {
          setAnswers(saved.answers);
          setResult(saved.result);
          setStep("results");
        }
      } catch {
        /* ignore corrupt session */
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [searchParams]);

  const total = ASSESSMENT_QUESTIONS.length;
  const question = ASSESSMENT_QUESTIONS[index];
  const answeredProgress = useMemo(() => {
    if (step === "intro") return 0;
    if (step === "lead" || step === "results") return 100;
    return Math.round((index / total) * 100);
  }, [index, step, total]);

  function start() {
    setStep("questions");
    setIndex(0);
    setAnswers({});
    setResult(null);
    sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY);
  }

  function selectAnswer(value: LikertValue) {
    if (!question) return;
    const nextAnswers = { ...answers, [question.id]: value };
    setAnswers(nextAnswers);

    if (index < total - 1) {
      setIndex((i) => i + 1);
      return;
    }

    setResult(scoreAssessment(nextAnswers));
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
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setLeadError(data.error ?? "Could not save your details. Try again.");
        return;
      }

      sessionStorage.setItem(
        ASSESSMENT_STORAGE_KEY,
        JSON.stringify({ answers, result }),
      );
      sessionStorage.setItem(
        ASSESSMENT_LEAD_KEY,
        JSON.stringify({ name: payload.name, email: payload.email }),
      );
      setStep("results");
    } catch {
      setLeadError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function retake() {
    sessionStorage.removeItem(ASSESSMENT_STORAGE_KEY);
    sessionStorage.removeItem(ASSESSMENT_LEAD_KEY);
    setAnswers({});
    setResult(null);
    setName("");
    setEmail("");
    setOrganization("");
    setSector("");
    setComment("");
    setHoneypot("");
    setIndex(0);
    setStep("intro");
  }

  const shellClass = embed
    ? "mx-auto w-full max-w-2xl px-3 py-4"
    : "mx-auto w-full max-w-2xl px-4 py-10 sm:py-14";

  return (
    <main className={shellClass}>
      {!embed && (
        <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      )}

      {step !== "intro" && step !== "results" && (
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
            <li>Top 3 priority actions</li>
            <li>90-day action plan outline</li>
          </ul>
          <p className="mt-4 text-xs text-tl-ink-muted">
            {ASSESSMENT_QUESTIONS.length} questions · Likert scale · Results
            unlock after work email
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-8 w-full rounded-md bg-tl-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink sm:w-auto"
          >
            Start assessment
          </button>
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
            Unlock your readiness score
          </h2>
          <p className="mt-2 text-sm text-tl-ink-muted">
            Enter your work details to see your score across six dimensions, risk
            band, top priorities, and a 90-day outline. We use this to follow up
            with relevant TrustLedger guidance — not to share your answers
            publicly.
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
                Organization <span className="font-normal text-tl-ink-muted">(optional)</span>
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
                Sector <span className="font-normal text-tl-ink-muted">(optional)</span>
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
                {submitting ? "Saving…" : "Show my results"}
              </button>
            </div>
          </form>
        </section>
      )}

      {step === "results" && result && (
        <section className="mt-2 space-y-8">
          <div>
            <h1 className="font-display text-3xl font-semibold text-tl-ink">
              Your readiness results
            </h1>
            <p className="mt-2 text-sm text-tl-ink-muted">{result.riskSummary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                Overall score
              </p>
              <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-tl-ink">
                {result.overallScore}
                <span className="text-lg font-normal text-tl-ink-muted"> / 100</span>
              </p>
            </div>
            <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                Risk level
              </p>
              <p
                className={`mt-2 font-display text-3xl font-semibold ${riskTone(result.riskBand)}`}
              >
                {result.riskLabel}
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold">
              Six governance dimensions
            </h2>
            <ul className="mt-4 space-y-3">
              {result.dimensions.map((dim) => (
                <li key={dim.id}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="font-medium text-tl-ink">{dim.label}</span>
                    <span className="tabular-nums text-tl-ink-muted">
                      {dim.score}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-tl-line">
                    <div
                      className="h-full rounded-full bg-tl-trust"
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold">
              Top 3 priority actions
            </h2>
            <ol className="mt-4 space-y-4">
              {result.topPriorities.map((id, i) => {
                const dim = dimensionById(id);
                const score =
                  result.dimensions.find((d) => d.id === id)?.score ?? 0;
                return (
                  <li
                    key={id}
                    className="rounded-lg border border-tl-line bg-tl-surface p-4"
                  >
                    <p className="text-xs font-medium text-tl-ink-muted">
                      Priority {i + 1} · score {score}
                    </p>
                    <h3 className="mt-1 font-medium text-tl-ink">
                      {dim.priorityTitle}
                    </h3>
                    <p className="mt-1 text-sm text-tl-ink-muted">
                      {dim.prioritySummary}
                    </p>
                  </li>
                );
              })}
            </ol>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold">
              90-day action plan outline
            </h2>
            <div className="mt-4 space-y-4">
              {result.topPriorities.map((id) => {
                const dim = dimensionById(id);
                return (
                  <article
                    key={id}
                    className="border-l-2 border-tl-trust pl-4"
                  >
                    <h3 className="text-sm font-semibold text-tl-ink">
                      {dim.shortLabel}
                    </h3>
                    <ul className="mt-2 space-y-1.5 text-sm text-tl-ink-muted">
                      <li>
                        <span className="font-medium text-tl-ink">30 days:</span>{" "}
                        {dim.day30}
                      </li>
                      <li>
                        <span className="font-medium text-tl-ink">60 days:</span>{" "}
                        {dim.day60}
                      </li>
                      <li>
                        <span className="font-medium text-tl-ink">90 days:</span>{" "}
                        {dim.day90}
                      </li>
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              Put this into practice with TrustLedger
            </h2>
            <p className="mt-2 text-sm text-tl-ink-muted">
              Explore the interactive demo, or talk to Chibase Consulting about
              implementing the 90-day plan on your sites.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <a
                href={demoHref("assessment")}
                className="inline-flex justify-center rounded-md bg-tl-trust px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-tl-trust-ink"
              >
                Try the interactive demo
              </a>
              <a
                href={dashboardHref()}
                className="inline-flex justify-center rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-center text-sm font-medium text-tl-ink hover:bg-tl-paper"
              >
                Open dashboard
              </a>
              <a
                href="/contact"
                className="inline-flex justify-center rounded-md border border-tl-line px-4 py-2.5 text-center text-sm font-medium text-tl-ink hover:bg-tl-paper"
              >
                Contact us
              </a>
            </div>
          </div>

          <ExperienceFeedbackForm
            contextPath="/assessment"
            defaultEmail={email}
            defaultName={name}
            heading="How was this assessment?"
            description="Your notes shape launch readiness — what was clear, missing, or useful."
          />

          <button
            type="button"
            onClick={retake}
            className="text-sm font-medium text-tl-trust-ink underline"
          >
            Retake assessment
          </button>

          <p className="text-xs text-tl-ink-muted">
            Dimensions covered:{" "}
            {ASSESSMENT_DIMENSIONS.map((d) => d.shortLabel).join(" · ")}
          </p>
        </section>
      )}
    </main>
  );
}
