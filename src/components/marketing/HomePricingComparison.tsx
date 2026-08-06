"use client";

import { PLAN_IDS, PLANS, type PlanId } from "@/config/plans";
import {
  formatComparisonCell,
  PLAN_COMPARISON_GROUPS,
  type ComparisonValue,
} from "@/config/planComparison";

function Cell({ value }: { value: ComparisonValue }) {
  const text = formatComparisonCell(value);
  const muted = value === false || value === "—";
  return (
    <td
      className={`px-2 py-2 text-center text-xs sm:text-sm ${
        muted ? "text-tl-ink-muted" : "text-tl-ink"
      }`}
    >
      {value === true ? (
        <span className="font-medium text-tl-trust" aria-label="Included">
          ✓
        </span>
      ) : (
        text
      )}
    </td>
  );
}

/**
 * Foldable plan comparison — click a group to learn more about features.
 */
export function HomePricingComparison() {
  return (
    <div className="mt-12 border-t border-tl-line pt-10">
      <div className="mx-auto max-w-2xl text-center">
        <h3 className="font-display text-xl font-semibold text-tl-ink">
          Compare plans
        </h3>
        <p className="mt-2 text-sm text-tl-ink-muted">
          Expand a section to see how desk features and privacy layers differ.
          Base protections are included; deeper privacy is optional.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {PLAN_COMPARISON_GROUPS.map((group) => (
          <details
            key={group.id}
            className="group rounded-lg border border-tl-line bg-tl-paper open:bg-tl-surface"
          >
            <summary className="cursor-pointer list-none px-4 py-3 font-medium text-tl-ink marker:content-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center justify-between gap-3">
                <span>{group.title}</span>
                <span
                  className="text-xs font-normal text-tl-ink-muted group-open:hidden"
                  aria-hidden
                >
                  Show
                </span>
                <span
                  className="hidden text-xs font-normal text-tl-ink-muted group-open:inline"
                  aria-hidden
                >
                  Hide
                </span>
              </span>
            </summary>
            <div className="overflow-x-auto border-t border-tl-line px-2 pb-3 pt-1">
              <table className="w-full min-w-[36rem] border-collapse text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-tl-ink-muted">
                    <th className="px-2 py-2 font-medium">Feature</th>
                    {PLAN_IDS.map((id: PlanId) => (
                      <th
                        key={id}
                        className="px-2 py-2 text-center font-medium"
                      >
                        {PLANS[id].name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.id} className="border-t border-tl-line/80">
                      <th
                        scope="row"
                        className="max-w-[14rem] px-2 py-2 text-left text-xs font-normal text-tl-ink sm:text-sm"
                      >
                        {row.label}
                        {row.hint ? (
                          <span className="mt-0.5 block text-[0.7rem] text-tl-ink-muted">
                            {row.hint}
                          </span>
                        ) : null}
                      </th>
                      {PLAN_IDS.map((id) => (
                        <Cell key={id} value={row.values[id]} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
