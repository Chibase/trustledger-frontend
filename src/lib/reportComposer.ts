/**
 * Pull workspace evidence into report drafts (incidents + captures).
 */

import { listCaptureRecords } from "@/lib/captureStore";
import type { Incident } from "@/types/incident";
import type { EvidenceStubRef } from "@/types/activityReport";

export type PeriodActivityFacts = {
  attended: Incident[];
  escalated: Incident[];
  resolved: Incident[];
  pending: Incident[];
  unresolvedBlocked: Incident[];
  meetingCaptures: ReturnType<typeof listCaptureRecords>;
  evidence: EvidenceStubRef[];
};

export function buildPeriodActivityFacts(
  incidents: Incident[],
): PeriodActivityFacts {
  const open = incidents.filter((i) => i.status !== "Closed");
  const closed = incidents.filter((i) => i.status === "Closed");
  const escalated = incidents.filter(
    (i) =>
      i.escalationLevel !== "None" ||
      i.escalationPolicy?.suggestedTier === "senior",
  );
  const captures = listCaptureRecords().filter(
    (c) =>
      c.source === "minutes" ||
      c.source === "attendance" ||
      c.source === "pasted_report",
  );

  const evidence: EvidenceStubRef[] = captures.slice(0, 12).map((c) => ({
    id: `ev-${c.id}`,
    kind:
      c.source === "attendance"
        ? "attendance"
        : c.source === "minutes"
          ? "minutes"
          : "other",
    label: c.title,
    linkedCaptureId: c.id,
  }));

  // Demo photo stubs when captures are thin
  if (evidence.length < 2) {
    evidence.push({
      id: "ev-photo-demo",
      kind: "photo",
      label: "Site photo stub (attach in live mode)",
    });
  }

  return {
    attended: incidents.slice(0, 12),
    escalated,
    resolved: closed,
    pending: open.filter((i) => i.status === "Open" || i.status === "Investigating"),
    unresolvedBlocked: open.filter(
      (i) => i.slaBreached || i.status === "Escalated",
    ),
    meetingCaptures: captures,
    evidence,
  };
}

export function factsToPromptBlock(facts: PeriodActivityFacts): string {
  const line = (label: string, rows: Incident[]) =>
    `${label} (${rows.length}): ${rows.map((i) => `${i.id} ${i.title} [${i.priority}]`).join("; ") || "none"}`;

  return [
    line("Attended", facts.attended),
    line("Escalated", facts.escalated),
    line("Resolved/closed", facts.resolved),
    line("Pending", facts.pending),
    line("Unable/blocked", facts.unresolvedBlocked),
    `Meetings/captures (${facts.meetingCaptures.length}): ${facts.meetingCaptures.map((c) => c.title).join("; ") || "none"}`,
    `Evidence stubs: ${facts.evidence.map((e) => e.label).join("; ")}`,
  ].join("\n");
}
