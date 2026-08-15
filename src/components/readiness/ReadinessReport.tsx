"use client";

import Link from "next/link";
import { ExperienceFeedbackForm } from "@/components/forms/ExperienceFeedbackForm";
import {
  ASSESSMENT_QUESTIONS,
  LIKERT_OPTIONS,
  dimensionById,
} from "@/data/assessment";
import {
  readinessUtm,
  riskToneClass,
} from "@/lib/assessmentClient";
import { useReadinessSession } from "@/lib/useReadinessSession";
import type { LikertValue } from "@/types/assessment";

function likertLabel(value: LikertValue | undefined): string {
  if (!value) return "Not answered";
  return LIKERT_OPTIONS.find((o) => o.value === value)?.label ?? String(value);
}

export function ReadinessReport() {
  const { session, ready } = useReadinessSession();

  if (!ready || !session) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-14">
        <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
        <p className="mt-3 text-sm text-tl-ink-muted">Loading your report…</p>
      </main>
    );
  }

  const { result, answers } = session;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold text-tl-ink">
          Your readiness report
        </h1>
        <Link
          href="/readiness/next"
          className="text-sm font-medium text-tl-trust-ink underline underline-offset-2"
        >
          Back to hub
        </Link>
      </div>
      <p className="mt-3 text-sm text-tl-ink-muted">{result.riskSummary}</p>

      <div className="mt-8 grid gap-6 border-y border-tl-line py-6 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Overall score
          </p>
          <p className="mt-1 font-display text-4xl font-semibold tabular-nums text-tl-ink">
            {result.overallScore}
            <span className="text-lg font-normal text-tl-ink-muted"> / 100</span>
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Risk level
          </p>
          <p
            className={`mt-1 font-display text-3xl font-semibold ${riskToneClass(result.riskBand)}`}
          >
            {result.riskLabel}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            First win with TrustLedger
          </p>
          <p className="mt-1 text-sm font-medium text-tl-ink">
            Stabilize top gaps in about 1–2 weeks on a pilot site
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-tl-ink">
          Six governance dimensions
        </h2>
        <ul className="mt-4 space-y-3">
          {result.dimensions.map((dim) => (
            <li key={dim.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium text-tl-ink">{dim.label}</span>
                <span className="tabular-nums text-tl-ink-muted">{dim.score}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-tl-line">
                <div
                  className="h-full rounded-full bg-tl-trust transition-[width] duration-500"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-tl-ink">
          Top priorities
        </h2>
        <ol className="mt-4 space-y-3">
          {result.topPriorities.map((id, i) => {
            const dim = dimensionById(id);
            const score =
              result.dimensions.find((d) => d.id === id)?.score ?? 0;
            return (
              <li key={id} className="border-l-2 border-tl-trust pl-4">
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
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-tl-ink">
          Dimension detail &amp; turnaround plan
        </h2>
        <p className="mt-2 text-sm text-tl-ink-muted">
          For each response: what you indicated, what it means, a DIY outline,
          and honest TrustLedger timeframes (stabilize, operationalize, govern).
        </p>

        <div className="mt-6 space-y-10">
          {result.dimensions.map((dimScore) => {
            const dim = dimensionById(dimScore.id);
            const qs = ASSESSMENT_QUESTIONS.filter(
              (q) => q.dimensionId === dim.id,
            );
            return (
              <article key={dim.id} className="scroll-mt-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold text-tl-ink">
                    {dim.label}
                  </h3>
                  <p className="text-sm tabular-nums text-tl-ink-muted">
                    Score {dimScore.score}/100
                  </p>
                </div>
                <p className="mt-1 text-sm text-tl-ink-muted">{dim.issue}</p>

                <ul className="mt-4 space-y-2">
                  {qs.map((q) => {
                    const value = answers[q.id] as LikertValue | undefined;
                    return (
                      <li key={q.id} className="text-sm">
                        <p className="text-tl-ink">{q.prompt}</p>
                        <p className="mt-0.5 text-tl-ink-muted">
                          Your rating:{" "}
                          <span className="font-medium text-tl-ink">
                            {likertLabel(value)}
                          </span>
                          {value ? (
                            <span className="tabular-nums"> ({value}/5)</span>
                          ) : null}
                        </p>
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                      DIY outline
                    </h4>
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
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-tl-trust-ink">
                      With TrustLedger
                    </h4>
                    <ul className="mt-2 space-y-1.5 text-sm text-tl-ink-muted">
                      <li>
                        <span className="font-medium text-tl-ink">
                          Stabilize (wk 1–2):
                        </span>{" "}
                        {dim.tlStabilize}
                      </li>
                      <li>
                        <span className="font-medium text-tl-ink">
                          Operationalize (~30d):
                        </span>{" "}
                        {dim.tlOperationalize}
                      </li>
                      <li>
                        <span className="font-medium text-tl-ink">
                          Govern (60–90d):
                        </span>{" "}
                        {dim.tlGovern}
                      </li>
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-12 border-t border-tl-line pt-8">
        <h2 className="font-display text-lg font-semibold text-tl-ink">
          Put this into practice
        </h2>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Return to the hub to choose product intro, a 14-day trial, or a
          walkthrough — or jump straight in.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link
            href="/readiness/next"
            className="inline-flex justify-center rounded-md bg-tl-trust px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Back to choice hub
          </Link>
          <Link
            href={`/trial?${readinessUtm("report_trial")}`}
            className="inline-flex justify-center rounded-md border border-tl-line bg-tl-surface px-4 py-2.5 text-center text-sm font-medium text-tl-ink hover:bg-tl-paper"
          >
            Start 14-day trial
          </Link>
          <Link
            href={`/quote?${readinessUtm("report_walkthrough")}`}
            className="inline-flex justify-center rounded-md border border-tl-line px-4 py-2.5 text-center text-sm font-medium text-tl-ink hover:bg-tl-paper"
          >
            Request walkthrough
          </Link>
        </div>
      </section>

      <div className="mt-10">
        <ExperienceFeedbackForm
          contextPath="/readiness/report"
          defaultEmail={session.email}
          defaultName={session.name}
          heading="How was this report?"
          description="Your notes shape launch readiness — what was clear, missing, or useful."
        />
      </div>
    </main>
  );
}
