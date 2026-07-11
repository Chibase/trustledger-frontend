"use client";

import { useState } from "react";
import { AiAssistButton } from "@/components/ai/AiAssistButton";
import { AiSuggestionPanel } from "@/components/ai/AiSuggestionPanel";
import { aiService } from "@/services/aiService";
import type { AiSuggestionStatus, ReportBriefSuggestion } from "@/types/ai";

export function ReportBriefAssist() {
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
    } catch (err) {
      setBrief(null);
      setError(err instanceof Error ? err.message : "Brief generation failed.");
      setStatus("error");
    }
  }

  return (
    <section className="space-y-3 rounded-lg border border-tl-line bg-tl-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">AI compliance brief</h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Draft a board-ready summary from open incidents. Review before sharing.
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
          </div>
        ) : null}
      </AiSuggestionPanel>
    </section>
  );
}
