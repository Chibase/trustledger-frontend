import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import { FunnelChart } from "@/components/ops/charts/FunnelChart";
import { TrendChart } from "@/components/ops/charts/TrendChart";
import { ExecutiveActions } from "@/components/ops/ExecutiveActions";
import { buildExecutiveBrief } from "@/lib/executiveIntel";

export const dynamic = "force-dynamic";

export default async function ExecutiveBoardPage() {
  const brief = await buildExecutiveBrief();
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
        <ExecutiveActions talkingPoints={brief.talkingPoints} />
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
