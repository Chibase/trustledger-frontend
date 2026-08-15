"use client";

import Link from "next/link";
import {
  createIssueLogFollowUpId,
  deriveIssueLogRollup,
  emptyIssueLogEntry,
  ISSUE_LOG_CATEGORIES,
  type IssueLogEntry,
  type IssueLogFacts,
  type IssueLogFollowUp,
} from "@/lib/captureStore";
import type { Incident } from "@/types/incident";

const inputClass =
  "w-full rounded-md border border-tl-line px-3 py-2 text-sm bg-tl-surface";

type Props = {
  data: IssueLogFacts;
  onChange: (next: IssueLogFacts) => void;
  projectIncidents?: Incident[];
  projectId?: string;
};

function patchEntry(
  entries: IssueLogEntry[],
  id: string,
  partial: Partial<IssueLogEntry>,
): IssueLogEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...partial } : e));
}

function patchFollowUp(
  entries: IssueLogEntry[],
  entryId: string,
  followUpId: string,
  partial: Partial<IssueLogFollowUp>,
): IssueLogEntry[] {
  return entries.map((e) => {
    if (e.id !== entryId) return e;
    return {
      ...e,
      followUps: (e.followUps || []).map((f) =>
        f.id === followUpId ? { ...f, ...partial } : f,
      ),
    };
  });
}

function withRollup(entries: IssueLogEntry[], base: IssueLogFacts): IssueLogFacts {
  const titled = entries.filter((e) => e.title.trim());
  if (!titled.length) {
    // Keep legacy manual counts until at least one titled pathway exists.
    return { ...base, entries };
  }
  const rollup = deriveIssueLogRollup(entries);
  return {
    ...base,
    entries,
    casesLogged: rollup.casesLogged,
    casesOpen: rollup.casesOpen,
    casesClosed: rollup.casesClosed,
    casesEscalated: rollup.casesEscalated,
    topThemes: rollup.topThemes || base.topThemes,
    openCaseRefs: rollup.openCaseRefs || base.openCaseRefs,
  };
}

/**
 * Sequenced issue pathway editor:
 * title → category → reporter → reported → follow-ups → escalate → feedback → resolve → close
 */
export function IssueLogPathwayForm({
  data,
  onChange,
  projectIncidents = [],
  projectId,
}: Props) {
  const entries = data.entries?.length ? data.entries : [];

  function setEntries(next: IssueLogEntry[]) {
    onChange(withRollup(next, data));
  }

  function addEntry(from?: Incident) {
    const base = emptyIssueLogEntry();
    if (from) {
      base.title = from.title;
      base.category = from.nature || from.category || "";
      base.reporterName = from.reporterName || "";
      base.reportedAt = from.reportedAt
        ? from.reportedAt.slice(0, 16)
        : "";
      base.linkedIncidentId = from.id;
      if (from.processStages?.resolvedAt) {
        base.resolvedAt = from.processStages.resolvedAt.slice(0, 16);
      }
      if (from.processStages?.closedAt) {
        base.closedAt = from.processStages.closedAt.slice(0, 16);
      }
    }
    setEntries([...entries, base]);
  }

  function removeEntry(id: string) {
    setEntries(entries.filter((e) => e.id !== id));
  }

  function addFollowUp(entryId: string) {
    setEntries(
      entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              followUps: [
                ...(e.followUps || []),
                {
                  id: createIssueLogFollowUpId(),
                  action: "",
                  outcome: "",
                  at: "",
                },
              ],
            }
          : e,
      ),
    );
  }

  function removeFollowUp(entryId: string, followUpId: string) {
    setEntries(
      entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              followUps: (e.followUps || []).filter((f) => f.id !== followUpId),
            }
          : e,
      ),
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-tl-line bg-tl-paper p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-tl-ink">
            Desk cases
            {projectId ? ` · ${projectIncidents.length} on file` : ""}
          </p>
          <Link
            href={
              projectId
                ? `/app/issues/report?projectId=${encodeURIComponent(projectId)}`
                : "/app/issues/report"
            }
            className="text-sm font-medium text-tl-trust-ink underline"
          >
            Log new issue on desk
          </Link>
        </div>
        {projectIncidents.length === 0 ? (
          <p className="mt-2 text-sm text-tl-ink-muted">
            No desk cases yet — capture pathways below, or open{" "}
            <Link href="/app/incidents" className="underline">
              Incidents
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
            {projectIncidents.slice(0, 12).map((inc) => (
              <li
                key={inc.id}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <span>
                  <Link
                    href={`/app/incidents/${encodeURIComponent(inc.id)}`}
                    className="text-tl-trust-ink underline"
                  >
                    {inc.id}
                  </Link>
                  <span className="text-tl-ink-muted">
                    {" "}
                    · {inc.status} — {inc.title.slice(0, 56)}
                    {inc.title.length > 56 ? "…" : ""}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs font-medium text-tl-trust-ink underline"
                  onClick={() => addEntry(inc)}
                >
                  Add to pathway log
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="il-period">
          Reporting period
        </label>
        <input
          id="il-period"
          className={inputClass}
          value={data.periodLabel || ""}
          onChange={(e) =>
            onChange({ ...data, periodLabel: e.target.value })
          }
          placeholder="e.g. August 2026"
        />
      </div>

      <p className="text-xs text-tl-ink-muted">
        Pathway sequence per issue: title → category → person reporting →
        date/time reported → follow-ups (action, outcome, date/time) →
        escalated → feedback → resolved → closed. Add steps as needed. Saved
        pathways feed Issue handling / GRM reports as evidence.
      </p>

      {entries.length === 0 ? (
        <p className="text-sm text-tl-ink-muted">
          No pathway entries yet — add the first issue below.
        </p>
      ) : null}

      <div className="space-y-4">
        {entries.map((entry, index) => (
          <article
            key={entry.id}
            className="space-y-3 rounded-md border border-tl-line bg-tl-paper p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-tl-ink">
                Issue pathway {index + 1}
                {entry.linkedIncidentId
                  ? ` · ${entry.linkedIncidentId}`
                  : ""}
              </h4>
              <button
                type="button"
                className="text-xs text-tl-danger underline"
                onClick={() => removeEntry(entry.id)}
              >
                Remove issue
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  className={inputClass}
                  value={entry.title}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, { title: e.target.value }),
                    )
                  }
                  placeholder="Short issue title"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Category
                </label>
                <select
                  className={inputClass}
                  value={entry.category || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, {
                        category: e.target.value,
                      }),
                    )
                  }
                >
                  <option value="">Select category</option>
                  {ISSUE_LOG_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Person reporting
                </label>
                <input
                  className={inputClass}
                  value={entry.reporterName || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, {
                        reporterName: e.target.value,
                      }),
                    )
                  }
                  placeholder="Name or anonymous"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Date and time reported / captured
                </label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={entry.reportedAt || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, {
                        reportedAt: e.target.value,
                      }),
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-tl-line pt-3">
              <p className="text-sm font-medium text-tl-ink">Follow-ups</p>
              {(entry.followUps || []).map((fu, fi) => (
                <div
                  key={fu.id}
                  className="grid gap-2 rounded-md border border-tl-line bg-tl-surface p-2 sm:grid-cols-2"
                >
                  <p className="sm:col-span-2 text-xs font-medium text-tl-ink-muted">
                    Follow-up {fi + 1}
                  </p>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Action description
                    </label>
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={fu.action}
                      onChange={(e) =>
                        setEntries(
                          patchFollowUp(entries, entry.id, fu.id, {
                            action: e.target.value,
                          }),
                        )
                      }
                      placeholder="First action taken…"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs font-medium">
                      Outcomes
                    </label>
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={fu.outcome || ""}
                      onChange={(e) =>
                        setEntries(
                          patchFollowUp(entries, entry.id, fu.id, {
                            outcome: e.target.value,
                          }),
                        )
                      }
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium">
                      Date / time
                    </label>
                    <input
                      type="datetime-local"
                      className={inputClass}
                      value={fu.at || ""}
                      onChange={(e) =>
                        setEntries(
                          patchFollowUp(entries, entry.id, fu.id, {
                            at: e.target.value,
                          }),
                        )
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="text-xs text-tl-danger underline"
                      onClick={() => removeFollowUp(entry.id, fu.id)}
                      disabled={(entry.followUps || []).length <= 1}
                    >
                      Remove follow-up
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-xs font-medium hover:bg-tl-paper"
                onClick={() => addFollowUp(entry.id)}
              >
                Add another follow-up step
              </button>
            </div>

            <div className="grid gap-3 border-t border-tl-line pt-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Escalated — to whom
                </label>
                <input
                  className={inputClass}
                  value={entry.escalatedTo || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, {
                        escalatedTo: e.target.value,
                      }),
                    )
                  }
                  placeholder="Supervisor / site manager / …"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Escalated — date / time
                </label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={entry.escalatedAt || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, {
                        escalatedAt: e.target.value,
                      }),
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Feedback — date / time
                </label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={entry.feedbackAt || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, {
                        feedbackAt: e.target.value,
                      }),
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Resolved — date / time
                </label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={entry.resolvedAt || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, {
                        resolvedAt: e.target.value,
                      }),
                    )
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Closed — date / time
                </label>
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={entry.closedAt || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, {
                        closedAt: e.target.value,
                      }),
                    )
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Pathway notes
                </label>
                <textarea
                  rows={2}
                  className={inputClass}
                  value={entry.notes || ""}
                  onChange={(e) =>
                    setEntries(
                      patchEntry(entries, entry.id, { notes: e.target.value }),
                    )
                  }
                />
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={() => addEntry()}
        className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
      >
        Add issue pathway
      </button>

      {entries.length > 0 ? (
        <p className="text-xs text-tl-ink-muted">
          Rollup: logged {data.casesLogged ?? 0} · open {data.casesOpen ?? 0} ·
          closed {data.casesClosed ?? 0} · escalated{" "}
          {data.casesEscalated ?? 0}
        </p>
      ) : null}
    </div>
  );
}
