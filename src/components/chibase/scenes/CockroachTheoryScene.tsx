/**
 * Timed Scene 1 (0:00–0:45) — rigid maps vs cockroach reality.
 * Presentational; `progress` 0–1 fades the right column. Field-ledger tokens only.
 */

function ChainArrow() {
  return (
    <svg
      className="mx-auto h-4 w-4 text-tl-line"
      viewBox="0 0 16 16"
      aria-hidden
    >
      <path
        d="M8 2.5v9.5M4.5 8.5 8 12l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CockroachTheoryScene({ progress = 1 }: { progress?: number }) {
  const p = Math.min(1, Math.max(0, progress));
  const rightOpacity = Math.min(1, p / 0.28);

  return (
    <figure className="flex h-full min-h-[16rem] flex-col bg-tl-paper">
      <div className="grid min-h-0 flex-1 md:grid-cols-2">
        <div className="flex flex-col justify-center border-b border-tl-line p-5 md:border-b-0 md:border-r md:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tl-ink-muted">
            Rigid corporate maps
          </p>
          <p className="mt-1 text-sm font-medium text-tl-ink">
            The organogram
          </p>
          <ol className="mt-6 flex flex-col items-stretch gap-1">
            <li>
              <div className="rounded-md bg-tl-ink px-3 py-2.5 text-center text-sm font-medium text-white">
                HQ
              </div>
              <ChainArrow />
            </li>
            <li>
              <div className="mx-4 rounded-md bg-tl-demo px-3 py-2.5 text-center text-sm font-medium text-white">
                Municipality
              </div>
              <ChainArrow />
            </li>
            <li className="mx-8 rounded-md bg-tl-ink-muted px-3 py-2.5 text-center text-sm font-medium text-white">
              Contractor
            </li>
          </ol>
        </div>
        <div
          className="flex flex-col justify-center p-5 motion-reduce:!opacity-100 md:p-8"
          style={{ opacity: rightOpacity }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-tl-amber">
            The cockroach reality
          </p>
          <p className="mt-1 text-sm font-medium text-tl-ink">
            Structures already moving
          </p>
          <ul className="mt-6 flex flex-wrap items-center gap-3">
            <li className="rounded-full bg-tl-trust px-3 py-2 text-sm font-medium text-white">
              Informal authority
            </li>
            <li className="rounded-md bg-tl-amber px-3 py-2 text-sm font-medium text-white">
              Customary leaders
            </li>
            <li className="rounded-full bg-tl-trust-ink px-3 py-2 text-sm font-medium text-white">
              Ward structures
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
