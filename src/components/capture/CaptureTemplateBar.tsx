"use client";

import { fieldTemplateForSource } from "@/data/fieldTemplates";
import { PLAN_CAPABILITIES } from "@/config/entitlements";
import type { PlanId } from "@/config/plans";
import {
  isNarrativeCaptureSource,
  type CaptureSource,
} from "@/lib/captureStore";

type Props = {
  source: CaptureSource;
  planId?: PlanId | null;
  onInsert: (skeleton: string) => void;
};

export function CaptureTemplateBar({ source, planId, onInsert }: Props) {
  if (!isNarrativeCaptureSource(source)) return null;
  const template = fieldTemplateForSource(source);
  if (!template) return null;

  const inAppPdf = Boolean(
    planId && PLAN_CAPABILITIES[planId].includes("captureHub"),
  );
  const pdfHref = inAppPdf
    ? `/api/app/field-templates/file?id=${template.id}`
    : `/resources/${template.id}`;

  return (
    <div className="rounded-lg border border-tl-line bg-tl-paper p-4">
      <p className="text-sm font-medium text-tl-ink">
        Use the {template.shortTitle.toLowerCase()} template
      </p>
      <p className="mt-1 text-sm text-tl-ink-muted">
        Fill labeled fields in the meeting, then paste here. Capture maps
        name, organisation, kind, role, and actions on first apply — instead
        of reconstructing from free prose.
      </p>
      <ul className="mt-2 list-disc pl-5 text-xs text-tl-ink-muted">
        {template.mapsTo.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onInsert(template.pasteSkeleton)}
          className="inline-flex justify-center rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Insert blank form
        </button>
        <a
          href={pdfHref}
          className="inline-flex justify-center rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          Download {template.shortTitle.toLowerCase()} PDF
        </a>
      </div>
    </div>
  );
}
