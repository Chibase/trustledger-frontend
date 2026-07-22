"use client";

import { useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { requireEmailThen } from "@/components/shell/EmailCaptureGate";
import { useToast } from "@/components/ui/Toast";
import { aiService } from "@/services/aiService";
import type { AiSuggestionStatus, ReportBriefSuggestion } from "@/types/ai";

export function ReportBriefAssist() {
  const { pushToast } = useToast();
  const [status, setStatus] = useState<AiSuggestionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<ReportBriefSuggestion | null>(null);

  async function handleGenerate() {
    setError(null);
    setStatus("loading");
    try {
      const result = await aiService.generateReportBrief({
        audience: "board",
        incidentIds: ["INC-1001", "INC-1004"],
      });
      setBrief(result);
      setStatus("ready");
      pushToast("Brief draft ready", "success");
    } catch (err) {
      setBrief(null);
      setError(err instanceof Error ? err.message : "Brief generation failed.");
      setStatus("error");
    }
  }

  function handleSave() {
    if (!brief) return;
    requireEmailThen("save", () => {
      const blob = new Blob(
        [
          `${brief.title}\n\n${brief.executiveSummary}\n\nKey risks:\n${brief.keyRisks.map((r) => `- ${r}`).join("\n")}\n\nActions:\n${brief.recommendedActions.map((a) => `- ${a}`).join("\n")}\n`,
        ],
        { type: "text/plain;charset=utf-8" },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "trustledger-brief.txt";
      a.click();
      URL.revokeObjectURL(url);
      pushToast("Brief saved", "success");
    });
  }

  function handlePrint() {
    if (!brief) return;
    requireEmailThen("print", () => {
      window.print();
    });
  }

  return (
    <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">AI compliance brief</h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Draft a board-ready summary from demo cases (INC-1001, INC-1004).
            Evidence writer only — not Cloud/Frappe templates. Review before
            sharing.
          </p>
        </div>
        <AiAssistButton
          label="Generate brief"
          onClick={handleGenerate}
          loading={status === "loading"}
        />
      </div>

      <AiSuggestionPanel
        title={brief?.title || "Report brief"}
        status={status}
        error={error}
        model={brief?.model}
        promptVersion={brief?.promptVersion}
      >
        {brief ? (
          <div className="space-y-3">
            <p>{brief.executiveSummary}</p>
            <div>
              <p className="font-medium">Key risks</p>
              <ul className="mt-1 list-disc pl-5">
                {brief.keyRisks.map((risk) => (
                  <li key={risk}>{risk}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Recommended actions</p>
              <ul className="mt-1 list-disc pl-5">
                {brief.recommendedActions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-tl-ink-muted">
              Cited: {brief.citedIncidentIds.join(", ")}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-md bg-tl-trust px-3 py-1.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-md border border-tl-line px-3 py-1.5 text-sm font-medium"
              >
                Print
              </button>
            </div>
          </div>
        ) : null}
      </AiSuggestionPanel>
    </section>
  );
}
