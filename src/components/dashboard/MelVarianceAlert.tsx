"use client";

import Link from "next/link";
import {
  collectMelShortfalls,
  formatMelNumber,
} from "@/lib/melIndicators";
import type { Commitment } from "@/types/commitment";
import type { Project } from "@/types/project";

type Props = {
  projects: Project[];
  commitments?: Commitment[];
};

export function MelVarianceAlert({ projects, commitments = [] }: Props) {
  const gaps = collectMelShortfalls({ projects, commitments });
  if (gaps.length === 0) return null;
  const material = gaps.filter((row) => row.material).length;

  return (
    <section className="rounded-lg border border-tl-amber/50 bg-tl-amber/10 p-4">
      <h2 className="font-display text-sm font-semibold text-tl-ink">
        M&E shortfall watch
      </h2>
      <p className="mt-1 text-xs text-tl-ink-muted">
        {material
          ? `${material} material gap${material === 1 ? "" : "s"} (actual below 80% of expected). `
          : null}
        Actual below expected is a watch, not a cause. Open the project to
        update figures.
      </p>
      <ul className="mt-3 divide-y divide-tl-line/80 text-sm">
        {gaps.slice(0, 8).map((row) => (
          <li
            key={`${row.indicatorId}-${row.projectId || ""}`}
            className="flex flex-wrap items-baseline justify-between gap-2 py-2"
          >
            <span>
              {row.projectId ? (
                <Link
                  href={`/app/projects/${row.projectId}`}
                  className="font-medium text-tl-trust-ink underline"
                >
                  {row.projectName || row.projectId}
                </Link>
              ) : null}
              {row.projectId ? " · " : null}
              {row.label}
            </span>
            <span
              className={
                row.material ? "font-semibold text-tl-amber" : "text-tl-ink-muted"
              }
            >
              {formatMelNumber(row.actual)} / {formatMelNumber(row.expected)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
