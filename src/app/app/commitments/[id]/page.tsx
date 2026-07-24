"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { commitmentService } from "@/services/commitmentService";
import { stakeholderService } from "@/services/stakeholderService";
import {
  COMMITMENT_STATUS_LABELS,
  type Commitment,
  type CommitmentStatus,
} from "@/types/commitment";
import type { Stakeholder } from "@/types/stakeholder";

const STATUS_OPTIONS = Object.keys(
  COMMITMENT_STATUS_LABELS,
) as CommitmentStatus[];

export default function AppCommitmentDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { pushToast } = useToast();
  const [row, setRow] = useState<Commitment | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      if (cancelled) return;
      if (!id) {
        setRow(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      void (async () => {
        const commitment = await commitmentService.get(id);
        if (cancelled) return;
        setRow(commitment);
        if (commitment?.stakeholderIds.length) {
          const all = await stakeholderService.list({});
          if (!cancelled) {
            setStakeholders(
              all.filter((s) => commitment.stakeholderIds.includes(s.id)),
            );
          }
        } else if (!cancelled) {
          setStakeholders([]);
        }
        if (!cancelled) setLoading(false);
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [id]);

  async function updateStatus(next: CommitmentStatus) {
    if (!row) return;
    setSaving(true);
    try {
      const updated = { ...row, status: next };
      await commitmentService.save(updated);
      setRow(updated);
      pushToast(`Status → ${COMMITMENT_STATUS_LABELS[next]}`, "success");
    } finally {
      setSaving(false);
    }
  }

  return (
    <FeatureGate capability="commitments">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Commitment"
          title={loading ? "Loading…" : row?.title || "Not found"}
          description={
            row
              ? `${COMMITMENT_STATUS_LABELS[row.status]} · due ${row.dueOn} · ${row.ownerLabel}`
              : "Promise record"
          }
          actions={
            <Link
              href="/app/commitments"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              Status board
            </Link>
          }
        />

        {!loading && !row ? (
          <p className="text-sm text-tl-ink-muted">
            No commitment with id {id}.
          </p>
        ) : null}

        {row ? (
          <div className="space-y-4">
            <section className="space-y-2 border-b border-tl-line pb-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Status</span>
                <select
                  value={row.status}
                  disabled={saving}
                  onChange={(e) =>
                    void updateStatus(e.target.value as CommitmentStatus)
                  }
                  className="rounded-md border border-tl-line px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {COMMITMENT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-tl-ink-muted">
                {row.projectId ? (
                  <>
                    Project{" "}
                    <Link
                      href={`/app/projects/${row.projectId}`}
                      className="text-tl-trust-ink underline"
                    >
                      {row.projectId}
                    </Link>
                  </>
                ) : (
                  "No project"
                )}
                {row.engagementId ? (
                  <>
                    {" · "}
                    Engagement{" "}
                    <Link
                      href={`/app/engagements/${row.engagementId}`}
                      className="text-tl-trust-ink underline"
                    >
                      {row.engagementId}
                    </Link>
                  </>
                ) : null}
              </p>
              {row.evidenceNote ? (
                <p className="text-sm text-tl-ink">
                  Evidence: {row.evidenceNote}
                </p>
              ) : (
                <p className="text-sm text-tl-ink-muted">
                  No evidence note yet.
                </p>
              )}
            </section>

            <section>
              <h2 className="font-display text-base font-semibold text-tl-ink">
                Linked stakeholders
              </h2>
              {stakeholders.length === 0 ? (
                <p className="mt-2 text-sm text-tl-ink-muted">None linked.</p>
              ) : (
                <ul className="mt-2 divide-y divide-tl-line rounded-lg border border-tl-line bg-tl-surface">
                  {stakeholders.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/app/stakeholders/${s.id}`}
                        className="block px-4 py-2 text-sm hover:bg-tl-paper"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </FeatureGate>
  );
}
