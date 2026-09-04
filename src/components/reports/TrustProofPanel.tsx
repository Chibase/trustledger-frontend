"use client";

import { useCallback, useState, type SyntheticEvent } from "react";
import { commitmentService } from "@/services/commitmentService";
import { engagementService } from "@/services/engagementService";
import { stakeholderService } from "@/services/stakeholderService";
import { getActiveOrgId } from "@/lib/orgStore";
import {
  buildTrustProofFromSrm,
  getTrustLayerBucket,
  type TrustProofReport,
} from "@/lib/trust";
import {
  listWorkspaceEvidence,
  listWorkspaceIncidents,
} from "@/lib/workspaceData";

/**
 * Optional trust proof on the reports hub.
 * Not a pack. Does not change monthly / executive / board writer or Trust pulse.
 */
export function TrustProofPanel() {
  const [report, setReport] = useState<TrustProofReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [engagements, commitments, stakeholders] = await Promise.all([
        engagementService.list(),
        commitmentService.list(),
        stakeholderService.list(),
      ]);
      const orgId = getActiveOrgId();
      const stored = orgId ? getTrustLayerBucket(orgId) : null;
      const next = buildTrustProofFromSrm(
        {
          incidents: listWorkspaceIncidents(),
          engagements,
          commitments,
          evidence: listWorkspaceEvidence(),
          stakeholders,
        },
        {
          storedObservations: stored?.observations,
          storedParticipation: stored?.participation,
          storedCommunity: stored?.community,
        },
      );
      setReport(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not compose trust proof.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function onToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open && !report && !loading) {
      void load();
    }
  }

  function copyMarkdown() {
    if (!report) return;
    void navigator.clipboard.writeText(report.markdown).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  function downloadMarkdown() {
    if (!report) return;
    const blob = new Blob([report.markdown], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `trust-proof-${report.generatedAt.slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <details
      className="rounded-lg border border-dashed border-tl-line bg-tl-paper/50 p-4"
      onToggle={onToggle}
    >
      <summary className="cursor-pointer font-display text-lg font-semibold text-tl-ink">
        Trust proof (optional)
      </summary>
      <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
        Opt-in summary from the parallel trust layer. It is not part of monthly,
        executive, or board packs and does not change Trust pulse. Rules stay
        explainable (mean of +1 / 0 / −1; ±0.34). No recommendation engine.
      </p>
      {loading ? (
        <p className="mt-3 text-sm text-tl-ink-muted">Composing proof…</p>
      ) : null}
      {error ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <p className="text-sm text-tl-danger">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium hover:bg-tl-paper"
          >
            Try again
          </button>
        </div>
      ) : null}
      {report ? (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                Overall movement
              </p>
              <p className="font-display text-xl font-semibold text-tl-ink">
                {report.overallMovement.replaceAll("_", " ")}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void load()}
                className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={copyMarkdown}
                className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
              >
                {copied ? "Copied" : "Copy markdown"}
              </button>
              <button
                type="button"
                onClick={downloadMarkdown}
                className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
              >
                Download .md
              </button>
            </div>
          </div>
          <p className="text-sm text-tl-ink">{report.narrative}</p>
          {report.risks.length ? (
            <section>
              <h3 className="text-sm font-semibold text-tl-ink">Risk flags</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-tl-ink">
                {report.risks.map((flag) => (
                  <li key={flag.id}>
                    <span className="font-medium">{flag.title}</span>
                    {flag.severity === "attention" ? (
                      <span className="text-tl-amber"> · attention</span>
                    ) : (
                      <span className="text-tl-ink-muted"> · watch</span>
                    )}
                    <span className="text-tl-ink-muted"> — {flag.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-sm text-tl-ink-muted">
              No trust risk flags on the current rules.
            </p>
          )}
          <section>
            <h3 className="text-sm font-semibold text-tl-ink">
              Comparison slices
            </h3>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {report.comparisons.community.length === 0 &&
              report.comparisons.project_phase.length === 0 ? (
                <li className="text-sm text-tl-ink-muted">
                  No comparison slices yet.
                </li>
              ) : null}
              {report.comparisons.community.map((slice) => (
                <li
                  key={`community-${slice.id}`}
                  className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
                >
                  <span className="text-xs uppercase tracking-wide text-tl-ink-muted">
                    Community
                  </span>
                  <p className="font-medium text-tl-ink">{slice.label}</p>
                  <p className="text-tl-ink-muted">
                    {slice.movement} · {slice.scoredCount} scored
                  </p>
                </li>
              ))}
              {report.comparisons.project_phase.map((slice) => (
                <li
                  key={`phase-${slice.id}`}
                  className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
                >
                  <span className="text-xs uppercase tracking-wide text-tl-ink-muted">
                    Phase proxy
                  </span>
                  <p className="font-medium text-tl-ink">{slice.label}</p>
                  <p className="text-tl-ink-muted">
                    {slice.movement} · {slice.scoredCount} scored
                  </p>
                </li>
              ))}
            </ul>
          </section>
          <pre className="max-h-80 overflow-auto rounded-md border border-tl-line bg-tl-surface p-3 text-xs leading-relaxed text-tl-ink whitespace-pre-wrap">
            {report.markdown}
          </pre>
        </div>
      ) : null}
    </details>
  );
}
