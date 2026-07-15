import Link from "next/link";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { FunnelChart } from "@/components/ops/charts/FunnelChart";
import { TrendChart } from "@/components/ops/charts/TrendChart";
import { ExecutiveActions } from "@/components/ops/ExecutiveActions";
import {
  CONTROL_PILLARS,
  pillarStatusLabel,
} from "@/lib/commandCentreIntel";
import { buildExecutiveBrief } from "@/lib/executiveIntel";
import { listRecentPayments } from "@/lib/paymentIntel";

export const dynamic = "force-dynamic";

export default async function ExecutiveBoardPage() {
  const [brief, payments] = await Promise.all([
    buildExecutiveBrief(),
    listRecentPayments(5),
  ]);
  const asOf = new Date(brief.generatedAt).toLocaleString();

  return (
    <div className="space-y-8 print:space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-tl-line pb-6">
        <div>
          <p className="text-sm font-medium text-tl-trust">Executive Board</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight text-tl-ink md:text-4xl">
            TrustLedger brief
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
            Board and investor overview — platform traction, engagement mix, and
            experience signals. For day-to-day queues use Ops activity.
          </p>
          <p className="mt-2 text-xs text-tl-ink-muted">As of {asOf}</p>
        </div>
        <ExecutiveActions
          talkingPoints={brief.talkingPoints}
          quotes={brief.voice.quotes.slice(0, 5).map((q) => q.quote)}
        />
      </header>

      {!brief.ok ? (
        <p className="rounded-md border border-tl-amber/40 bg-tl-amber/10 px-3 py-2 text-sm">
          {brief.detail || "Some executive intel could not be loaded."}
        </p>
      ) : null}

      {brief.sampleNote ? (
        <p className="text-sm text-tl-ink-muted">{brief.sampleNote}</p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Pipeline signals"
          value={String(brief.kpis.pipelineSignals)}
          hint="Latest CRM engagement window"
        />
        <Kpi
          label="Demo interest"
          value={String(brief.kpis.demoInterest)}
          hint="Board-ready demand signal"
        />
        <Kpi
          label="Assessments"
          value={String(brief.kpis.assessments)}
          hint="Readiness / product depth"
        />
        <Kpi
          label="Experience score"
          value={
            brief.kpis.experienceScore != null
              ? `${brief.kpis.experienceScore}/5`
              : "—"
          }
          hint={
            brief.kpis.weakFeedback > 0
              ? `${brief.kpis.weakFeedback} weak ratings`
              : "Rated feedback average"
          }
          tone={brief.kpis.weakFeedback > 0 ? "attention" : "default"}
        />
      </section>

      {payments.recent.length ? (
        <section className="rounded-lg border border-tl-trust/30 bg-tl-surface p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">
              Payment notifications
            </h2>
            <Link
              href="/ops/finance"
              className="text-xs font-medium text-tl-trust-ink underline"
            >
              Finance desk
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {payments.recent.map((p) => (
              <li
                key={p.name}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-tl-line pb-2 last:border-0 last:pb-0"
              >
                <span>
                  <span className="font-medium">{p.person}</span>
                  <span className="text-tl-ink-muted">
                    {" "}
                    · {p.planLabel} · {p.amountLabel}
                  </span>
                </span>
                <span className="text-xs text-tl-ink-muted">
                  {p.modified ? new Date(p.modified).toLocaleString() : "—"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-lg font-semibold">
            Command control
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Finance, staff, AI governance, and client issue turnaround.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {CONTROL_PILLARS.map((pillar) => (
            <Link
              key={pillar.href}
              href={pillar.href}
              className="block rounded-lg border border-tl-line bg-tl-surface p-4 hover:border-tl-trust/40"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-semibold">{pillar.title}</h3>
                <span className="text-[11px] uppercase tracking-wide text-tl-ink-muted">
                  {pillarStatusLabel(pillar.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-tl-ink-muted">{pillar.blurb}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-lg border border-tl-line bg-tl-surface p-5 lg:col-span-3">
          <h2 className="font-display text-lg font-semibold">
            Weekly engagement trend
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Last eight weeks of platform activity signals.
          </p>
          <div className="mt-4">
            <TrendChart
              points={brief.weekly.map((w) => ({
                label: w.label,
                value: w.total,
              }))}
            />
          </div>
        </div>

        <div className="rounded-lg border border-tl-line bg-tl-surface p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Activity mix</h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Where visitors and clients are engaging.
          </p>
          <div className="mt-4">
            <HorizontalBarChart
              bars={brief.mix.map((m) => ({
                label: m.label,
                value: m.value,
              }))}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
          <h2 className="font-display text-lg font-semibold">
            Conversion funnel
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Interest → depth → voice → enquiry.
          </p>
          <div className="mt-5">
            <FunnelChart
              steps={brief.funnel.map((f) => ({
                label: f.label,
                value: f.value,
              }))}
            />
          </div>
        </div>

        <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
          <h2 className="font-display text-lg font-semibold">
            Experience ratings
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Distribution of 1–5 feedback scores.
          </p>
          <div className="mt-4">
            <VerticalBarChart
              bars={brief.ratings.map((r) => ({
                label: `${r.rating}`,
                value: r.count,
              }))}
            />
          </div>
          {brief.readiness.length ? (
            <div className="mt-6 border-t border-tl-line pt-4">
              <h3 className="text-sm font-semibold">Assessment readiness</h3>
              <ul className="mt-2 space-y-1 text-sm text-tl-ink-muted">
                {brief.readiness.slice(0, 5).map((r) => (
                  <li key={r.band} className="flex justify-between gap-3">
                    <span>{r.band}</span>
                    <span className="font-medium text-tl-ink">{r.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-xl font-semibold">
            Who is engaging
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Demographics for board packs — origin, industry, and influence.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-tl-ink-muted">
              Where they come from
            </h3>
            <div className="mt-4">
              <HorizontalBarChart bars={brief.voice.origins} />
            </div>
          </div>
          <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-tl-ink-muted">
              Industry / sector
            </h3>
            <div className="mt-4">
              <HorizontalBarChart bars={brief.voice.industries} />
            </div>
          </div>
          <div className="rounded-lg border border-tl-line bg-tl-surface p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-tl-ink-muted">
              Influence level
            </h3>
            <div className="mt-4">
              <HorizontalBarChart bars={brief.voice.influence} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-lg border border-tl-line bg-tl-surface p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">
            Sentiment & perception
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            How visitors experience TrustLedger in use.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-tl-ink">
            {brief.voice.perceptionSummary}
          </p>
          <div className="mt-4">
            <HorizontalBarChart bars={brief.voice.sentiments} />
          </div>
        </div>

        <div className="rounded-lg border border-tl-line bg-tl-surface p-5 lg:col-span-3">
          <h2 className="font-display text-lg font-semibold">
            Exact words
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Verbatim comments for investor and board narrative — not paraphrased.
          </p>
          <ul className="mt-4 space-y-4">
            {brief.voice.quotes.length ? (
              brief.voice.quotes.map((q) => (
                <li
                  key={`${q.leadName}-${q.quote.slice(0, 24)}`}
                  className="border-l-2 border-tl-trust pl-3"
                >
                  <blockquote className="text-sm leading-relaxed text-tl-ink">
                    “{q.quote}”
                  </blockquote>
                  <p className="mt-2 text-xs text-tl-ink-muted">
                    <span className="font-medium text-tl-ink">{q.person}</span>
                    {q.organization ? ` · ${q.organization}` : ""}
                    {q.industry ? ` · ${q.industry}` : ""}
                    {" · "}
                    {q.activityLabel}
                    {q.rating != null ? ` · ${q.rating}/5` : ""}
                    {q.origin ? ` · ${q.origin}` : ""}
                  </p>
                </li>
              ))
            ) : (
              <li className="text-sm text-tl-ink-muted">
                No verbatim comments in the latest window yet.
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="rounded-lg border border-tl-ink/15 bg-tl-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold">
            Board talking points
          </h2>
          <p className="text-xs text-tl-ink-muted">
            Health:{" "}
            {brief.healthOk == null
              ? "n/a"
              : brief.healthOk
                ? "OK"
                : "Attention"}
            {brief.kpis.contactEnquiries
              ? ` · ${brief.kpis.contactEnquiries} contact enquiries`
              : ""}
          </p>
        </div>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
          {brief.talkingPoints.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "attention";
}) {
  return (
    <div className="rounded-lg border border-tl-line bg-tl-surface px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-3xl font-semibold tabular-nums ${
          tone === "attention" ? "text-tl-amber" : "text-tl-ink"
        }`}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-tl-ink-muted">{hint}</p> : null}
    </div>
  );
}
