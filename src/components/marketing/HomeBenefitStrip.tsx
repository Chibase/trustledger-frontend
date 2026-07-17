const BENEFITS = [
  {
    title: "Faster grievance resolution",
    desc: "Route cases with clear ownership and SLA visibility from ward to board.",
  },
  {
    title: "Trust score visibility",
    desc: "See community trust signals before delays and shutdown risk escalate.",
  },
  {
    title: "Audit-ready ESG evidence",
    desc: "Capture defensible records for funders, regulators, and assurance teams.",
  },
] as const;

export function HomeBenefitStrip() {
  return (
    <section
      className="border-y border-tl-line bg-tl-surface"
      aria-label="Key outcomes"
    >
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        {BENEFITS.map((item) => (
          <div key={item.title} className="flex gap-3">
            <span
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-tl-trust/10"
              aria-hidden
            >
              <span className="h-2.5 w-2.5 rounded-sm bg-tl-trust" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-tl-ink">{item.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-tl-ink-muted">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
