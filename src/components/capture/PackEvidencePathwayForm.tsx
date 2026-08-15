"use client";

import {
  createIssueLogFollowUpId,
  emptyPackEvidenceEntry,
  type PackCategoryOption,
  type PackEvidenceEntry,
  type IssueLogFollowUp,
} from "@/lib/captureStore";

const inputClass =
  "w-full rounded-md border border-tl-line px-3 py-2 text-sm bg-tl-surface";

type Props = {
  /** Pack label for headings (e.g. B-BBEE / Empowerment). */
  packLabel: string;
  categories: readonly PackCategoryOption[];
  entries: PackEvidenceEntry[];
  onChange: (entries: PackEvidenceEntry[]) => void;
  /** Optional intro under the sequence reminder. */
  intro?: string;
};

function patchEntry(
  entries: PackEvidenceEntry[],
  id: string,
  partial: Partial<PackEvidenceEntry>,
): PackEvidenceEntry[] {
  return entries.map((e) => (e.id === id ? { ...e, ...partial } : e));
}

function patchFollowUp(
  entries: PackEvidenceEntry[],
  entryId: string,
  followUpId: string,
  partial: Partial<IssueLogFollowUp>,
): PackEvidenceEntry[] {
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

/**
 * Sequenced evidence pathway editor shared by Issue log and domain report packs:
 * title → category → reporter → reported → evidence detail → follow-ups →
 * escalate → feedback → resolve → close.
 */
export function PackEvidencePathwayForm({
  packLabel,
  categories,
  entries,
  onChange,
  intro,
}: Props) {
  function addEntry() {
    onChange([...entries, emptyPackEvidenceEntry()]);
  }

  function removeEntry(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }

  function addFollowUp(entryId: string) {
    onChange(
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
    onChange(
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

  const titled = entries.filter((e) => e.title.trim());
  const open = titled.filter((e) => !e.closedAt).length;
  const closed = titled.filter((e) => Boolean(e.closedAt)).length;
  const escalated = titled.filter((e) =>
    Boolean(e.escalatedTo || e.escalatedAt),
  ).length;

  return (
    <div className="space-y-4 border-t border-tl-line pt-4">
      <div>
        <p className="text-sm font-medium text-tl-ink">
          {packLabel} — evidence pathways
        </p>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Sequence per matter: title → category → person reporting → date/time
          reported → evidence detail → follow-ups (action, outcome, date/time) →
          escalated → feedback → resolved → closed. Stored on this project pack
          for reports and Trust measurement.
        </p>
        {intro ? (
          <p className="mt-1 text-xs text-tl-ink-muted">{intro}</p>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-tl-ink-muted">
          No {packLabel} pathways yet — add the first matter below.
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
                {packLabel} matter {index + 1}
                {entry.linkedIncidentId
                  ? ` · ${entry.linkedIncidentId}`
                  : ""}
              </h4>
              <button
                type="button"
                className="text-xs text-tl-danger underline"
                onClick={() => removeEntry(entry.id)}
              >
                Remove
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Title</label>
                <input
                  className={inputClass}
                  value={entry.title}
                  onChange={(e) =>
                    onChange(
                      patchEntry(entries, entry.id, { title: e.target.value }),
                    )
                  }
                  placeholder={`Short ${packLabel} matter title`}
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
                    onChange(
                      patchEntry(entries, entry.id, {
                        category: e.target.value,
                      }),
                    )
                  }
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
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
                    onChange(
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
                    onChange(
                      patchEntry(entries, entry.id, {
                        reportedAt: e.target.value,
                      }),
                    )
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Evidence detail (what happened / what was observed)
                </label>
                <textarea
                  rows={3}
                  className={inputClass}
                  value={entry.evidenceDetail || ""}
                  onChange={(e) =>
                    onChange(
                      patchEntry(entries, entry.id, {
                        evidenceDetail: e.target.value,
                      }),
                    )
                  }
                  placeholder="Facts, quantities, places, people — enough to stand as report evidence"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Document / media refs
                </label>
                <input
                  className={inputClass}
                  value={entry.documentRefs || ""}
                  onChange={(e) =>
                    onChange(
                      patchEntry(entries, entry.id, {
                        documentRefs: e.target.value,
                      }),
                    )
                  }
                  placeholder="Certificate #, register page, photo CAP-…, meeting minutes…"
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
                        onChange(
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
                        onChange(
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
                        onChange(
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
                    onChange(
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
                    onChange(
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
                    onChange(
                      patchEntry(entries, entry.id, {
                        feedbackAt: e.target.value,
                      }),
                    )
                  }
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">
                  Feedback / stakeholder response
                </label>
                <textarea
                  rows={2}
                  className={inputClass}
                  value={entry.feedbackNotes || ""}
                  onChange={(e) =>
                    onChange(
                      patchEntry(entries, entry.id, {
                        feedbackNotes: e.target.value,
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
                    onChange(
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
                    onChange(
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
                    onChange(
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
        onClick={addEntry}
        className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium hover:bg-tl-paper"
      >
        Add {packLabel} pathway
      </button>

      {titled.length > 0 ? (
        <p className="text-xs text-tl-ink-muted">
          Rollup: logged {titled.length} · open {open} · closed {closed} ·
          escalated {escalated}
        </p>
      ) : null}
    </div>
  );
}
