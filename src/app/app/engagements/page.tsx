"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  NEXT_PRODUCT_VERSION_LABEL,
  PRODUCT_VERSION_LABEL,
} from "@/config/productVersion";
import { engagementService } from "@/services/engagementService";
import {
  ENGAGEMENT_KIND_LABELS,
  ENGAGEMENT_STATUS_LABELS,
  type Engagement,
  type EngagementKind,
  type EngagementStatus,
} from "@/types/engagement";

const KINDS = Object.keys(ENGAGEMENT_KIND_LABELS) as EngagementKind[];
const STATUSES = Object.keys(ENGAGEMENT_STATUS_LABELS) as EngagementStatus[];

export default function AppEngagementsPage() {
  const [rows, setRows] = useState<Engagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<EngagementKind | "all">("all");
  const [status, setStatus] = useState<EngagementStatus | "all">("all");

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (cancelled) return;
      setLoading(true);
      void engagementService
        .list({ query, kind, status })
        .then((data) => {
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
  }, [query, kind, status]);

  return (
    <FeatureGate capability="engagements">
      <div className="space-y-6">
        <PageHeader
          eyebrow={`${NEXT_PRODUCT_VERSION_LABEL} · ${PRODUCT_VERSION_LABEL} desk remains`}
          title="Engagements"
          description="Meetings, consultations, and walkabouts linked to projects and stakeholders. Capture hub applies create records here."
          actions={
            <Link
              href="/app/capture"
              className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              Capture engagement
            </Link>
          }
        />

        <div className="grid gap-3 rounded-lg border border-tl-line bg-tl-surface p-4 sm:grid-cols-[1fr_auto_auto]">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-tl-ink">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Title, ward, attendees…"
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-tl-ink">Kind</span>
            <select
              value={kind}
              onChange={(e) =>
                setKind(e.target.value as EngagementKind | "all")
              }
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            >
              <option value="all">All kinds</option>
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {ENGAGEMENT_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-tl-ink">Status</span>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as EngagementStatus | "all")
              }
              className="w-full rounded-md border border-tl-line px-3 py-2 text-sm"
            >
              <option value="all">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {ENGAGEMENT_STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-tl-ink-muted">Loading engagements…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-tl-ink-muted">
            No engagements yet.{" "}
            <Link href="/app/capture" className="text-tl-trust-ink underline">
              Capture minutes or attendance
            </Link>{" "}
            and apply AI suggestions.
          </p>
        ) : (
          <ul className="divide-y divide-tl-line rounded-lg border border-tl-line bg-tl-surface">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/app/engagements/${row.id}`}
                  className="flex flex-col gap-1 px-4 py-3 hover:bg-tl-paper sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-tl-ink">{row.title}</p>
                    <p className="text-xs text-tl-ink-muted">
                      {row.heldOn} · {row.ward}
                      {row.placeLabel ? ` · ${row.placeLabel}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded border border-tl-line px-2 py-0.5">
                      {ENGAGEMENT_KIND_LABELS[row.kind]}
                    </span>
                    <span className="rounded border border-tl-line px-2 py-0.5">
                      {ENGAGEMENT_STATUS_LABELS[row.status]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </FeatureGate>
  );
}
