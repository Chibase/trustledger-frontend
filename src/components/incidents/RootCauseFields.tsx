"use client";

import {
  GRIEVANCE_ROOT_CAUSES,
  type GrievanceRootCauseId,
} from "@/lib/grievanceRootCause";

type RootCauseFieldsProps = {
  cause: string;
  note: string;
  onCause: (value: string) => void;
  onNote: (value: string) => void;
  disabled?: boolean;
};

export function RootCauseFields({
  cause,
  note,
  onCause,
  onNote,
  disabled,
}: RootCauseFieldsProps) {
  return (
    <div className="mt-4 space-y-3 rounded-md border border-tl-line bg-tl-paper/60 p-3">
      <div>
        <label
          htmlFor="root-cause"
          className="mb-1 block text-xs font-medium text-tl-ink"
        >
          Root cause
        </label>
        <select
          id="root-cause"
          value={cause}
          disabled={disabled}
          onChange={(event) => onCause(event.target.value)}
          className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
        >
          <option value="">Select why this happened…</option>
          {GRIEVANCE_ROOT_CAUSES.map((row) => (
            <option key={row.id} value={row.id}>
              {row.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Nature is what was raised. This tag is why it happened. Required
          before Investigate or Resolve. It is not a trust-movement cause.
        </p>
      </div>
      {cause === ("other" satisfies GrievanceRootCauseId) ? (
        <div>
          <label
            htmlFor="root-cause-note"
            className="mb-1 block text-xs font-medium text-tl-ink"
          >
            Other — short note
          </label>
          <textarea
            id="root-cause-note"
            value={note}
            disabled={disabled}
            onChange={(event) => onNote(event.target.value)}
            rows={2}
            className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
            placeholder="Describe the cause in a sentence."
          />
        </div>
      ) : null}
    </div>
  );
}
