"use client";

import { useCallback, useState, type SyntheticEvent } from "react";
import { commitmentService } from "@/services/commitmentService";
import { engagementService } from "@/services/engagementService";
import { stakeholderService } from "@/services/stakeholderService";
import { getActiveOrgId } from "@/lib/orgStore";
import {
  buildTrustIntelligenceFromSrm,
  loadTrustLayerBucketAsync,
  type TrustIntelligenceBrief,
} from "@/lib/trust";
import {
  listWorkspaceEvidence,
  listWorkspaceIncidents,
} from "@/lib/workspaceData";

/**
 * Optional trust recommendations on the reports hub.
 * Suggestion only. Not a pack. Does not change writer, Trust pulse, or cases.
 */
export function TrustIntelligencePanel() {
  const [brief, setBrief] = useState<TrustIntelligenceBrief | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const incidents = listWorkspaceIncidents();
      const [engagements, commitments, stakeholders] = await Promise.all([
        engagementService.list(),
        commitmentService.list(),
        stakeholderService.list(),
      ]);
      const orgId = getActiveOrgId();
      const stored = orgId ? await loadTrustLayerBucketAsync(orgId) : null;
      const next = buildTrustIntelligenceFromSrm(
        {
          incidents,
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
      setBrief(next);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not compose recommendations.",
      );
      setBrief(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function onToggle(event: SyntheticEvent<HTMLDetailsElement>) {
    if (event.currentTarget.open && !brief && !loading) {
      void load();
    }
  }

  function copyMarkdown() {
    if (!brief) return;
    void navigator.clipboard.writeText(brief.markdown).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <details
      className="rounded-lg border border-dashed border-tl-line bg-tl-paper/50 p-4"
      onToggle={onToggle}
    >
      <summary className="cursor-pointer font-display text-lg font-semibold text-tl-ink">
        Trust recommendations (optional)
      </summary>
      <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
        Rule-based suggestions and drafts. Suggestion only — nothing is sent,
        saved to a case, or used to change Trust pulse. Not part of monthly,
        executive, or board packs. No remote model is called.
      </p>
      {loading ? (
        <p className="mt-3 text-sm text-tl-ink-muted">Composing suggestions…</p>
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
      {brief ? (
        <div className="mt-4 space-y-4">
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
              onClick={() => setShowAdvisory((v) => !v)}
              className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
            >
              {showAdvisory ? "Hide advisory wording" : "Suggest wording (advisory)"}
            </button>
          </div>
          {brief.alerts.length ? (
            <section>
              <h3 className="text-sm font-semibold text-tl-ink">Alerts</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-tl-ink">
                {brief.alerts.map((alert) => (
                  <li key={alert.id}>
                    <span className="font-medium">{alert.title}</span>
                    <span className="text-tl-ink-muted">
                      {" "}
                      · {alert.trace.ruleId} — {alert.detail}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <p className="text-sm text-tl-ink-muted">
              No trust alerts under the current rules.
            </p>
          )}
          <section>
            <h3 className="text-sm font-semibold text-tl-ink">
              Recommended next steps
            </h3>
            {brief.recommendations.length === 0 ? (
              <p className="mt-2 text-sm text-tl-ink-muted">
                No action suggestions fired. Existing desk workflows stay in
                force.
              </p>
            ) : (
              <ul className="mt-2 space-y-3">
                {brief.recommendations.map((row) => (
                  <li
                    key={row.id}
                    className="rounded-md border border-tl-line bg-tl-surface px-3 py-3 text-sm"
                  >
                    <p className="font-medium text-tl-ink">{row.title}</p>
                    <p className="mt-1 text-tl-ink">{row.action}</p>
                    <p className="mt-2 text-xs text-tl-ink-muted">
                      {row.trace.ruleId} · {row.kind.replaceAll("_", " ")} ·
                      suggestion only
                      {row.trace.evidenceIds.length
                        ? ` · evidence ${row.trace.evidenceIds.join(", ")}`
                        : " · no evidence ids"}
                    </p>
                    <p className="mt-1 text-xs text-tl-ink-muted">
                      {row.trace.ruleSummary}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-tl-ink">
              Response drafts (not sent)
            </h3>
            <p className="text-sm text-tl-ink">{brief.drafts.responseSummary}</p>
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="rounded-md border border-tl-line bg-tl-surface p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                  Community-facing
                </p>
                <p className="mt-2 text-sm text-tl-ink">
                  {brief.drafts.communityFacing}
                </p>
              </div>
              <div className="rounded-md border border-tl-line bg-tl-surface p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                  Internal note
                </p>
                <p className="mt-2 text-sm text-tl-ink">
                  {brief.drafts.internalNote}
                </p>
              </div>
            </div>
          </section>
          {showAdvisory ? (
            <section className="rounded-md border border-dashed border-tl-line bg-tl-paper p-3">
              <h3 className="text-sm font-semibold text-tl-ink">
                Advisory wording
              </h3>
              <p className="mt-1 text-xs text-tl-ink-muted">
                Local rules ({brief.advisory.promptVersion}). Not saved. Human
                apply required.
              </p>
              <p className="mt-2 text-sm text-tl-ink">
                {brief.advisory.reportLanguage}
              </p>
            </section>
          ) : null}
        </div>
      ) : null}
    </details>
  );
}
