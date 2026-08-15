"use client";

import {
  ENGAGEMENT_KIND_OPTIONS,
  MEETING_PURPOSE_OPTIONS,
  SEVERITY_OPTIONS,
  type Project,
} from "@/types/project";
import { openPromises, projectPlaceOptions } from "@/lib/projectDossier";
import { COMPLAINT_NATURES } from "@/lib/grievanceProcess";

export type FieldNoteMeta = {
  purpose: string;
  kind: string;
  place: string;
  linkedPromiseId: string;
  concernTheme: string;
  severity: string;
};

type Props = {
  project: Project;
  meta: FieldNoteMeta;
  onChange: (meta: FieldNoteMeta) => void;
};

const inputClass =
  "w-full rounded-md border border-tl-line px-3 py-2 text-sm bg-tl-surface";

/** Dropdowns filled from the selected project's dossier. */
export function CaptureFieldNoteMeta({ project, meta, onChange }: Props) {
  const places = projectPlaceOptions(project);
  const promises = openPromises(project);

  function patch(partial: Partial<FieldNoteMeta>) {
    onChange({ ...meta, ...partial });
  }

  return (
    <div className="grid gap-3 rounded-md border border-tl-line bg-tl-paper p-3 sm:grid-cols-2">
      <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wide text-tl-ink-muted">
        Linked to {project.name} — choose from saved details
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="fn-place">
          Place / ward
        </label>
        <select
          id="fn-place"
          className={inputClass}
          value={meta.place}
          onChange={(e) => patch({ place: e.target.value })}
        >
          <option value="">Select place</option>
          {places.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value="__other">Other (type in notes)</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="fn-purpose">
          Purpose
        </label>
        <select
          id="fn-purpose"
          className={inputClass}
          value={meta.purpose}
          onChange={(e) => patch({ purpose: e.target.value })}
        >
          <option value="">Select purpose</option>
          {MEETING_PURPOSE_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="fn-kind">
          Engagement kind
        </label>
        <select
          id="fn-kind"
          className={inputClass}
          value={meta.kind}
          onChange={(e) => patch({ kind: e.target.value })}
        >
          <option value="">Select kind</option>
          {ENGAGEMENT_KIND_OPTIONS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="fn-promise">
          Linked promise
        </label>
        <select
          id="fn-promise"
          className={inputClass}
          value={meta.linkedPromiseId}
          onChange={(e) => patch({ linkedPromiseId: e.target.value })}
        >
          <option value="">None</option>
          {promises.map((p) => (
            <option key={p.id} value={p.id}>
              {p.text}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="fn-theme">
          Concern theme (if any)
        </label>
        <select
          id="fn-theme"
          className={inputClass}
          value={meta.concernTheme}
          onChange={(e) => patch({ concernTheme: e.target.value })}
        >
          <option value="">None</option>
          {COMPLAINT_NATURES.map((n) => (
            <option key={n.id} value={n.id}>
              {n.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="fn-sev">
          Severity
        </label>
        <select
          id="fn-sev"
          className={inputClass}
          value={meta.severity}
          onChange={(e) => patch({ severity: e.target.value })}
        >
          <option value="">Select</option>
          {SEVERITY_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function fieldNoteMetaPreamble(meta: FieldNoteMeta): string {
  const lines = [
    meta.place ? `Place / ward: ${meta.place}` : null,
    meta.purpose ? `Purpose: ${meta.purpose}` : null,
    meta.kind ? `Kind: ${meta.kind}` : null,
    meta.concernTheme ? `Concern theme: ${meta.concernTheme}` : null,
    meta.severity ? `Severity: ${meta.severity}` : null,
  ].filter(Boolean);
  return lines.length ? `${lines.join("\n")}\n\n` : "";
}
