"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { StakeholderIntelligenceWorkspace } from "@/components/intelligence/StakeholderIntelligenceWorkspace";
import { PageHeader } from "@/components/ui/PageHeader";
import { listWorkspaceEvidence, listWorkspaceIncidents } from "@/lib/workspaceData";
import { commitmentService } from "@/services/commitmentService";
import { engagementService } from "@/services/engagementService";
import { stakeholderService } from "@/services/stakeholderService";
import type { Commitment } from "@/types/commitment";
import type { Engagement, EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import {
  STAKEHOLDER_KIND_LABELS,
  type Stakeholder,
} from "@/types/stakeholder";

type PageData = {
  row: Stakeholder | null;
  engagements: Engagement[];
  commitments: Commitment[];
  incidents: Incident[];
  evidence: EvidenceStub[];
};

export default function StakeholderDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      stakeholderService.get(params.id),
      engagementService.list(),
      commitmentService.list(),
    ]).then(([row, engagements, commitments]) => {
      if (cancelled) return;
      setData({
        row,
        engagements,
        commitments,
        incidents: listWorkspaceIncidents(),
        evidence: listWorkspaceEvidence(),
      });
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading || !data) {
    return <p className="text-sm text-tl-ink-muted">Loading…</p>;
  }
  if (!data.row) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-tl-ink-muted">Stakeholder not found.</p>
        <Link href="/app/stakeholders" className="text-tl-trust-ink underline">
          Back to CRM
        </Link>
      </div>
    );
  }

  const row = data.row;

  return (
    <FeatureGate capability="stakeholdersCrm">
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

      <StakeholderIntelligenceWorkspace
        key={row.id}
        stakeholder={row}
        engagements={data.engagements}
        commitments={data.commitments}
        incidents={data.incidents}
        evidence={data.evidence}
      />
    </div>
    </FeatureGate>
  );
}
