"use client";

import { useEffect, useId } from "react";
import {
  HorizontalBarChart,
  VerticalBarChart,
} from "@/components/ops/charts/BarChart";
import {
  REPORT_AUDIENCE_LABELS,
  REPORT_KIND_LABELS,
  type ReportAudience,
  type ReportFormatId,
  type ReportKind,
} from "@/types/activityReport";

export type PresentationChartBar = { label: string; value: number };

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  projectName: string;
  periodLabel: string;
  kind: ReportKind;
  audience: ReportAudience;
  format: ReportFormatId;
  onFormatChange: (format: ReportFormatId) => void;
  bodyMarkdown: string;
  chartBars: PresentationChartBar[];
  onPrint: () => void;
  onDownload: () => void;
};

const FORMAT_OPTIONS: Array<{ id: ReportFormatId; label: string }> = [
  { id: "charts", label: "Charts" },
  { id: "details", label: "Details" },
  { id: "charts_details", label: "Charts + details" },
];

/**
 * Full-viewport presentation for a project report.
 * Opens on View — fills the screen in the chosen format; download/print stay available.
 */
export function ReportPresentationView({
  open,
  onClose,
  title,
  projectName,
  periodLabel,
  kind,
  audience,
  format,
  onFormatChange,
  bodyMarkdown,
  chartBars,
  onPrint,
  onDownload,
}: Props) {
  const titleId = useId();
  const showCharts = format === "charts" || format === "charts_details";
  const showDetails = format === "details" || format === "charts_details";

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      id="tl-report-presentation"
      className="fixed inset-0 z-[80] flex flex-col bg-tl-paper text-tl-ink print:static print:z-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-tl-line bg-tl-surface px-4 py-3 print:hidden sm:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            TrustLedger · presentation
          </p>
          <h2
            id={titleId}
            className="truncate font-display text-lg font-semibold text-tl-ink sm:text-xl"
          >
            {title}
          </h2>
          <p className="text-sm text-tl-ink-muted">
            {projectName} · {periodLabel} · {REPORT_KIND_LABELS[kind]} ·{" "}
            {REPORT_AUDIENCE_LABELS[audience]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span className="font-medium">Format</span>
            <select
              className="rounded-md border border-tl-line bg-tl-paper px-2 py-1.5 text-sm"
              value={format}
              onChange={(e) =>
                onFormatChange(e.target.value as ReportFormatId)
              }
            >
              {FORMAT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={onDownload}
            className="rounded-md border border-tl-line bg-tl-paper px-3 py-1.5 text-sm font-medium hover:border-tl-trust/40"
          >
            Download
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="rounded-md border border-tl-line bg-tl-paper px-3 py-1.5 text-sm font-medium hover:border-tl-trust/40"
          >
            Print
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Close
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 print:overflow-visible print:px-0 print:py-0">
        <div className="mx-auto max-w-5xl space-y-8 print:max-w-none">
          <header className="hidden print:block">
            <p className="text-xs uppercase tracking-wide text-tl-ink-muted">
              TrustLedger
            </p>
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-tl-ink-muted">
              {projectName} · {periodLabel} · {REPORT_KIND_LABELS[kind]} ·{" "}
              {REPORT_AUDIENCE_LABELS[audience]} ·{" "}
              {FORMAT_OPTIONS.find((f) => f.id === format)?.label}
            </p>
          </header>

          {showCharts ? (
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-tl-ink">
                Charts — {REPORT_KIND_LABELS[kind]}
              </h3>
              {chartBars.length ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <figure className="rounded-lg border border-tl-line bg-tl-surface p-4 print:break-inside-avoid">
                    <figcaption className="mb-3 text-sm font-medium text-tl-ink-muted">
                      Category signals
                    </figcaption>
                    <HorizontalBarChart bars={chartBars} maxHeight={220} />
                  </figure>
                  <figure className="rounded-lg border border-tl-line bg-tl-surface p-4 print:break-inside-avoid">
                    <figcaption className="mb-3 text-sm font-medium text-tl-ink-muted">
                      Top measures
                    </figcaption>
                    <VerticalBarChart
                      bars={chartBars.slice(0, 6).map((b) => ({
                        label: b.label.slice(0, 14),
                        value: b.value,
                      }))}
                    />
                  </figure>
                </div>
              ) : (
                <p className="text-sm text-tl-ink-muted">
                  No chart values for this format yet — capture category data on
                  the project, then reopen.
                </p>
              )}
            </section>
          ) : null}

          {showDetails ? (
            <section className="space-y-3">
              <h3 className="text-base font-semibold text-tl-ink">Details</h3>
              {bodyMarkdown.trim() ? (
                <article className="prose prose-sm max-w-none whitespace-pre-wrap text-base leading-relaxed text-tl-ink sm:prose-base">
                  {bodyMarkdown}
                </article>
              ) : (
                <p className="text-sm text-tl-ink-muted">
                  No narrative body yet. Generate details for this kind, or
                  switch format to Charts only.
                </p>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
