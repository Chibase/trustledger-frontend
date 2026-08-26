"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import {
  downloadSepMarkdown,
  downloadSepPdf,
  downloadSepWord,
} from "@/lib/sepExport";
import type { EngagementPlan } from "@/types/engagementPlan";

type Props = {
  plan: EngagementPlan;
  onPrint?: () => void;
};

export function SepExportActions({ plan, onPrint }: Props) {
  const { pushToast } = useToast();
  const [pdfBusy, setPdfBusy] = useState(false);

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={pdfBusy}
        onClick={() => {
          setPdfBusy(true);
          void downloadSepPdf(plan)
            .then(() => pushToast("PDF downloaded.", "success"))
            .catch((err: unknown) => {
              pushToast(
                err instanceof Error ? err.message : "Could not build the PDF.",
                "error",
              );
            })
            .finally(() => setPdfBusy(false));
        }}
        className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink disabled:opacity-60"
      >
        {pdfBusy ? "Building PDF…" : "PDF"}
      </button>
      <button
        type="button"
        onClick={() => downloadSepMarkdown(plan)}
        className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium hover:bg-tl-paper"
      >
        Markdown
      </button>
      <button
        type="button"
        onClick={() => downloadSepWord(plan)}
        className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium hover:bg-tl-paper"
      >
        Word
      </button>
      <button
        type="button"
        onClick={() => {
          if (onPrint) onPrint();
          else window.print();
        }}
        className="rounded-md border border-tl-line px-4 py-2 text-sm font-medium hover:bg-tl-paper"
      >
        Print layout
      </button>
    </div>
  );
}
