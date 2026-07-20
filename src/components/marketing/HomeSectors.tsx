const SECTORS = [
  {
    name: "Mining",
    outcome: "Cut grievance backlog days with ward-to-site escalation clarity.",
  },
  {
    name: "Energy",
    outcome: "Keep host-community commitments visible before outage risk rises.",
  },
  {
    name: "Public Sector",
    outcome: "Produce audit-ready engagement evidence for oversight and funding.",
  },
  {
    name: "Infrastructure",
    outcome: "Protect delivery timelines with early trust-signal monitoring.",
  },
] as const;

export function HomeSectors() {
  return (
    <section
      id="sectors"
      className="bg-tl-paper"
      aria-labelledby="sectors-title"
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-tl-trust">
            Sectors
          </p>
          <h2
            id="sectors-title"
            className="mt-2 font-display text-2xl font-semibold text-tl-ink sm:text-3xl"
          >
            Built for environments where trust is operational risk
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {SECTORS.map((sector) => (
            <article
              key={sector.name}
              className="rounded-xl border border-tl-line bg-tl-surface p-6"
            >
              <h3 className="text-lg font-semibold text-tl-ink">{sector.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tl-ink-muted">
                {sector.outcome}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
