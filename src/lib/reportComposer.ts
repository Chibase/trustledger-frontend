/**
 * Evidence-grounded report writer.
 * Produces a finished draft from workspace/demo cases — never a how-to template.
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

/** Detect fill-in-the-blank / how-to guides from weak LLM prompts. */
export function looksLikeReportTemplateGuide(text: string): boolean {
  if (!text || text.trim().length < 40) return true;
  const probes = [
    /\[Insert\b/i,
    /\[Your Name\]/i,
    /\[Chosen Topics\]/i,
    /\[Insert Topic/i,
    /\[Insert Date\]/i,
    /\[Insert Total Sales\]/i,
    /\[Insert Percentage\]/i,
    /\[Insert Number\]/i,
    /\[Insert Process Improvement\]/i,
    /\[Insert Outcome\]/i,
    /\[Insert Method\]/i,
    /\[List Products\]/i,
    /\[List key goals/i,
    /\[Highlight any team/i,
    /\[Describe any significant challenges/i,
    /\[Briefly outline any expected challenges/i,
    /\[Include any additional data/i,
    /\[Month\/Year\]/i,
    /\[Month\b/i,
    /Feel free to customize/i,
    /customize the placeholders/i,
    /Adjust the content as necessary/i,
    /Provide a brief overview/i,
    /Outline the importance of this topic/i,
    /Describe the relevance of this topic/i,
    /Include graphs or charts if applicable/i,
    /End of Report/i,
    /Prepared by:\s*\[/i,
    /Department:\s*\[/i,
    /Finding 1:\s*\[Insert/i,
    /Recommendation 1:\s*\[Insert/i,
    /Topics Analyzed:\s*List the specific topics/i,
    /Data Sources:\s*Briefly describe/i,
    /we will structure the report/i,
    /This structure will ensure that the report/i,
    /This structure can be tailored/i,
    /To create a comprehensive monthly report/i,
    /comprehensive monthly report/i,
    /Monthly Report:\s*\[Month/i,
    /Topic 1:\s*\[Insert Topic Name\]/i,
    /Key achievements and milestones reached/i,
    /Additional resources or references for further reading/i,
    /Highlight the most significant trends/i,
    /Offer strategic recommendations for future actions/i,
    /This month has been marked by significant developments/i,
    /enhancing operational efficiency, improving customer engagement/i,
    /Top Selling Products/i,
    /Customer Retention Rate/i,
  ];
  let hits = 0;
  for (const re of probes) {
    if (re.test(text)) hits += 1;
  }
  // One strong hit is enough for obvious template markers
  if (
    /\[Month\/Year\]|\[Insert\b|Feel free to customize|customize the placeholders|we will structure the report|This structure can be tailored|comprehensive monthly report|End of Report/i.test(
      text,
    )
  ) {
    return true;
  }
  return hits >= 2;
}

function findingLines(rows: Incident[], limit = 5): string {
  if (!rows.length) {
    return "- No cases in this category for the selected scope and period.";
  }
  return rows
    .slice(0, limit)
    .map((i) => {
      const detail = (i.description || "").replace(/\s+/g, " ").trim();
      const snippet =
        detail.length > 160 ? `${detail.slice(0, 157)}…` : detail;
      return `- **${i.id} — ${i.title}** (${i.priority}, ${i.status}${i.ward ? `, ${i.ward}` : ""}; owner ${i.ownerName}).${snippet ? ` ${snippet}` : ""}`;
    })
    .join("\n");
}

function shortList(rows: Incident[], limit = 4): string {
  if (!rows.length) return "none";
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
      label: "Site walkabout photo set — clinic corridor (demo stub)",
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
  const top = facts.attended[0];
  const topLine = top
    ? `${top.id} (${top.title}) remains the highest-visibility matter`
    : "No single lead case dominates the period";

  switch (id) {
    case "period_summary":
      return `## 1. ${label}

During **${period}**, the desk recorded **${facts.attended.length}** active case${facts.attended.length === 1 ? "" : "s"} on **${scope}**, of which **${facts.escalated.length}** were escalated and **${facts.resolved.length}** closed. The trust pulse closed the period at **${facts.trustIndex}/100 (${facts.trustLabel})**${facts.avgSentiment != null ? ` with average community sentiment ${facts.avgSentiment}` : ""}. ${topLine}. This pack is prepared by **${meta.authorName}** (${meta.authorTierLabel}) for **${meta.audienceLabel}**.`;

    case "activity_log":
      return `## ${label}

Field and desk actions in ${period} are summarised below from case timelines and Capture records:

${findingLines(facts.attended)}
${
  facts.meetingCaptures.length
    ? `\nRelated meeting / capture records: ${facts.meetingCaptures
        .slice(0, 5)
        .map((c) => c.title)
        .join("; ")}.`
    : ""
}`;

    case "issues_attended":
      return `## ${label}

Cases attended on ${scope} in ${period}:

${findingLines(facts.attended)}`;

    case "issues_escalated":
      return `## ${label}

${
  facts.escalated.length
    ? `Senior intervention was required on the following matters:\n\n${findingLines(facts.escalated)}`
    : "No formal escalations were logged in the selected scope for this period."
}`;

    case "issues_resolved":
      return `## ${label}

${
  facts.resolved.length
    ? `Closed outcomes in ${period}:\n\n${findingLines(facts.resolved)}`
    : `No cases reached Closed status in ${period}. Pending and blocked items are covered in the sections below.`
}`;

    case "issues_pending":
      return `## ${label}

Work still open at period end:

${findingLines(facts.pending)}`;

    case "issues_unresolved":
      return `## ${label}

Blocked or SLA-breached matters that could not be closed in ${period}:

${findingLines(facts.unresolvedBlocked)}
${
  facts.unresolvedBlocked.length
    ? `\nImmediate focus: resource cover, permit clearance, or client decision on ${shortList(facts.unresolvedBlocked, 2)}.`
    : ""
}`;

    case "meetings_arranged":
    case "meetings_conducted":
    case "meetings_attended":
      return `## ${label}

${
  facts.meetingCaptures.length
    ? `Meetings and related captures recorded for ${period}:\n\n${facts.meetingCaptures
        .slice(0, 8)
        .map((c) => `- **${c.title}** (${c.source.replaceAll("_", " ")})`)
        .join("\n")}`
    : `No meeting minutes or attendance packs were logged for ${period}. Community interface for the period is reflected through case engagements (${shortList(facts.attended, 3)}).`
}`;

    case "attendance_registers":
      return `## ${label}

${
  facts.evidence.filter((e) => e.kind === "attendance").length
    ? facts.evidence
        .filter((e) => e.kind === "attendance")
        .map((e) => `- ${e.label}`)
        .join("\n")
    : `- Attendance for community sessions linked to ${shortList(facts.attended, 2)} is pending formal register upload; case desks retain interim sign-in notes.`
}`;

    case "meeting_minutes":
      return `## ${label}

${
  facts.evidence.filter((e) => e.kind === "minutes").length
    ? facts.evidence
        .filter((e) => e.kind === "minutes")
        .map((e) => `- ${e.label}`)
        .join("\n")
    : facts.meetingCaptures.length
      ? facts.meetingCaptures.map((c) => `- ${c.title}`).join("\n")
      : `- Minutes for engagements on ${scope} in ${period} are not yet filed; key discussion points are captured in case notes for ${shortList(facts.attended, 3)}.`
}`;

    case "photo_evidence":
      return `## ${label}

Site and visual evidence on file for ${period}:

${
  facts.evidence
    .filter((e) => e.kind === "photo" || e.kind === "other")
    .map((e) => `- ${e.label}`)
    .join("\n") || `- Visual evidence pending for ${shortList(facts.attended, 2)}.`
}`;

    case "trust_sentiment":
      return `## ${label}

Trust index for ${scope} stands at **${facts.trustIndex}/100 (${facts.trustLabel})** across ${facts.attended.length} sentiment-relevant case${facts.attended.length === 1 ? "" : "s"}${
        facts.avgSentiment != null
          ? ` (average sentiment score ${facts.avgSentiment})`
          : ""
      }. ${
        facts.trustLabel === "At risk"
          ? `Community confidence is under pressure, driven primarily by ${shortList(facts.unresolvedBlocked.length ? facts.unresolvedBlocked : facts.escalated, 2)}.`
          : facts.trustLabel === "Watch"
            ? `Sentiment is watchful; weekly supervisor review should stay on ${shortList(facts.pending.length ? facts.pending : facts.attended, 2)}.`
            : `Sentiment remains relatively stable against current open workload.`
      }`;

    case "tat_sla": {
      const breached = facts.unresolvedBlocked.filter((i) => i.slaBreached);
      return `## ${label}

**${breached.length}** open case${breached.length === 1 ? "" : "s"} breached SLA targets in ${period}. Pending queue: ${shortList(facts.pending)}. Breach set: ${shortList(breached)}. Stage turnaround on escalated work (${shortList(facts.escalated, 2)}) is the binding constraint for the next cycle.`;
    }

    case "grievance_lifecycle":
      return `## ${label}

GRM lifecycle for ${scope} in ${period}: **${facts.attended.length}** attended · **${facts.escalated.length}** escalated · **${facts.resolved.length}** resolved · **${facts.pending.length}** pending · **${facts.unresolvedBlocked.length}** blocked. Priority pathway items: ${shortList(facts.escalated.length ? facts.escalated : facts.attended)}.`;

    case "environmental_indicators": {
      const env = facts.attended.filter((i) =>
        /dust|noise|water|env|pollut|waste/i.test(
          `${i.nature || ""} ${i.category} ${i.title}`,
        ),
      );
      const rows = env.length ? env : facts.attended.slice(0, 3);
      return `## ${label}

Environmental interface cases in ${period}:

${findingLines(rows)}
Dust suppression, night-work windows, and water disruption controls remain the primary environmental controls under watch.`;
    }

    case "hs_incidents": {
      const hs = facts.attended.filter((i) =>
        /safety|trench|injur|hs|barrier|hazard/i.test(
          `${i.nature || ""} ${i.category} ${i.title}`,
        ),
      );
      const rows = hs.length ? hs : facts.attended.slice(0, 3);
      return `## ${label}

Health and safety related filings in ${period}:

${findingLines(rows)}
Barrier integrity and open-excavation controls are the standing H&S priorities until the pending set is closed.`;
    }

    case "esg_scorecard":
      return `## ${label}

ESG position for ${period} on ${scope}:
- **Social licence:** trust ${facts.trustIndex}/100 (${facts.trustLabel})
- **Grievance load:** ${facts.attended.length} cases · ${facts.escalated.length} escalations · ${facts.resolved.length} closures
- **Lead social risks:** ${shortList(facts.escalated.length ? facts.escalated : facts.attended)}
Environmental and H&S narratives follow the matching case natures in this pack.`;

    case "bbbee_empowerment":
      return `## ${label}

Local participation and empowerment interface for ${period} is evidenced through community-facing cases (${shortList(facts.attended)}) and Capture records (${facts.meetingCaptures.length} on file). Formal B-BBEE certificates and supplier spend ledgers remain with finance for the audited annexure.`;

    case "csi_spend":
      return `## ${label}

CSI and community investment activity in ${period} is reflected in ${facts.meetingCaptures.length} meeting/capture record${facts.meetingCaptures.length === 1 ? "" : "s"} and community cases (${shortList(facts.attended)}). Programme spend figures are held in the finance annex for this audience.`;

    case "mel_indicators": {
      const escRate = facts.attended.length
        ? Math.round((facts.escalated.length / facts.attended.length) * 100)
        : 0;
      return `## ${label}

MEL snapshot for ${period}:
- Cases attended: **${facts.attended.length}**
- Resolved: **${facts.resolved.length}**
- Escalation rate: **${escRate}%**
- Trust index: **${facts.trustIndex}/100 (${facts.trustLabel})**
- Blocked / SLA pressure: **${facts.unresolvedBlocked.length}**`;
    }

    case "budget_spend":
      return `## ${label}

Progress-claim and evidence documentation risk is concentrated on ${shortList(facts.pending.length ? facts.pending : facts.attended, 3)}. Authorised budget and spend figures for ${period} are to be pasted from the finance pack into this section before board circulation; operational blockers above are already desk-verified.`;

    case "portfolio_risk":
      return `## ${label}

Portfolio risk for ${scope} in ${period}: **${facts.unresolvedBlocked.length}** blocked/SLA-pressured case${facts.unresolvedBlocked.length === 1 ? "" : "s"}, **${facts.escalated.length}** escalation${facts.escalated.length === 1 ? "" : "s"}, trust **${facts.trustLabel}**. Highest-visibility items: ${shortList(facts.escalated.length ? facts.escalated : facts.unresolvedBlocked)}.`;

    case "board_recommendations":
      return `## ${label}

1. Clear or formally decision-gate blocked cases: ${shortList(facts.unresolvedBlocked) || "none open"}.
2. Hold a supervisor checkpoint on escalations: ${shortList(facts.escalated) || "none open"}.
3. Confirm the evidence appendix (registers, minutes, photos) before investor or board circulation.
4. Re-measure trust after the next resolution cycle (currently **${facts.trustIndex}/100**).`;

    case "appendix_evidence":
      return `## Appendix — ${label}

| Ref | Type | Description |
| --- | --- | --- |
${facts.evidence.map((e) => `| ${e.id} | ${e.kind} | ${e.label} |`).join("\n") || "| — | — | No evidence stubs |"}

Case index: ${shortList(facts.attended, 8)}.`;

    default:
      return `## ${label}

Period activity on ${scope} for ${period} is summarised through cases ${shortList(facts.attended)}.`;
  }
}

/**
 * Write a finished markdown report from picked topics + evidence facts.
 * Never returns instructional placeholders.
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
  const today = new Date().toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const header = `# ${title}

**Date:** ${today}  
**Prepared by:** ${input.authorName} (${input.authorTierLabel})  
**Audience:** ${input.audienceLabel}  
**Scope:** ${scope}  
**Topics covered:** ${input.includedSectionLabels.join("; ") || "—"}
`;

  const highlight =
    tone === "board"
      ? `## Executive highlight

Assurance position for **${scope}** in **${input.periodLabel}**: trust **${input.facts.trustIndex}/100 (${input.facts.trustLabel})**; **${input.facts.attended.length}** cases attended; **${input.facts.escalated.length}** escalations; **${input.facts.unresolvedBlocked.length}** blocked/SLA-pressured. Lead items: ${shortList(input.facts.escalated.length ? input.facts.escalated : input.facts.attended)}.
`
      : `## Summary

This ${input.kindLabel.toLowerCase()} covers **${input.includedSectionLabels.length}** selected topic${input.includedSectionLabels.length === 1 ? "" : "s"} for **${input.periodLabel}** on **${scope}**. Trust pulse: **${input.facts.trustIndex}/100 (${input.facts.trustLabel})**. Lead case set: ${shortList(input.facts.attended)}.
`;

  const lockedNote = input.lockedSectionLabels.length
    ? `_Topics above this desk grade were not drafted: ${input.lockedSectionLabels.join(", ")}_\n`
    : "";

  const sectionBodies = input.includedSectionIds.map((id, index) => {
    const label =
      input.includedSectionLabels[index] || id.replaceAll("_", " ");
    return writeSection(id, label, input.facts, input);
  });

  const closing = `## Closing

The findings above are drawn from TrustLedger workspace evidence for ${input.periodLabel}. Human review is required before external circulation; figures and annexures should be confirmed by the responsible desk.
`;

  const bodyMarkdown = [
    header.trim(),
    highlight.trim(),
    lockedNote.trim(),
    ...sectionBodies,
    closing.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");

  const executiveHighlight =
    tone === "board"
      ? `Finished board draft on ${input.includedSectionIds.length} topic(s) from live workspace evidence — trust ${input.facts.trustIndex}/100.`
      : `Finished operational draft covering ${input.includedSectionIds.length} topic(s) with case-level findings from demo/workspace data.`;

  return { title, bodyMarkdown, executiveHighlight };
}
