"use client";

import { countRootCauses } from "@/lib/grievanceRootCause";
import type { Incident } from "@/types/incident";

type RootCauseMixProps = {
  incidents: Incident[];
};

export function RootCauseMix({ incidents }: RootCauseMixProps) {
  const rows = countRootCauses(incidents);
  if (rows.length === 0) return null;

  return (
    <section className="rounded-lg border border-tl-line bg-tl-surface p-4">
      <h2 className="font-display text-sm font-semibold text-tl-ink">
        Root-cause mix
      </h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        Tagged cases only. Untagged rows stay off this mix. Tags are
        operational, not trust-movement causes.
      </p>
      <ul className="mt-3 divide-y divide-tl-line text-sm">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-baseline justify-between gap-2 py-2"
          >
            <span>{row.label}</span>
            <span className="tabular-nums text-tl-ink-muted">{row.count}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
