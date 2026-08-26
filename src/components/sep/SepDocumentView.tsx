import { SepRichText } from "@/components/sep/SepRichText";
import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
} from "@/lib/sepMatrix";
import { SEP_ISSUER_LINE, sepCoverBlurb } from "@/lib/sepDocument";
import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_PROGRAMME_LABELS,
  SEP_PURPOSE_LABELS,
  SEP_SECTOR_LABELS,
} from "@/types/engagementPlan";

type Props = {
  plan: EngagementPlan;
};

export function SepDocumentView({ plan }: Props) {
  const issued = new Date(plan.updatedAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      id="tl-sep-document"
      className="rounded-lg border border-tl-line bg-tl-surface px-5 py-8 shadow-sm sm:px-10 sm:py-12"
    >
      <header className="sep-cover border-b border-tl-line pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tl-trust">
          TrustLedger
        </p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-tl-ink-muted">
          Chibase Consulting
        </p>
        <p className="mt-3 text-sm font-medium text-tl-trust">
          Stakeholder Engagement Plan
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
          {plan.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-tl-ink-muted">
          {sepCoverBlurb(plan)}
        </p>
        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          <Meta label="Prepared by" value="Chibase Consulting" />
          {plan.clientFunderHint ? (
            <Meta label="Prepared for" value={plan.clientFunderHint} />
          ) : null}
          {plan.programmeKind === "relocation" ? (
            <Meta
              label="Programme"
              value={SEP_PROGRAMME_LABELS.relocation}
            />
          ) : null}
          <Meta label="Sector" value={SEP_SECTOR_LABELS[plan.sectorId]} />
          {plan.projectNameHint ? (
            <Meta label="Assignment" value={plan.projectNameHint} />
          ) : null}
          {plan.placeHint ? <Meta label="Place" value={plan.placeHint} /> : null}
          {plan.timelineHint ? (
            <Meta label="Timeline" value={plan.timelineHint} />
          ) : null}
          {plan.budgetHint ? (
            <Meta label="Budget (as briefed)" value={plan.budgetHint} />
          ) : null}
          <Meta label="Issued" value={issued} />
        </dl>
      </header>

      <div className="mt-10 space-y-10">
        {plan.documentSections.map((section) => (
          <section key={section.id} className="break-inside-avoid">
            <h3 className="font-display text-lg font-semibold text-tl-ink">
              {section.heading}
            </h3>
            <div className="mt-2">
              <SepRichText text={section.body} />
            </div>
            {section.id === "stakeholders" ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[36rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
                      <th className="py-2 pr-3 font-medium">Class</th>
                      <th className="py-2 pr-3 font-medium">Influence</th>
                      <th className="py-2 pr-3 font-medium">Interest</th>
                      <th className="py-2 pr-3 font-medium">Quadrant</th>
                      <th className="py-2 font-medium">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.stakeholderClasses.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-tl-line align-top"
                      >
                        <td className="py-2 pr-3 font-medium text-tl-ink">
                          {row.label}
                        </td>
                        <td className="py-2 pr-3 capitalize text-tl-ink-muted">
                          {row.influence}
                        </td>
                        <td className="py-2 pr-3 capitalize text-tl-ink-muted">
                          {interestForClass(row)}
                        </td>
                        <td className="py-2 pr-3 text-tl-ink-muted">
                          {SEP_QUADRANT_LABELS[quadrantForClass(row)]}
                        </td>
                        <td className="py-2 text-tl-ink-muted">
                          {SEP_PURPOSE_LABELS[row.purpose]}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="mt-10 border-t border-tl-line pt-4 text-xs text-tl-ink-muted">
        {SEP_ISSUER_LINE} Not legal advice. Not a substitute for statutory
        processes named in the briefing.
      </footer>
    </article>
  );
}

function Meta({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-tl-ink-muted">
        {label}
      </dt>
      <dd className={mono ? "font-mono text-xs" : undefined}>{value}</dd>
    </div>
  );
}
