/**
 * MEL-4 — local Learn & Adapt retrospective.
 * Three locked sections from workspace evidence. Suggest → human apply → save.
 * Never calls Frappe/Grok. Shortfalls and tags are watches, not causes (TE-12).
 */

import { parseGrievanceRootCause, rootCauseLabel } from "@/lib/grievanceRootCause";
import {
  collectMelOnTrack,
  collectMelShortfalls,
  formatMelNumber,
} from "@/lib/melIndicators";
import {
  collectDoneAdaptRecords,
  collectOpenAdaptRecords,
} from "@/lib/melLearnAdapt";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

export const MEL_RETROSPECTIVE_HEADINGS = [
  "What worked",
  "What did not",
  "What we will change",
] as const;

export type MelRetrospectiveFacts = {
  attended: Incident[];
  escalated: Incident[];
  resolved: Incident[];
  pending: Incident[];
  unresolvedBlocked: Incident[];
  scopeIncidents?: Incident[];
  projects?: Project[];
  trustIndex: number;
  trustLabel: string;
  projectName?: string;
};

export type MelRetrospectiveInput = {
  kindLabel: string;
  audienceLabel: string;
  periodLabel: string;
  authorTierLabel: string;
  authorName: string;
  projectName?: string;
  facts: MelRetrospectiveFacts;
};

function incidentsFromFacts(facts: MelRetrospectiveFacts): Incident[] {
  if (facts.scopeIncidents && facts.scopeIncidents.length > 0) {
    return facts.scopeIncidents;
  }
  const seen = new Set<string>();
  const out: Incident[] = [];
  for (const row of [
    ...facts.unresolvedBlocked,
    ...facts.escalated,
    ...facts.pending,
    ...facts.attended,
    ...facts.resolved,
  ]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

function bullet(lines: string[]): string {
  if (!lines.length) return "";
  return lines.map((line) => `- ${line}`).join("\n");
}

function citeCases(incidents: Incident[], limit = 8): string {
  return incidents
    .slice(0, limit)
    .map((row) => `**${row.id}**`)
    .join(", ");
}

/**
 * Finished markdown with the three locked headings.
 * Does not mutate cases. Does not invent Adapt actions.
 */
export function composeMelRetrospectiveMarkdown(
  input: MelRetrospectiveInput,
): { title: string; bodyMarkdown: string; executiveHighlight: string } {
  const title = `${input.kindLabel} — ${input.periodLabel}`;
  const scope =
    input.projectName || input.facts.projectName || "portfolio scope";
  const today = new Date().toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const incidents = incidentsFromFacts(input.facts);
  const projects = input.facts.projects || [];
  const onTrack = collectMelOnTrack({ projects });
  const shortfalls = collectMelShortfalls({ projects });
  const closed = incidents.filter((row) => row.status === "Closed");
  const openTagged = incidents.filter(
    (row) => row.status !== "Closed" && Boolean(row.rootCause),
  );
  const doneAdapt = collectDoneAdaptRecords(incidents);
  const openAdapt = collectOpenAdaptRecords(incidents);
  const attendedIds = input.facts.attended.map((row) => row.id).filter(Boolean);

  const worked: string[] = [];
  for (const row of onTrack) {
    const where = row.projectName ? ` on ${row.projectName}` : "";
    worked.push(
      `Expected vs actual met: **${row.label}**${where} — ${formatMelNumber(row.actual, row.unit)} against ${formatMelNumber(row.expected, row.unit)}.`,
    );
  }
  if (closed.length) {
    worked.push(
      `Closed cases: ${citeCases(closed)}${closed.length > 8 ? "…" : ""}.`,
    );
  }
  for (const row of doneAdapt) {
    const action = row.action.trim() || "Adapt action recorded";
    worked.push(
      `Learn & Adapt record done on **${row.incidentId}** (${row.incidentTitle}): ${action}`,
    );
  }
  if (!worked.length) {
    worked.push(
      "Nothing on file yet that met expected vs actual, closed a case, or completed a Learn & Adapt record. This draft does not invent a success.",
    );
  }

  const didNot: string[] = [];
  for (const row of shortfalls) {
    const where = row.projectName ? ` on ${row.projectName}` : "";
    const material = row.material ? " Material shortfall." : "";
    didNot.push(
      `Expected vs actual shortfall${where}: **${row.label}** — ${formatMelNumber(row.actual)} against ${formatMelNumber(row.expected)}.${material} This is a watch, not a named cause.`,
    );
  }
  for (const row of openTagged) {
    const tag = rootCauseLabel(parseGrievanceRootCause(row.rootCause));
    didNot.push(
      `Open tagged case **${row.id}** (${row.title})${tag ? ` — ${tag}` : ""}. The tag is an operational watch, not a trust-movement cause.`,
    );
  }
  for (const row of openAdapt) {
    const due = row.dueOn ? ` Due ${row.dueOn}.` : "";
    const overdue = row.overdue ? " Overdue." : "";
    didNot.push(
      `Open Learn & Adapt on **${row.incidentId}** (${row.incidentTitle}): ${row.monitor.trim() || "Monitor on file"}.${due}${overdue}`,
    );
  }
  if (!didNot.length) {
    didNot.push(
      "No expected-vs-actual shortfalls, open tagged cases, or open Learn & Adapt records are on file for this scope.",
    );
  }

  const change: string[] = [];
  for (const row of openAdapt) {
    const action = row.action.trim();
    if (!action) {
      change.push(
        `**${row.incidentId}** has an open Learn & Adapt record without an Adapt action yet. This draft does not invent one.`,
      );
      continue;
    }
    const due = row.dueOn ? ` (due ${row.dueOn})` : "";
    change.push(`**${row.incidentId}**${due}: ${action}`);
  }
  if (!change.length) {
    change.push(
      "No Adapt actions are on file. This draft does not invent a change.",
    );
  }

  const citationLine =
    incidents.length > 0
      ? `Cases on file include ${citeCases(incidents)}${incidents.length > 8 ? "…" : ""}.`
      : "No cases are on file for this scope.";
  const mustCite =
    attendedIds.length > 0
      ? ` Lead cases: ${attendedIds
          .slice(0, 8)
          .map((id) => `**${id}**`)
          .join(", ")}.`
      : "";

  const bodyMarkdown = `# ${title}

**Date:** ${today}  
**Prepared by:** ${input.authorName} (${input.authorTierLabel})  
**Audience:** ${input.audienceLabel}  
**Scope:** ${scope}  

## Summary

Learn & Adapt retrospective for **${input.periodLabel}** on **${scope}**. Trust pulse: **${input.facts.trustIndex}/100 (${input.facts.trustLabel})**. ${citationLine}${mustCite} This is a suggestion from workspace evidence — review, apply, then save. Completing or saving this draft does not close or advance a grievance.

## ${MEL_RETROSPECTIVE_HEADINGS[0]}

${bullet(worked)}

## ${MEL_RETROSPECTIVE_HEADINGS[1]}

${bullet(didNot)}

## ${MEL_RETROSPECTIVE_HEADINGS[2]}

${bullet(change)}

## Closing

Human review is required before circulation. Expected vs actual gaps and root-cause tags remain watches. This pack does not call a remote model and does not write case stages.
`.trim();

  return {
    title,
    bodyMarkdown,
    executiveHighlight: `Learn & Adapt retrospective: ${onTrack.length} on-track indicator(s), ${shortfalls.length} shortfall watch(es), ${openAdapt.length} open Adapt action(s).`,
  };
}
