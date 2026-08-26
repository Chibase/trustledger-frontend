import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
  type SepMatrixQuadrant,
} from "@/lib/sepMatrix";
import type { EngagementPlan, SepStakeholderClass } from "@/types/engagementPlan";

const CELLS: Array<{
  id: SepMatrixQuadrant;
  title: string;
  hint: string;
  className: string;
}> = [
  {
    id: "manage_closely",
    title: SEP_QUADRANT_LABELS.manage_closely,
    hint: "High influence · high interest",
    className: "border-tl-trust/50 bg-tl-trust/5",
  },
  {
    id: "keep_satisfied",
    title: SEP_QUADRANT_LABELS.keep_satisfied,
    hint: "High influence · lower interest",
    className: "border-tl-line bg-tl-surface",
  },
  {
    id: "keep_informed",
    title: SEP_QUADRANT_LABELS.keep_informed,
    hint: "Lower influence · high interest",
    className: "border-tl-line bg-tl-surface",
  },
  {
    id: "monitor",
    title: SEP_QUADRANT_LABELS.monitor,
    hint: "Lower influence · lower interest",
    className: "border-tl-line bg-tl-paper/80",
  },
];

export function SepMatrixBoard({ plan }: { plan: EngagementPlan }) {
  const buckets = new Map<SepMatrixQuadrant, SepStakeholderClass[]>();
  for (const cell of CELLS) buckets.set(cell.id, []);
  for (const row of plan.stakeholderClasses) {
    buckets.get(quadrantForClass(row))?.push(row);
  }

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
      <h2 className="font-display text-lg font-semibold text-tl-ink">
        Power–interest matrix
      </h2>
      <p className="mt-1 text-sm text-tl-ink-muted">
        Influence on the registry is power. Interest is derived from purpose
        (consult / decide / remediate = high) unless the class set it. Same
        axes serve an influence–impact read: impact sits in the vulnerability
        note, not a second invented score.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {CELLS.map((cell) => {
          const rows = buckets.get(cell.id) || [];
          return (
            <div
              key={cell.id}
              className={`rounded-md border px-3 py-3 ${cell.className}`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-tl-trust">
                {cell.title}
              </p>
              <p className="text-[0.7rem] text-tl-ink-muted">{cell.hint}</p>
              {rows.length ? (
                <ul className="mt-2 space-y-1 text-sm text-tl-ink">
                  {rows.map((row) => (
                    <li key={row.id}>
                      {row.label}
                      <span className="ml-1 text-xs text-tl-ink-muted">
                        ({row.influence} / {interestForClass(row)})
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-tl-ink-muted">None in this pack.</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
