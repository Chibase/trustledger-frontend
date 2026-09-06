"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";

export type DashboardRecentColumn = {
  key: string;
  header: string;
  className?: string;
};

export type DashboardRecentRow = {
  id: string;
  href?: string;
  values: Record<string, ReactNode>;
};

type Props = {
  title: string;
  columns: DashboardRecentColumn[];
  rows: DashboardRecentRow[];
  empty: string;
  pageSize?: number;
  viewAllHref?: string;
  viewAllLabel?: string;
};

export function DashboardRecentTable({
  title,
  columns,
  rows,
  empty,
  pageSize = 8,
  viewAllHref,
  viewAllLabel = "Open full list",
}: Props) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = useMemo(() => {
    const start = safePage * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);
  const from = rows.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(rows.length, (safePage + 1) * pageSize);

  return (
    <section className="overflow-hidden rounded-xl border border-tl-line bg-tl-surface shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-tl-line px-4 py-3">
        <h2 className="text-sm font-semibold text-tl-ink">{title}</h2>
        {viewAllHref ? (
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-tl-trust-ink hover:underline"
          >
            {viewAllLabel}
          </Link>
        ) : null}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-sm text-tl-ink-muted">{empty}</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-tl-line bg-tl-ink/[0.03] text-xs uppercase tracking-wide text-tl-ink-muted">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`px-4 py-2.5 font-medium ${col.className || ""}`}
                    >
                      {col.header}
                    </th>
                  ))}
                  <th className="px-4 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tl-line">
                {slice.map((row) => (
                  <tr key={row.id} className="hover:bg-tl-paper/60">
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 ${col.className || ""}`}
                      >
                        {row.values[col.key]}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="text-xs font-medium text-tl-trust-ink hover:underline"
                        >
                          Open
                        </Link>
                      ) : (
                        <span className="text-xs text-tl-ink-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-tl-line px-4 py-3 text-xs text-tl-ink-muted">
            <p>
              Showing {from}–{to} of {rows.length}
            </p>
            {pageCount > 1 ? (
              <nav className="flex items-center gap-1" aria-label="Table pages">
                <button
                  type="button"
                  className="rounded-md border border-tl-line px-2 py-1 disabled:opacity-40"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Prev
                </button>
                <span className="px-1 tabular-nums">
                  {safePage + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  className="rounded-md border border-tl-line px-2 py-1 disabled:opacity-40"
                  disabled={safePage >= pageCount - 1}
                  onClick={() =>
                    setPage((p) => Math.min(pageCount - 1, p + 1))
                  }
                >
                  Next
                </button>
              </nav>
            ) : null}
          </div>
        </>
      )}
    </section>
  );
}
