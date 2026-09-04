import { SepRichText } from "@/components/sep/SepRichText";
import { sepCoverFields, sepPreparedBy } from "@/lib/sepDocument";
import type { EngagementPlan, SepDocumentTable } from "@/types/engagementPlan";

type Props = {
  plan: EngagementPlan;
};

export function SepDocumentView({ plan }: Props) {
  const fields = sepCoverFields(plan);

  return (
    <article
      id="tl-sep-document"
      className="rounded-lg border border-tl-line bg-tl-surface px-5 py-8 shadow-sm sm:px-10 sm:py-12"
    >
      <header className="sep-cover border-b border-tl-line pb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-tl-ink-muted">
          TrustLedger · Social Engagement &amp; Participation
        </p>
        <h2 className="mt-6 font-display text-3xl font-semibold tracking-tight text-tl-ink sm:text-4xl">
          Stakeholder Engagement Plan
        </h2>
        <p className="mt-2 text-lg font-medium text-tl-trust-ink">
          {plan.projectNameHint || plan.title}
        </p>
        <table className="mt-8 w-full text-left text-sm">
          <tbody>
            {fields.map(([label, value]) => (
              <tr key={label} className="border-b border-tl-line align-top">
                <th className="w-[34%] py-2 pr-4 text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                  {label}
                </th>
                <td className="py-2 text-tl-ink">{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
            {(section.tables || []).map((table) => (
              <SectionTable key={table.headers.join("|")} table={table} />
            ))}
          </section>
        ))}
      </div>

      <footer className="mt-10 border-t border-tl-line pt-4 text-xs text-tl-ink-muted">
        {sepPreparedBy(plan)} Not legal advice. Not a substitute for statutory
        processes named in the briefing.
      </footer>
    </article>
  );
}

function SectionTable({ table }: { table: SepDocumentTable }) {
  return (
    <div className="mt-4 overflow-x-auto">
      {table.caption ? (
        <p className="mb-2 text-xs italic text-tl-ink-muted">{table.caption}</p>
      ) : null}
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-tl-trust text-white">
            {table.headers.map((header) => (
              <th
                key={header}
                className="px-2 py-2 text-xs font-semibold uppercase tracking-wide"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-tl-line align-top even:bg-tl-paper"
            >
              {row.map((cell, j) => (
                <td key={j} className="px-2 py-2 text-tl-ink">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
