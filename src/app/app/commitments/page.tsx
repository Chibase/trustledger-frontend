"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";
import { commitmentService } from "@/services/commitmentService";
import {
  COMMITMENT_BOARD_STATUSES,
  COMMITMENT_STATUS_LABELS,
  type Commitment,
  type CommitmentStatus,
} from "@/types/commitment";

export default function AppCommitmentsPage() {
  const [rows, setRows] = useState<Commitment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CommitmentStatus | "all">("all");
  const [view, setView] = useState<"board" | "list">("board");

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      void commitmentService.list({ query, status }).then((data) => {
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
      });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [query, status]);

  const byStatus = useMemo(() => {
    const map = new Map<CommitmentStatus, Commitment[]>();
    for (const s of COMMITMENT_BOARD_STATUSES) map.set(s, []);
    for (const row of rows) {
      const bucket = map.get(row.status) ?? [];
      bucket.push(row);
      map.set(row.status, bucket);
    }
    return map;
  }, [rows]);

  return (
    <FeatureGate capability="commitments">
      <div className="space-y-6">
        <PageHeader
          eyebrow={`${NEXT_PRODUCT_VERSION_LABEL} · ${PRODUCT_VERSION_LABEL} desk remains`}
          title="Commitments"
          description="Promises from engagements — owner, deadline, and evidence toward closed. Promote action items from an engagement detail."
          actions={
            <Link
              href="/app/engagements"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              From engagements
            </Link>
          }
        />

        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-tl-line bg-tl-surface p-4">
          <label className="min-w-[12rem] flex-1 text-sm">
            <span className="mb-1 block font-medium text-tl-ink">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, owner, evidence…"
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-tl-ink">Status</span>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as CommitmentStatus | "all")
              }
              className="rounded-md border border-tl-line px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              {COMMITMENT_BOARD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {COMMITMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setView("board")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                view === "board"
                  ? "bg-tl-trust text-white"
                  : "border border-tl-line hover:bg-tl-paper"
              }`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                view === "list"
                  ? "bg-tl-trust text-white"
                  : "border border-tl-line hover:bg-tl-paper"
              }`}
            >
              List
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-tl-ink-muted">Loading commitments…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-tl-ink-muted">
            No commitments yet. Open an engagement and promote an action item.
          </p>
        ) : view === "board" ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {COMMITMENT_BOARD_STATUSES.map((column) => {
              const items = byStatus.get(column) ?? [];
              if (status !== "all" && status !== column) return null;
              return (
                <section
                  key={column}
                  className="min-w-[14rem] flex-1 rounded-lg border border-tl-line bg-tl-paper/60"
                >
                  <header className="border-b border-tl-line px-3 py-2">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
                      {COMMITMENT_STATUS_LABELS[column]}{" "}
                      <span className="text-tl-ink">({items.length})</span>
                    </h2>
                  </header>
                  <ul className="space-y-2 p-2">
                    {items.map((row) => (
                      <li key={row.id}>
                        <Link
                          href={`/app/commitments/${row.id}`}
                          className="block rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm hover:border-tl-trust"
                        >
                          <p className="font-medium text-tl-ink">{row.title}</p>
                          <p className="mt-1 text-xs text-tl-ink-muted">
                            {row.ownerLabel} · due {row.dueOn}
                          </p>
                        </Link>
                      </li>
                    ))}
                    {items.length === 0 ? (
                      <li className="px-2 py-3 text-xs text-tl-ink-muted">
                        Empty
                      </li>
                    ) : null}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          <ul className="divide-y divide-tl-line rounded-lg border border-tl-line bg-tl-surface">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/app/commitments/${row.id}`}
                  className="flex flex-col gap-1 px-4 py-3 hover:bg-tl-paper sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-tl-ink">{row.title}</p>
                    <p className="text-xs text-tl-ink-muted">
                      {row.ownerLabel} · due {row.dueOn}
                    </p>
                  </div>
                  <span className="rounded border border-tl-line px-2 py-0.5 text-xs">
                    {COMMITMENT_STATUS_LABELS[row.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FeatureGate>
  );
}
