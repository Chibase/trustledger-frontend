"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { stakeholderService } from "@/services/stakeholderService";
import {
  STAKEHOLDER_KIND_LABELS,
  type Stakeholder,
  type StakeholderKind,
  type StakeholderStatus,
} from "@/types/stakeholder";
import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";

const KINDS = Object.keys(STAKEHOLDER_KIND_LABELS) as StakeholderKind[];

export default function AppStakeholdersPage() {
  const [rows, setRows] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<StakeholderKind | "all">("all");
  const [status, setStatus] = useState<StakeholderStatus | "all">("all");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    stakeholderService
      .list({ query, kind, status, countryCode: "ZA" })
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [query, kind, status]);

  const kindCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      map.set(row.kind, (map.get(row.kind) ?? 0) + 1);
    }
    return map;
  }, [rows]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`${NEXT_PRODUCT_VERSION_LABEL} CRM · ${PRODUCT_VERSION_LABEL} desk remains`}
        title="Stakeholder CRM"
        description="Full in-platform registry for individuals, organisations, traditional authorities, government, funders, contractors, NGOs, and more — linked to geographic packs. Seed data ships with the product; add your own records in trial (browser) until Frappe live sync lands."
        actions={
          <Link
            href="/app/geo"
            className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
          >
            Places
          </Link>
        }
      />

      <div className="grid gap-3 rounded-lg border border-tl-line bg-tl-surface p-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-tl-ink">Search</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, tag, interest…"
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-tl-ink">Kind</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as StakeholderKind | "all")}
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            <option value="all">All kinds</option>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {STAKEHOLDER_KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-tl-ink">Status</span>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as StakeholderStatus | "all")
            }
            className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="prospect">Prospect</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <p className="text-sm text-tl-ink-muted">
        {loading
          ? "Loading registry…"
          : `${rows.length} stakeholders · ${kindCounts.size} kinds in view`}
      </p>

      <ul className="divide-y divide-tl-line overflow-hidden rounded-lg border border-tl-line bg-tl-surface">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/app/stakeholders/${row.id}`}
              className="block px-4 py-4 hover:bg-tl-paper"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-semibold text-tl-ink">{row.name}</h2>
                <span className="text-xs capitalize text-tl-ink-muted">
                  {STAKEHOLDER_KIND_LABELS[row.kind]} · {row.status} ·{" "}
                  {row.influence} influence
                </span>
              </div>
              {row.summary ? (
                <p className="mt-1 text-sm text-tl-ink-muted">{row.summary}</p>
              ) : null}
              <p className="mt-2 text-xs text-tl-ink-muted">
                {row.organisation ? `${row.organisation} · ` : ""}
                {row.placeId ?? "No place linked"}
                {row.interests.length
                  ? ` · ${row.interests.slice(0, 3).join(", ")}`
                  : ""}
              </p>
            </Link>
          </li>
        ))}
        {!loading && rows.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-tl-ink-muted">
            No stakeholders match these filters.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
