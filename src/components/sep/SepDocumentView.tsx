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
      <header className="border-b border-tl-line pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-tl-trust">
          TrustLedger · Stakeholder Engagement Plan
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-tl-ink sm:text-[1.75rem]">
          {plan.title}
        </h2>
        <p className="mt-2 text-sm text-tl-ink-muted">
          {SEP_SECTOR_LABELS[plan.sectorId]} · {SEP_SOURCE_LABELS[plan.sourceKind]}{" "}
          · {SEP_STATUS_LABELS[plan.status]} · Issued {issued}
        </p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {plan.projectNameHint ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-tl-ink-muted">
                Assignment
              </dt>
              <dd>{plan.projectNameHint}</dd>
            </div>
          ) : null}
          {plan.clientFunderHint ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-tl-ink-muted">
                Client / procuring entity
              </dt>
              <dd>{plan.clientFunderHint}</dd>
            </div>
          ) : null}
          {plan.placeHint ? (
            <div>
              <dt className="text-xs uppercase tracking-wide text-tl-ink-muted">
                Place
              </dt>
              <dd>{plan.placeHint}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs uppercase tracking-wide text-tl-ink-muted">
              Plan ID
            </dt>
            <dd className="font-mono text-xs">{plan.id}</dd>
          </div>
        </dl>
      </header>

      <div className="mt-8 space-y-8">
        {plan.documentSections.map((section) => (
          <section key={section.id}>
            <h3 className="font-display text-lg font-semibold text-tl-ink">
              {section.heading}
            </h3>
            <div className="mt-2">
              <SepRichText text={section.body} />
            </div>
          </section>
        ))}
      </div>

      <footer className="mt-10 border-t border-tl-line pt-4 text-xs text-tl-ink-muted">
        Prepared on the TrustLedger SRM desk from the supplied briefing extract
        and a sector playbook. Not legal advice. Not a substitute for statutory
        processes named in the briefing. Humans apply rows to the live desk —
        the composer never writes them alone.
      </footer>
    </article>
  );
}
