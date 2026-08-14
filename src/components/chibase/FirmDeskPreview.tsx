"use client";

import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  KIND_LABEL,
  PREVIEW_MAX_ROWS,
  getPreviewDeskServerSnapshot,
  getPreviewDeskSnapshot,
  newPreviewId,
  previewCounts,
  sanitizePreviewText,
  subscribePreviewDesk,
  writePreviewDesk,
  type PreviewKind,
} from "@/lib/chibase/deskPreview";

type FirmDeskPreviewProps = {
  trialHref: string;
};

export function FirmDeskPreview({ trialHref }: FirmDeskPreviewProps) {
  const rows = useSyncExternalStore(
    subscribePreviewDesk,
    getPreviewDeskSnapshot,
    getPreviewDeskServerSnapshot,
  );
  const [kind, setKind] = useState<PreviewKind>("case");
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => previewCounts(rows), [rows]);

  function addRow(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const nextTitle = sanitizePreviewText(title, 80);
    if (nextTitle.length < 3) {
      setError("Name the item in a few words.");
      return;
    }
    if (rows.length >= PREVIEW_MAX_ROWS) {
      setError(
        "Preview holds twelve rows. Remove one, or start a trial for a real desk.",
      );
      return;
    }
    writePreviewDesk([
      {
        id: newPreviewId(),
        kind,
        title: nextTitle,
        place: sanitizePreviewText(place, 40),
        at: new Date().toISOString(),
      },
      ...rows,
    ]);
    setTitle("");
    setPlace("");
  }

  function removeRow(id: string) {
    writePreviewDesk(rows.filter((row) => row.id !== id));
  }

  function resetDesk() {
    writePreviewDesk([]);
    setError(null);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-tl-line bg-tl-surface shadow-[0_12px_40px_rgba(18,32,42,0.08)]">
      <div className="flex items-center justify-between gap-3 border-b border-tl-line bg-tl-ink px-4 py-2.5">
        <p className="text-sm font-semibold text-white">TrustLedger</p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-white/70">
          Preview desk · this browser only
        </p>
      </div>

      <div className="border-b border-tl-demo/30 bg-tl-demo px-4 py-2">
        <p className="text-xs text-white">
          Add mock cases, people, and promises. This is not a workspace and is
          never saved to Cloud. Keep a real trail on a 14-day own-data trial.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 p-3 sm:p-4">
        {(
          [
            ["Open cases", counts.cases],
            ["Named people", counts.people],
            ["Promises", counts.promises],
          ] as const
        ).map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-tl-line border-l-4 border-l-tl-trust bg-tl-paper px-2.5 py-2"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-tl-ink-muted">
              {label}
            </p>
            <p className="mt-0.5 font-display text-xl font-semibold tabular-nums text-tl-ink">
              {value}
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={addRow}
        className="space-y-2 border-t border-tl-line px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
          Add to the desk
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="desk-kind">
            Type
          </label>
          <select
            id="desk-kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as PreviewKind)}
            className="rounded-md border border-tl-line bg-tl-paper px-2.5 py-2 text-sm text-tl-ink sm:w-32"
          >
            <option value="case">Case</option>
            <option value="person">Person</option>
            <option value="promise">Promise</option>
          </select>
          <label className="sr-only" htmlFor="desk-title">
            Title
          </label>
          <input
            id="desk-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === "person"
                ? "Name and role"
                : kind === "promise"
                  ? "What was promised"
                  : "What was reported"
            }
            className="min-w-0 flex-1 rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink"
            maxLength={80}
            autoComplete="off"
          />
          <label className="sr-only" htmlFor="desk-place">
            Place
          </label>
          <input
            id="desk-place"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Place (optional)"
            className="rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink sm:w-36"
            maxLength={40}
            autoComplete="off"
          />
          <button
            type="submit"
            className="rounded-md bg-tl-trust px-3.5 py-2 text-sm font-semibold text-white hover:bg-tl-trust-ink"
          >
            Add
          </button>
        </div>
        {error ? <p className="text-xs text-tl-danger">{error}</p> : null}
      </form>

      <div className="max-h-56 overflow-auto border-t border-tl-line">
        {rows.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-tl-ink-muted">
            Empty desk. Add a case, a named person, or a promise — the counts
            update as you go.
          </p>
        ) : (
          <ul className="divide-y divide-tl-line">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-start justify-between gap-3 px-4 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-tl-trust">
                    {KIND_LABEL[row.kind]} · {row.id}
                  </p>
                  <p className="truncate text-sm font-medium text-tl-ink">
                    {row.title}
                  </p>
                  {row.place ? (
                    <p className="text-xs text-tl-ink-muted">{row.place}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="shrink-0 text-xs font-medium text-tl-ink-muted hover:text-tl-danger"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-tl-line bg-tl-paper px-4 py-3">
        <button
          type="button"
          onClick={resetDesk}
          className="text-xs font-medium text-tl-ink-muted hover:text-tl-ink"
        >
          Reset preview
        </button>
        <a
          href={trialHref}
          className="text-sm font-semibold text-tl-trust-ink underline-offset-2 hover:underline"
        >
          Keep a real trail — 14-day trial
        </a>
      </div>
    </div>
  );
}
