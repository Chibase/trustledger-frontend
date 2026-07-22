/**
 * Pull workspace evidence into report drafts and compose topic narratives.
 * Demo AI uses this locally; live mode can reuse the same facts block.
 */

import { listCaptureRecords } from "@/lib/captureStore";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import type {
  EvidenceStubRef,
  ReportSectionId,
} from "@/types/activityReport";
import type { Incident } from "@/types/incident";

export type PeriodActivityFacts = {
  attended: Incident[];
  escalated: Incident[];
  resolved: Incident[];
  pending: Incident[];
  unresolvedBlocked: Incident[];
  meetingCaptures: ReturnType<typeof listCaptureRecords>;
  evidence: EvidenceStubRef[];
  trustIndex: number;
  trustLabel: string;
  avgSentiment: number | null;
  projectName?: string;
};

export type ComposeNarrativeInput = {
  kindLabel: string;
  audienceLabel: string;
  periodLabel: string;
  authorTierLabel: string;
  authorName: string;
  projectName?: string;
  includedSectionIds: ReportSectionId[];
  includedSectionLabels: string[];
  lockedSectionLabels: string[];
  facts: PeriodActivityFacts;
  tonePreference?: "plain" | "formal" | "board";
};

function bulletIncidents(rows: Incident[], limit = 6): string {
  if (!rows.length) return "- None recorded in the selected scope for this period.";
  return rows
    .slice(0, limit)
    .map(
      (i) =>
        `- **${i.id}** — ${i.title} (${i.priority}, ${i.status}${i.ward ? `, ${i.ward}` : ""}). Owner: ${i.ownerName}.`,
    )
    .join("\n");
}

function proseList(rows: Incident[], limit = 4): string {
  if (!rows.length) return "none listed";
  return rows
    .slice(0, limit)
    .map((i) => `${i.id} (${i.title})`)
    .join("; ");
}

export function buildPeriodActivityFacts(
  incidents: Incident[],
  options?: { projectId?: string; projectName?: string },
): PeriodActivityFacts {
  const scoped = options?.projectId
    ? incidents.filter((i) => i.projectId === options.projectId)
    : incidents;
  const open = scoped.filter((i) => i.status !== "Closed");
  const closed = scoped.filter((i) => i.status === "Closed");
  const escalated = scoped.filter(
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

  if (evidence.length < 2) {
    evidence.push({
      id: "ev-photo-demo",
      kind: "photo",
      label: "Site photo stub (attach in live mode)",
    });
    if (scoped[0]) {
      evidence.push({
        id: `ev-case-${scoped[0].id}`,
        kind: "other",
        label: `Case file ${scoped[0].id} — ${scoped[0].title}`,
      });
    }
  }

  const trust = trustIndexFromIncidents(scoped);

  return {
    attended: scoped.slice(0, 12),
    escalated,
    resolved: closed,
    pending: open.filter(
      (i) => i.status === "Open" || i.status === "Investigating",
    ),
    unresolvedBlocked: open.filter(
      (i) => i.slaBreached || i.status === "Escalated",
    ),
    meetingCaptures: captures,
    evidence,
    trustIndex: trust.trustIndex,
    trustLabel: trust.label,
    avgSentiment: trust.avgSentiment,
    projectName: options?.projectName || scoped[0]?.projectName,
  };
}

export function factsToPromptBlock(facts: PeriodActivityFacts): string {
  const line = (label: string, rows: Incident[]) =>
    `${label} (${rows.length}): ${rows.map((i) => `${i.id} ${i.title} [${i.priority}]`).join("; ") || "none"}`;

  return [
    facts.projectName ? `Project scope: ${facts.projectName}` : "Project scope: portfolio",
    `Trust index: ${facts.trustIndex}/100 (${facts.trustLabel})${facts.avgSentiment != null ? `; avg sentiment ${facts.avgSentiment}` : ""}`,
    line("Attended", facts.attended),
    line("Escalated", facts.escalated),
    line("Resolved/closed", facts.resolved),
    line("Pending", facts.pending),
    line("Unable/blocked", facts.unresolvedBlocked),
    `Meetings/captures (${facts.meetingCaptures.length}): ${facts.meetingCaptures.map((c) => c.title).join("; ") || "none"}`,
    `Evidence stubs: ${facts.evidence.map((e) => e.label).join("; ")}`,
  ].join("\n");
}

function writeSection(
  id: ReportSectionId,
  label: string,
  facts: PeriodActivityFacts,
  meta: ComposeNarrativeInput,
): string {
  const scope =
    meta.projectName || facts.projectName || "the selected portfolio";
  const period = meta.periodLabel;

  switch (id) {
    case "period_summary":
      return `### ${label}

In ${period}, field and desk activity on **${scope}** centred on ${facts.attended.length} active case${facts.attended.length === 1 ? "" : "s"} with ${facts.escalated.length} escalation${facts.escalated.length === 1 ? "" : "s"} and ${facts.resolved.length} closure${facts.resolved.length === 1 ? "" : "s"}. Trust pulse sits at **${facts.trustIndex}/100 (${facts.trustLabel})**. Prepared by ${meta.authorName} (${meta.authorTierLabel}) for ${meta.audienceLabel}.`;

    case "activity_log":
      return `### ${label}

Day-to-day actions drawn from the case timeline and Capture hub for ${period}:

${bulletIncidents(facts.attended)}
${
  facts.meetingCaptures.length
    ? `\nMeeting / capture activity: ${facts.meetingCaptures
        .slice(0, 5)
        .map((c) => c.title)
        .join("; ")}.`
    : "\nNo meeting captures logged yet — add minutes or attendance via Capture."
}`;

    case "issues_attended":
      return `### ${label}

Cases attended in ${period} on ${scope}:

${bulletIncidents(facts.attended)}`;

    case "issues_escalated":
      return `### ${label}

${
  facts.escalated.length
    ? `The following matters required senior intervention or policy escalation:\n\n${bulletIncidents(facts.escalated)}`
    : "No formal escalations in the selected scope for this period."
}`;

    case "issues_resolved":
      return `### ${label}

${
  facts.resolved.length
    ? `Closed / resolved outcomes:\n\n${bulletIncidents(facts.resolved)}`
    : "No cases closed in this period yet — pending and blocked items are listed below."
}`;

    case "issues_pending":
      return `### ${label}

Open work remaining:

${bulletIncidents(facts.pending)}`;

    case "issues_unresolved":
      return `### ${label}

Blocked or SLA-pressured matters (unable to close in ${period}):

${bulletIncidents(facts.unresolvedBlocked)}
${
  facts.unresolvedBlocked.length
    ? "\nRecommend confirming resource gaps, permit constraints, or client decisions before the next reporting cycle."
    : ""
}`;

    case "meetings_arranged":
    case "meetings_conducted":
    case "meetings_attended":
      return `### ${label}

${
  facts.meetingCaptures.length
    ? `Capture records linked to meetings in this period:\n\n${facts.meetingCaptures
        .slice(0, 8)
        .map((c) => `- **${c.title}** (${c.source.replaceAll("_", " ")})`)
        .join("\n")}`
    : "No meeting minutes or attendance captures yet. Use the Capture hub to log sessions arranged, conducted, or attended."
}`;

    case "attendance_registers":
      return `### ${label}

${
  facts.evidence.filter((e) => e.kind === "attendance").length
    ? facts.evidence
        .filter((e) => e.kind === "attendance")
        .map((e) => `- ${e.label}`)
        .join("\n")
    : "- Attendance registers not yet attached — CLO / site teams should upload via Capture."
}`;

    case "meeting_minutes":
      return `### ${label}

${
  facts.evidence.filter((e) => e.kind === "minutes").length
    ? facts.evidence
        .filter((e) => e.kind === "minutes")
        .map((e) => `- ${e.label}`)
        .join("\n")
    : facts.meetingCaptures.length
      ? facts.meetingCaptures
          .map((c) => `- ${c.title}`)
          .join("\n")
      : "- No minute packs linked for this period."
}`;

    case "photo_evidence":
      return `### ${label}

Visual / site evidence stubs for ${period}:

${
  facts.evidence.filter((e) => e.kind === "photo" || e.kind === "other").length
    ? facts.evidence
        .filter((e) => e.kind === "photo" || e.kind === "other")
        .map((e) => `- ${e.label}`)
        .join("\n")
    : "- No photos attached yet (demo stub available for performance packs)."
}`;

    case "trust_sentiment":
      return `### ${label}

Trust index **${facts.trustIndex}/100** (${facts.trustLabel}) across ${facts.attended.length} scoped case${facts.attended.length === 1 ? "" : "s"}${
        facts.avgSentiment != null
          ? `, average sentiment score ${facts.avgSentiment}`
          : ""
      }. ${
        facts.trustLabel === "At risk"
          ? "Sentiment and SLA pressure warrant senior attention before the next board or funder checkpoint."
          : facts.trustLabel === "Watch"
            ? "Trend is watchful — keep weekly supervisor review on open P1/P2 matters."
            : "Trust signal is stable relative to open workload; continue routine monitoring."
      }`;

    case "tat_sla":
      return `### ${label}

SLA / turnaround pressure in ${period}: **${facts.unresolvedBlocked.filter((i) => i.slaBreached).length}** breached open case(s). Pending queue: ${proseList(facts.pending)}. Escalate resource or decision bottlenecks where stage targets are missed.`;

    case "grievance_lifecycle":
      return `### ${label}

GRM snapshot for ${scope}: attended ${facts.attended.length}; escalated ${facts.escalated.length}; resolved ${facts.resolved.length}; pending ${facts.pending.length}; blocked ${facts.unresolvedBlocked.length}. Priority cases requiring lifecycle narrative: ${proseList(facts.escalated.length ? facts.escalated : facts.attended)}.`;

    case "environmental_indicators": {
      const env = facts.attended.filter((i) =>
        /dust|noise|water|env|pollut|waste/i.test(
          `${i.nature || ""} ${i.category} ${i.title}`,
        ),
      );
      return `### ${label}

Environmental-linked cases in scope:

${bulletIncidents(env.length ? env : facts.attended.slice(0, 3))}
Controls and permit conditions should be confirmed against night-work and dust-suppression commitments.`;
    }

    case "hs_incidents": {
      const hs = facts.attended.filter((i) =>
        /safety|trench|injur|hs|barrier|hazard/i.test(
          `${i.nature || ""} ${i.category} ${i.title}`,
        ),
      );
      return `### ${label}

Health & safety related filings:

${bulletIncidents(hs.length ? hs : facts.attended.slice(0, 3))}
Confirm barriers, permits, and toolbox talks before claiming H&S closure.`;
    }

    case "esg_scorecard":
      return `### ${label}

ESG consolidation for ${period} on ${scope}: social licence (trust ${facts.trustIndex}/100 · ${facts.trustLabel}); grievance load ${facts.attended.length} cases; escalations ${facts.escalated.length}; closures ${facts.resolved.length}. Environmental and H&S narratives are drawn from matching case natures in the activity set.`;

    case "bbbee_empowerment":
      return `### ${label}

Empowerment / local participation notes for ${period}: use Capture and contractor registers to evidence local labour and supplier participation. Case desk references for community interface: ${proseList(facts.attended)}. Attach B-BBEE certificates and spend ledgers before board circulation.`;

    case "csi_spend":
      return `### ${label}

CSI / community investment narrative for ${period} should reference meeting captures (${facts.meetingCaptures.length} on file) and community-facing cases (${proseList(facts.attended)}). Quantify spend from finance packs before final submit.`;

    case "mel_indicators":
      return `### ${label}

MEL indicators inferred from desk activity: cases opened/attended ${facts.attended.length}; resolved ${facts.resolved.length}; escalation rate ${facts.attended.length ? Math.round((facts.escalated.length / facts.attended.length) * 100) : 0}%; trust index ${facts.trustIndex}. Pair with baseline indicators from the MEL plan before external reporting.`;

    case "budget_spend":
      return `### ${label}

Budget vs spend is not auto-pulled in demo mode. Flag for finance: open documentation/evidence cases (${proseList(facts.pending)}) may block progress claims. Insert authorised figures before board packs leave the desk.`;

    case "portfolio_risk":
      return `### ${label}

Portfolio risk view: ${facts.unresolvedBlocked.length} blocked/SLA-pressured case(s); ${facts.escalated.length} escalation(s); trust ${facts.trustLabel}. Highest-visibility items: ${proseList(facts.escalated.length ? facts.escalated : facts.unresolvedBlocked)}.`;

    case "board_recommendations":
      return `### ${label}

1. Clear or formally escalate blocked cases (${proseList(facts.unresolvedBlocked) || "none"}).
2. Hold a supervisor checkpoint on escalations (${proseList(facts.escalated) || "none"}).
3. Confirm evidence appendix (registers, minutes, photos) before investor or board circulation.
4. Re-measure trust pulse after the next resolution cycle (currently ${facts.trustIndex}/100).`;

    case "appendix_evidence":
      return `### ${label}

Evidence index for performance review and dispute support:

${facts.evidence.map((e) => `- [${e.kind}] ${e.label}`).join("\n") || "- No evidence stubs yet."}

Case references: ${proseList(facts.attended, 8)}.`;

    default:
      return `### ${label}

Narrative for this topic will be expanded from workspace evidence for ${period} on ${scope}.`;
  }
}

/**
 * Demo / offline composer: writes a full markdown report from picked topics + facts.
 */
export function composeActivityReportMarkdown(
  input: ComposeNarrativeInput,
): { title: string; bodyMarkdown: string; executiveHighlight: string } {
  const tone =
    input.tonePreference === "board" ||
    /board|investor|funder/i.test(input.audienceLabel)
      ? "board"
      : input.tonePreference === "formal"
        ? "formal"
        : "plain";

  const title = `${input.kindLabel} — ${input.periodLabel}`;
  const scope =
    input.projectName || input.facts.projectName || "portfolio scope";

  const intro =
    tone === "board"
      ? `## Executive highlight\n\nThis ${input.kindLabel.toLowerCase()} consolidates assurance evidence for **${input.audienceLabel}** covering **${scope}** in **${input.periodLabel}**. Trust pulse **${input.facts.trustIndex}/100 (${input.facts.trustLabel})**. Figures below are drawn from TrustLedger demo/workspace activity — verify before external circulation.\n`
      : `## Summary\n\nPrepared by **${input.authorName}** (${input.authorTierLabel}) for **${input.audienceLabel}**. Period: **${input.periodLabel}**. Scope: **${scope}**. Topics selected: ${input.includedSectionLabels.join(", ") || "none"}.\n`;

  const lockedNote = input.lockedSectionLabels.length
    ? `\n> Topics above this desk grade (shown for transparency, not drafted): ${input.lockedSectionLabels.join(", ")}.\n`
    : "";

  const sectionBodies = input.includedSectionIds.map((id, index) => {
    const label =
      input.includedSectionLabels[index] ||
      id.replaceAll("_", " ");
    return writeSection(id, label, input.facts, input);
  });

  const bodyMarkdown = [
    intro.trim(),
    lockedNote.trim(),
    "## Report body",
    ...sectionBodies,
    "",
    "_AI draft from picked topics and workspace evidence. Edit before save — suggest → apply → save._",
  ]
    .filter(Boolean)
    .join("\n\n");

  const executiveHighlight =
    tone === "board"
      ? `Board-ready draft on ${input.includedSectionIds.length} topic(s) — trust ${input.facts.trustIndex}/100. Verify numbers and attach primary evidence.`
      : `Operational draft covering ${input.includedSectionIds.length} selected topic(s) from demo/workspace data — review with your supervisor.`;

  return { title, bodyMarkdown, executiveHighlight };
}
