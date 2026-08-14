const AUDIENCES = [
  {
    name: "Funders & DFIs",
    outcome: "See whether community issues are owned before covenant risk rises.",
  },
  {
    name: "Engineers & PMs",
    outcome: "Keep grievances and commitments on the same trail as delivery.",
  },
  {
    name: "MEL / M&E",
    outcome: "Report from the case and engagement trail, not reconstructed memory.",
  },
  {
    name: "Social facilitators",
    outcome: "Record consultations, customary counterparts, and promises after the meeting.",
  },
  {
    name: "Community members",
    outcome: "A fair trail: case IDs, acknowledgments, and commitments that do not vanish.",
  },
  {
    name: "Local government",
    outcome: "Defend engagement evidence for oversight and funding — Global South public sector.",
  },
] as const;

export function HomeAudiences() {
  return (
    <section
      id="audiences"
      className="border-b border-tl-line bg-tl-surface"
      aria-labelledby="audiences-title"
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-tl-trust">
            Who it is for
          </p>
          <h2
            id="audiences-title"
            className="mt-2 font-display text-2xl font-semibold text-tl-ink sm:text-3xl"
          >
            Built for the people who hold social licence — not one job title
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-tl-ink-muted">
            TrustLedger serves infrastructure and community-trust programmes in
            South Africa and the Global South. South African place packs are
            included baseline for SA plans — not the whole market.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((audience) => (
            <article
              key={audience.name}
              className="rounded-xl border border-tl-line bg-tl-paper p-5"
            >
              <h3 className="text-base font-semibold text-tl-ink">
                {audience.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
                {audience.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
