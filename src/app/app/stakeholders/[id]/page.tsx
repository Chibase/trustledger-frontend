"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { stakeholderService } from "@/services/stakeholderService";
import {
  STAKEHOLDER_KIND_LABELS,
  type Stakeholder,
} from "@/types/stakeholder";

export default function StakeholderDetailPage() {
  const params = useParams<{ id: string }>();
  const [row, setRow] = useState<Stakeholder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    stakeholderService.get(params.id).then((data) => {
      if (!cancelled) {
        setRow(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) {
    return <p className="text-sm text-tl-ink-muted">Loading…</p>;
  }
  if (!row) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-tl-ink-muted">Stakeholder not found.</p>
        <Link href="/app/stakeholders" className="text-tl-trust-ink underline">
          Back to CRM
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={STAKEHOLDER_KIND_LABELS[row.kind]}
        title={row.name}
        description={row.summary || "Stakeholder CRM record"}
        actions={
          <Link
            href="/app/stakeholders"
            className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
          >
            All stakeholders
          </Link>
        }
      />

      <dl className="grid gap-4 rounded-lg border border-tl-line bg-tl-surface p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Status
          </dt>
          <dd className="mt-1 text-sm capitalize text-tl-ink">{row.status}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Influence
          </dt>
          <dd className="mt-1 text-sm capitalize text-tl-ink">{row.influence}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Organisation
          </dt>
          <dd className="mt-1 text-sm text-tl-ink">
            {row.organisation || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Place
          </dt>
          <dd className="mt-1 text-sm text-tl-ink">
            {row.placeId ? (
              <Link href="/app/geo" className="text-tl-trust-ink underline">
                {row.placeId}
              </Link>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Email
          </dt>
          <dd className="mt-1 text-sm text-tl-ink">{row.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Phone
          </dt>
          <dd className="mt-1 text-sm text-tl-ink">{row.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Engagement role
          </dt>
          <dd className="mt-1 text-sm text-tl-ink">
            {row.engagementRole || "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Preferred channel
          </dt>
          <dd className="mt-1 text-sm capitalize text-tl-ink">
            {row.preferredChannel || "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Interests
          </dt>
          <dd className="mt-1 text-sm text-tl-ink">
            {row.interests.length ? row.interests.join(", ") : "—"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
            Tags
          </dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {row.tags.length
              ? row.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-tl-paper px-2 py-0.5 text-xs text-tl-ink-muted"
                  >
                    {t}
                  </span>
                ))
              : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
