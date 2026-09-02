"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { PageHeader } from "@/components/ui/PageHeader";
import { deleteEngagementPlan, listEngagementPlans } from "@/lib/sepStore";
import type { EngagementPlan } from "@/types/engagementPlan";
import {
  SEP_SECTOR_LABELS,
  SEP_SOURCE_LABELS,
  SEP_STATUS_LABELS,
} from "@/types/engagementPlan";

export default function EngagementPlanListPage() {
  const [rows, setRows] = useState<EngagementPlan[]>([]);

  useEffect(() => {
    const load = () => {
      setRows(listEngagementPlans());
    };
    const handle = window.setTimeout(load, 0);
    window.addEventListener("tl-workspace-seeded", load);
    return () => {
      window.clearTimeout(handle);
      window.removeEventListener("tl-workspace-seeded", load);
    };
  }, []);

  function remove(id: string) {
    if (!window.confirm("Delete this engagement plan from this workspace?")) {
      return;
    }
    deleteEngagementPlan(id);
    setRows(listEngagementPlans());
  }

  return (
    <FeatureGate capability="engagements">
      <div className="space-y-6">
        <PageHeader
          eyebrow="Stakeholder Intelligence"
          title="Stakeholder engagement plans"
          description="Upload or paste an RFP, tender, or briefing. TrustLedger maps a sector process from inception to close-out. Gemini drafts the presentable document. Apply to SRM only after the assignment is approved."
          actions={
            <Link
              href="/app/engagement-plan/new"
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              New plan
            </Link>
          }
        />

        {rows.length === 0 ? (
          <div className="rounded-lg border border-dashed border-tl-line bg-tl-paper/60 p-6 text-sm text-tl-ink-muted">
            <p>
              No engagement plans yet. Paste a terms of reference, bid document,
              or briefing note — or pick a sector playbook and compose without a
              file.
            </p>
            <Link
              href="/app/engagement-plan/new"
              className="mt-3 inline-block font-medium text-tl-trust-ink underline"
            >
              Compose a plan
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-tl-line rounded-lg border border-tl-line bg-tl-surface">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={`/app/engagement-plan/${row.id}`}
                  className="min-w-0 flex-1 hover:text-tl-trust-ink"
                >
                  <p className="font-medium text-tl-ink">{row.title}</p>
                  <p className="text-xs text-tl-ink-muted">
                    {SEP_SECTOR_LABELS[row.sectorId]} ·{" "}
                    {SEP_SOURCE_LABELS[row.sourceKind]} ·{" "}
                    {SEP_STATUS_LABELS[row.status]}
                    {row.placeHint ? ` · ${row.placeHint}` : ""}
                  </p>
                </Link>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href={`/app/engagement-plan/${row.id}`}
                    className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-medium hover:bg-tl-paper"
                  >
                    Open
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    className="rounded-md border border-tl-line px-3 py-1.5 text-xs font-medium text-tl-ink-muted hover:bg-tl-paper"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FeatureGate>
  );
}
