"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { FeatureGate } from "@/components/entitlements/FeatureGate";
import { PageHeader } from "@/components/ui/PageHeader";
import { useToast } from "@/components/ui/Toast";
import {
  createCommitmentId,
  commitmentService,
} from "@/services/commitmentService";
import { engagementService } from "@/services/engagementService";
import { stakeholderService } from "@/services/stakeholderService";
import {
  ENGAGEMENT_KIND_LABELS,
  ENGAGEMENT_STATUS_LABELS,
  type Engagement,
} from "@/types/engagement";
import type { Stakeholder } from "@/types/stakeholder";

export default function AppEngagementDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { pushToast } = useToast();
  const [row, setRow] = useState<Engagement | null>(null);
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);

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
        const engagement = await engagementService.get(id);
        if (cancelled) return;
        setRow(engagement);
        if (engagement?.stakeholderIds.length) {
          const all = await stakeholderService.list({});
          if (!cancelled) {
            setStakeholders(
              all.filter((s) => engagement.stakeholderIds.includes(s.id)),
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

  async function promoteAction(item: string) {
    if (!row) return;
    setPromoting(item);
    try {
      const due = new Date();
      due.setDate(due.getDate() + 7);
      const created = await commitmentService.save({
        id: createCommitmentId(),
        title: item,
        status: "open",
        ownerLabel: row.attendeesLabel.split(",")[0]?.trim() || "Owner TBD",
        dueOn: due.toISOString().slice(0, 10),
        projectId: row.projectId,
        engagementId: row.id,
        stakeholderIds: [...row.stakeholderIds],
        sourceActionItem: item,
        createdAt: new Date().toISOString(),
      });
      pushToast("Commitment created", "success");
      window.location.assign(`/app/commitments/${created.id}`);
    } finally {
      setPromoting(null);
    }
  }

  return (
    <FeatureGate capability="engagements">
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Engagement"
          title={loading ? "Loading…" : row?.title || "Not found"}
          description={
            row
              ? `${ENGAGEMENT_KIND_LABELS[row.kind]} · ${ENGAGEMENT_STATUS_LABELS[row.status]} · ${row.heldOn}`
              : "Engagement record"
          }
          actions={
            <Link
              href="/app/engagements"
              className="rounded-md border border-tl-line bg-tl-surface px-4 py-2 text-sm font-medium hover:bg-tl-paper"
            >
              All engagements
            </Link>
          }
        />

        {!loading && !row ? (
          <p className="text-sm text-tl-ink-muted">
            No engagement with id {id}.
          </p>
        ) : null}

        {row ? (
          <div className="space-y-4">
            <section className="space-y-2 border-b border-tl-line pb-4">
              <p className="text-sm text-tl-ink-muted">
                {row.ward}
                {row.placeLabel ? ` · ${row.placeLabel}` : ""}
                {row.projectId ? (
                  <>
                    {" · "}
                    <Link
                      href={`/app/projects/${row.projectId}`}
                      className="text-tl-trust-ink underline"
                    >
                      {row.projectId}
                    </Link>
                  </>
                ) : null}
              </p>
              <p className="text-sm text-tl-ink">{row.summary}</p>
              <p className="text-sm text-tl-ink-muted">
                Attendees: {row.attendeesLabel}
              </p>
            </section>

            <section>
              <h2 className="font-display text-base font-semibold text-tl-ink">
                Action items
              </h2>
              {row.actionItems.length === 0 ? (
                <p className="mt-2 text-sm text-tl-ink-muted">None recorded.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {row.actionItems.map((item) => (
                    <li
                      key={item}
                      className="flex flex-col gap-2 rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-tl-ink">{item}</span>
                      <button
                        type="button"
                        disabled={promoting === item}
                        onClick={() => void promoteAction(item)}
                        className="shrink-0 rounded-md border border-tl-line px-2.5 py-1 text-xs font-medium text-tl-trust-ink hover:bg-tl-paper disabled:opacity-50"
                      >
                        {promoting === item
                          ? "Promoting…"
                          : "Promote to commitment"}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-tl-ink-muted">
                Promoted items appear on the{" "}
                <Link
                  href="/app/commitments"
                  className="text-tl-trust-ink underline"
                >
                  commitments board
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display text-base font-semibold text-tl-ink">
                Linked stakeholders
              </h2>
              {stakeholders.length === 0 ? (
                <p className="mt-2 text-sm text-tl-ink-muted">
                  None linked yet. Apply capture suggestions to attach CRM
                  contacts.
                </p>
              ) : (
                <ul className="mt-2 divide-y divide-tl-line rounded-lg border border-tl-line bg-tl-surface">
                  {stakeholders.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={`/app/stakeholders/${s.id}`}
                        className="block px-4 py-2 text-sm hover:bg-tl-paper"
                      >
                        {s.name}
                        {s.organisation ? (
                          <span className="text-tl-ink-muted">
                            {" "}
                            · {s.organisation}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="text-xs text-tl-ink-muted">
              Source: {row.source}
              {row.captureId ? ` · capture ${row.captureId}` : ""}
            </p>
          </div>
        ) : null}
      </div>
    </FeatureGate>
  );
}
