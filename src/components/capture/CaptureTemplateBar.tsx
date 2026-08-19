"use client";

import { useRef, useState } from "react";
import { fieldTemplateForSource } from "@/data/fieldTemplates";
import { PLAN_CAPABILITIES } from "@/config/entitlements";
import type { PlanId } from "@/config/plans";
import { arrangeRoughNotesIntoTemplate } from "@/lib/arrangeFieldNotes";
import {
  isNarrativeCaptureSource,
  type CaptureSource,
  type NarrativeCaptureSource,
} from "@/lib/captureStore";

type Props = {
  source: CaptureSource;
  planId?: PlanId | null;
  body: string;
  onInsert: (skeleton: string) => void;
  onBodyChange: (text: string) => void;
  onToast?: (message: string, tone?: "success" | "error") => void;
};

const ACCEPT =
  ".txt,.md,.csv,.text,text/plain,text/markdown,text/csv,application/csv";

function narrativeForArrange(source: CaptureSource): NarrativeCaptureSource {
  if (source === "minutes" || source === "attendance") return source;
  if (source === "social_intel" || source === "pasted_report") return source;
  return "minutes";
}

export function CaptureTemplateBar({
  source,
  planId,
  body,
  onInsert,
  onBodyChange,
  onToast,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  if (!isNarrativeCaptureSource(source)) return null;
  const template = fieldTemplateForSource(source);
  if (!template) return null;
  const skeleton = template.pasteSkeleton;
  const templateId = template.id;
  const shortTitle = template.shortTitle;
  const mapsTo = template.mapsTo;

  const inAppPdf = Boolean(
    planId && PLAN_CAPABILITIES[planId].includes("captureHub"),
  );
  const pdfHref = inAppPdf
    ? `/api/app/field-templates/file?id=${templateId}`
    : `/resources/${templateId}`;

  const showArrange =
    source === "minutes" || source === "attendance";

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const lower = file.name.toLowerCase();
    const okText =
      file.type.startsWith("text/") ||
      lower.endsWith(".txt") ||
      lower.endsWith(".md") ||
      lower.endsWith(".csv") ||
      lower.endsWith(".text");
    if (!okText) {
      onToast?.(
        "Upload a text file (.txt / .md / .csv). For PDF photos, paste typed notes or use Insert blank form.",
        "error",
      );
      return;
    }
    if (file.size > 1_500_000) {
      onToast?.("File is too large (max ~1.5 MB text).", "error");
      return;
    }
    setBusy(true);
    try {
      const raw = await file.text();
      const arranged = arrangeRoughNotesIntoTemplate(
        narrativeForArrange(source),
        raw,
        skeleton,
      );
      onBodyChange(arranged.text);
      onToast?.(arranged.note, "success");
    } catch {
      onToast?.("Could not read that file.", "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleArrange() {
    const arranged = arrangeRoughNotesIntoTemplate(
      narrativeForArrange(source),
      body,
      skeleton,
    );
    onBodyChange(arranged.text);
    onToast?.(arranged.note, "success");
  }

  return (
    <div className="rounded-lg border border-tl-line bg-tl-paper p-4">
      <p className="text-sm font-medium text-tl-ink">
        {shortTitle} — paste, upload, or arrange
      </p>
      <p className="mt-1 text-sm text-tl-ink-muted">
        Meetings often happen on site without SF/CLO present. Capture notes
        later: paste rough minutes or a register, upload a{" "}
        <span className="font-medium text-tl-ink">.txt / .md / .csv</span>, or
        arrange free text into labeled fields — then Suggest stakeholders →
        Apply. PDF download is the blank paper form for the meeting; it is not
        the upload path.
      </p>
      <ul className="mt-2 list-disc pl-5 text-xs text-tl-ink-muted">
        {mapsTo.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          onClick={() => onInsert(skeleton)}
          className="inline-flex justify-center rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          Insert blank form
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          className="inline-flex justify-center rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
        >
          {busy ? "Reading…" : "Upload notes (.txt / .md / .csv)"}
        </button>
        {showArrange ? (
          <button
            type="button"
            onClick={handleArrange}
            className="inline-flex justify-center rounded-md border border-tl-trust/40 bg-tl-surface px-3 py-2 text-sm font-medium text-tl-trust-ink hover:bg-tl-paper"
          >
            Arrange rough notes into form
          </button>
        ) : null}
        <a
          href={pdfHref}
          className="inline-flex justify-center rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          Download blank PDF
        </a>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        aria-label="Upload minutes or attendance notes as text"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
