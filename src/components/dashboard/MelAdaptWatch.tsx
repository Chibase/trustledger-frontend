"use client";

import Link from "next/link";
import { collectOpenAdaptRecords } from "@/lib/melLearnAdapt";
import type { Incident } from "@/types/incident";

type Props = {
  incidents: Incident[];
};

export function MelAdaptWatch({ incidents }: Props) {
  const rows = collectOpenAdaptRecords(incidents);
  if (rows.length === 0) return null;
  const overdue = rows.filter((row) => row.overdue).length;

  return (
    <section className="rounded-lg border border-tl-amber/50 bg-tl-amber/10 p-4">
      <h2 className="font-display text-sm font-semibold text-tl-ink">
        Learn &amp; Adapt watch
      </h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        {overdue
          ? `${overdue} overdue open record${overdue === 1 ? "" : "s"}. `
          : null}
        Open corrective actions only. Completing a record does not close the
        case.
      </p>
      <ul className="mt-3 divide-y divide-tl-line/80 text-sm">
        {rows.slice(0, 8).map((row) => (
          <li
            key={`${row.incidentId}-${row.recordId}`}
            className="flex flex-wrap items-baseline justify-between gap-2 py-2"
          >
            <span>
              <Link
                href={`/app/incidents/${row.incidentId}`}
                className="font-medium text-tl-trust-ink underline"
              >
                {row.incidentTitle || row.incidentId}
              </Link>
              {" · "}
              {row.action || row.monitor}
            </span>
            <span
              className={
                row.overdue ? "font-semibold text-tl-amber" : "text-tl-ink-muted"
              }
            >
              {row.dueOn || "No due date"}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
