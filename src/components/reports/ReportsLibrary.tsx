"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DESK_TIER_LABELS, type DeskTier } from "@/types/deskTier";
import {
  REPORT_AUDIENCE_LABELS,
  REPORT_KIND_LABELS,
  type SavedReport,
} from "@/types/activityReport";
import { DESK_TIER_RANK } from "@/config/reportCatalogue";
import { readDeskTier } from "@/lib/deskVisibility";
import { listSavedReports } from "@/lib/reportStore";
import type { UserRole } from "@/types/rbac";

type ReportsLibraryProps = {
  role: UserRole;
};

/**
 * Level-aware report library for dashboards — viewers see packs at or below
 * their desk grade, plus anything addressed to their audience band.
 */
export function ReportsLibrary({ role }: ReportsLibraryProps) {
  const [tier, setTier] = useState<DeskTier>("clo");
  const [rows, setRows] = useState<SavedReport[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setTier(readDeskTier(role));
    setRows(listSavedReports());
  }, [role]);

  const visible = useMemo(() => {
    const rank = DESK_TIER_RANK[tier];
    return rows.filter((r) => {
      const authorRank = DESK_TIER_RANK[r.authorTier];
      // Seniors (lower rank number) see junior filings; juniors see peer tier.
      if (rank <= authorRank) return true;
      if (r.authorTier === tier) return true;
      return false;
    });
  }, [rows, tier]);

  const active = visible.find((r) => r.id === activeId) ?? visible[0] ?? null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-tl-ink">
            Report library · {DESK_TIER_LABELS[tier]}
          </h2>
          <p className="text-xs text-tl-ink-muted">
            Evidence packs for reporting, performance, and disputes. Create new
            packs under Create report.
          </p>
        </div>
        <Link
          href="/app/reports"
          className="text-xs font-medium text-tl-trust-ink hover:underline"
        >
          Create a report
        </Link>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed border-tl-line bg-tl-surface px-4 py-6 text-sm text-tl-ink-muted">
          No saved reports yet for this desk view.{" "}
          <Link href="/app/reports" className="text-tl-trust-ink underline">
            Create a report
          </Link>{" "}
          with AI assist.
        </p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
          <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
            {visible.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(r.id)}
                  className={`w-full px-3 py-2.5 text-left text-sm hover:bg-tl-paper ${
                    active?.id === r.id ? "bg-tl-trust/10" : ""
                  }`}
                >
                  <p className="font-medium text-tl-ink">{r.title}</p>
                  <p className="text-xs text-tl-ink-muted">
                    {REPORT_KIND_LABELS[r.kind]} · {r.status} ·{" "}
                    {DESK_TIER_LABELS[r.authorTier]}
                  </p>
                </button>
              </li>
            ))}
          </ul>
          {active ? (
            <article className="rounded-lg border border-tl-line bg-tl-surface p-4">
              <header className="border-b border-tl-line pb-3">
                <h3 className="font-display text-xl font-semibold text-tl-ink">
                  {active.title}
                </h3>
                <p className="mt-1 text-xs text-tl-ink-muted">
                  {REPORT_KIND_LABELS[active.kind]} →{" "}
                  {REPORT_AUDIENCE_LABELS[active.audience]} · {active.periodLabel}
                  {active.projectName ? ` · ${active.projectName}` : ""} ·{" "}
                  {active.purposeTags.join(", ")}
                </p>
              </header>
              <pre className="mt-4 max-h-[28rem] overflow-auto whitespace-pre-wrap font-sans text-sm text-tl-ink">
                {active.bodyMarkdown}
              </pre>
              {active.evidence.length ? (
                <div className="mt-4 border-t border-tl-line pt-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                    Evidence index
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-tl-ink-muted">
                    {active.evidence.map((e) => (
                      <li key={e.id}>
                        {e.kind}: {e.label}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      )}
    </section>
  );
}
