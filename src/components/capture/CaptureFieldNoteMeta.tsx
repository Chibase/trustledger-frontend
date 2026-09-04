"use client";

import {
  ENGAGEMENT_KIND_OPTIONS,
  MEETING_PURPOSE_OPTIONS,
  SEVERITY_OPTIONS,
  type Project,
} from "@/types/project";
import { openPromises, projectPlaceOptions } from "@/lib/projectDossier";
import { COMPLAINT_NATURES } from "@/lib/grievanceProcess";
import { COMMUNITY_LANGUAGE_HINTS } from "@/lib/trust/language";
import { type FieldNoteMeta } from "@/lib/trust/fieldCapture";

export type { FieldNoteMeta } from "@/lib/trust/fieldCapture";
export { EMPTY_FIELD_META, fieldNoteMetaPreamble } from "@/lib/trust/fieldCapture";

type Props = {
  project: Project;
  meta: FieldNoteMeta;
  onChange: (meta: FieldNoteMeta) => void;
};

const inputClass =
  "w-full rounded-md border border-tl-line px-3 py-2 text-sm bg-tl-surface";

const LANGUAGE_LIST_ID = "tl-community-language-hints";

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
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="fn-held">
          Date of meeting
        </label>
        <input
          id="fn-held"
          type="date"
          className={inputClass}
          value={meta.meetingHeldOn}
          onChange={(e) => patch({ meetingHeldOn: e.target.value })}
        />
        <p className="mt-1 text-[0.7rem] text-tl-ink-muted">
          Use the day the meeting happened — not today — when notes arrive
          later.
        </p>
      </div>
      <div className="flex items-end">
        <label className="flex items-start gap-2 text-sm text-tl-ink">
          <input
            type="checkbox"
            className="mt-1"
            checked={meta.capturedAfterMeeting}
            onChange={(e) =>
              patch({ capturedAfterMeeting: e.target.checked })
            }
          />
          <span>
            Captured after the meeting
            <span className="mt-0.5 block text-xs text-tl-ink-muted">
              Notes / register handed over later (SF or CLO not on site).
            </span>
          </span>
        </label>
      </div>

      <details className="sm:col-span-2 rounded-md border border-dashed border-tl-line bg-tl-surface/70 p-3">
        <summary className="cursor-pointer text-sm font-medium text-tl-ink">
          Field context (optional)
        </summary>
        <p className="mt-2 text-xs text-tl-ink-muted">
          For field meetings, oral accounts, and low connectivity. Leave blank
          when it does not apply — no community is forced onto one template.
        </p>
        {meta.rapidCapture ? (
          <p className="mt-2 text-sm text-tl-ink">
            Notes-first is enough. Dropdowns above can wait.
          </p>
        ) : null}
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="flex items-start gap-2 text-sm text-tl-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={meta.rapidCapture}
              onChange={(e) => patch({ rapidCapture: e.target.checked })}
            />
            <span>
              Rapid capture
              <span className="mt-0.5 block text-xs text-tl-ink-muted">
                Notes first; structure later.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-tl-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={meta.oralCapture}
              onChange={(e) => patch({ oralCapture: e.target.checked })}
            />
            <span>
              Oral source
              <span className="mt-0.5 block text-xs text-tl-ink-muted">
                Spoken account, not a written form.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 text-sm text-tl-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={meta.lowConnectivity}
              onChange={(e) => patch({ lowConnectivity: e.target.checked })}
            />
            <span>
              Low connectivity
              <span className="mt-0.5 block text-xs text-tl-ink-muted">
                Offline / delayed handover.
              </span>
            </span>
          </label>
        </div>
        <datalist id={LANGUAGE_LIST_ID}>
          {COMMUNITY_LANGUAGE_HINTS.map((lang) => (
            <option key={lang} value={lang} />
          ))}
        </datalist>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="fn-spoken">
              Spoken / community language
            </label>
            <input
              id="fn-spoken"
              className={inputClass}
              list={LANGUAGE_LIST_ID}
              value={meta.spokenLanguage}
              onChange={(e) => patch({ spokenLanguage: e.target.value })}
              placeholder="Leave blank if unknown"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="fn-working">
              Working / desk language
            </label>
            <input
              id="fn-working"
              className={inputClass}
              list={LANGUAGE_LIST_ID}
              value={meta.workingLanguage}
              onChange={(e) => patch({ workingLanguage: e.target.value })}
              placeholder="Not assumed to be English"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium" htmlFor="fn-local">
              Local context notes
            </label>
            <textarea
              id="fn-local"
              rows={2}
              className={inputClass}
              value={meta.localContextNotes}
              onChange={(e) => patch({ localContextNotes: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="fn-history">
              Community history
            </label>
            <textarea
              id="fn-history"
              rows={2}
              className={inputClass}
              value={meta.historyNotes}
              onChange={(e) => patch({ historyNotes: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="fn-sens">
              Social sensitivity
            </label>
            <textarea
              id="fn-sens"
              rows={2}
              className={inputClass}
              value={meta.socialSensitivityNotes}
              onChange={(e) => patch({ socialSensitivityNotes: e.target.value })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="fn-power">
              Power / authority context
            </label>
            <textarea
              id="fn-power"
              rows={2}
              className={inputClass}
              value={meta.powerStructureNotes}
              onChange={(e) => patch({ powerStructureNotes: e.target.value })}
              placeholder="Traditional, ward, informal, institutional — as it is locally"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium" htmlFor="fn-barriers">
              Trust barriers
            </label>
            <textarea
              id="fn-barriers"
              rows={2}
              className={inputClass}
              value={meta.barriers}
              onChange={(e) => patch({ barriers: e.target.value })}
              placeholder="Connectivity, language, distance, protocol…"
            />
          </div>
        </div>
        <details className="mt-3 rounded-md border border-tl-line bg-tl-paper p-3">
          <summary className="cursor-pointer text-sm font-medium text-tl-ink">
            Participation realism (optional)
          </summary>
          <p className="mt-2 text-xs text-tl-ink-muted">
            Attendance is not consent. Mixed motives are allowed. Quiet
            presence and walkouts are valid responses.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="fn-motive">
                Motivation
              </label>
              <select
                id="fn-motive"
                className={inputClass}
                value={meta.motivation}
                onChange={(e) => patch({ motivation: e.target.value })}
              >
                <option value="">Unknown / not captured</option>
                <option value="trust">Trust</option>
                <option value="obligation">Obligation</option>
                <option value="livelihood">Livelihood</option>
                <option value="mixed">Mixed</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="fn-presence">
                Presence
              </label>
              <select
                id="fn-presence"
                className={inputClass}
                value={meta.presenceMode}
                onChange={(e) => patch({ presenceMode: e.target.value })}
              >
                <option value="">Unknown / not captured</option>
                <option value="in_person">In person</option>
                <option value="proxy">Proxy</option>
                <option value="household_rep">Household representative</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium" htmlFor="fn-response">
                Response pattern
              </label>
              <select
                id="fn-response"
                className={inputClass}
                value={meta.responsePattern}
                onChange={(e) => patch({ responsePattern: e.target.value })}
              >
                <option value="">Unknown / not captured</option>
                <option value="vocal">Vocal</option>
                <option value="quiet_presence">Quiet presence</option>
                <option value="walkout">Walkout</option>
                <option value="mixed">Mixed</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm text-tl-ink">
            <input
              type="checkbox"
              className="mt-1"
              checked={meta.attendanceDoesNotEqualConsent}
              onChange={(e) =>
                patch({ attendanceDoesNotEqualConsent: e.target.checked })
              }
            />
            <span>
              Attendance does not equal consent
              <span className="mt-0.5 block text-xs text-tl-ink-muted">
                Being present, or sending a representative, is not agreement.
              </span>
            </span>
          </label>
        </details>
      </details>
    </div>
  );
}
