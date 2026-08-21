/**
 * Dual-governance sketch for the Chibase “cockroach theory” insight.
 * Uses locked field-ledger tokens — no cream brochure gold, no Helvetica.
 */
export function CockroachTheoryViz() {
  return (
    <figure className="my-8 overflow-hidden rounded-lg border border-tl-line bg-tl-paper">
      <div className="grid md:grid-cols-2">
        <div className="border-b border-tl-line p-5 md:border-b-0 md:border-r">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tl-ink-muted">
            Formal reality
          </p>
          <p className="mt-1 text-sm font-medium text-tl-ink">The organogram</p>
          <ol className="mt-4 flex flex-col items-stretch gap-2">
            <li className="rounded-md bg-tl-ink px-3 py-2.5 text-center text-sm font-medium text-white">
              Project HQ
            </li>
            <li className="mx-6 rounded-md bg-tl-demo px-3 py-2.5 text-center text-sm font-medium text-white">
              Municipality
            </li>
            <li className="mx-12 rounded-md bg-tl-ink-muted px-3 py-2.5 text-center text-sm font-medium text-white">
              Contractor
            </li>
          </ol>
        </div>
        <div className="p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tl-amber">
            The cockroach reality
          </p>
          <p className="mt-1 text-sm font-medium text-tl-ink">
            Structures already moving
          </p>
          <ul className="mt-4 flex flex-wrap items-center gap-3">
            <li className="rounded-full bg-tl-trust px-3 py-2 text-sm font-medium text-white">
              Customary leader
            </li>
            <li className="rounded-md bg-tl-amber px-3 py-2 text-sm font-medium text-white">
              Local grievance
            </li>
            <li className="rounded-full bg-tl-trust-ink px-3 py-2 text-sm font-medium text-white">
              Ward structure
            </li>
          </ul>
        </div>
      </div>
      <figcaption className="border-t border-tl-line bg-tl-surface px-5 py-3 text-xs leading-relaxed text-tl-ink-muted">
        Host communities reorganise around a project whether the organogram
        names them or not. Dual governance has to be designed, not hoped for.
      </figcaption>
    </figure>
  );
}
