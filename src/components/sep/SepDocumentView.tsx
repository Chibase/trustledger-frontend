import { SepRichText } from "@/components/sep/SepRichText";
import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_SECTOR_LABELS,
  SEP_SOURCE_LABELS,
  SEP_STATUS_LABELS,
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
          TrustLedger SRM
        </p>
        <p className="mt-3 text-sm font-medium text-tl-trust">
          Stakeholder Engagement Plan
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
          {plan.title}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-tl-ink-muted">
          Tender-grade working plan mapped to Social Licence to Build™ and
          executed on the TrustLedger desk after award. Suggestion until a human
          applies rows. Not legal advice.
        </p>
        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          <Meta label="Sector" value={SEP_SECTOR_LABELS[plan.sectorId]} />
          <Meta
            label="Source"
            value={`${SEP_SOURCE_LABELS[plan.sourceKind]} · ${SEP_STATUS_LABELS[plan.status]}`}
          />
          {plan.projectNameHint ? (
            <Meta label="Assignment" value={plan.projectNameHint} />
          ) : null}
          {plan.clientFunderHint ? (
            <Meta label="Client / procuring entity" value={plan.clientFunderHint} />
          ) : null}
          {plan.placeHint ? <Meta label="Place" value={plan.placeHint} /> : null}
          {plan.timelineHint ? (
            <Meta label="Timeline" value={plan.timelineHint} />
          ) : null}
          <Meta label="Issued" value={issued} />
          <Meta label="Plan ID" value={plan.id} mono />
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
            {section.protocol ? (
              <div className="mt-4 rounded-md border border-dashed border-tl-trust/40 bg-tl-trust/5 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
                  TrustLedger SRM execution protocol
                </p>
                <div className="mt-2">
                  <SepRichText text={section.protocol} />
                </div>
              </div>
            ) : null}
          </section>
        ))}
      </div>

      <footer className="mt-10 border-t border-tl-line pt-4 text-xs text-tl-ink-muted">
        Prepared on the TrustLedger SRM desk from the supplied briefing extract
        or facts pack and a sector playbook. Not legal advice. Not a substitute
        for statutory processes named in the briefing. Humans apply rows to the
        live desk — the composer never writes them alone.
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
