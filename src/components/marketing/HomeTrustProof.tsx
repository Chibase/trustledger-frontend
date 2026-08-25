const ASSURANCES = [
  "Privacy-first lead capture",
  "No spam — contact only when you ask",
  "Secure handling of field and case data",
] as const;

export function HomeTrustProof() {
  return (
    <section className="bg-tl-surface" aria-labelledby="trust-title">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-tl-ink-muted">
          How we handle contact and field data
        </p>
        <h2 id="trust-title" className="sr-only">
          Trust assurances
        </h2>

        <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-tl-ink-muted">
          {ASSURANCES.map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="text-tl-trust" aria-hidden>
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
