/**
 * Evidence-grounded report writer.
 * Produces a finished draft from workspace/demo cases — never a how-to template.
 */

import {
  aggregatePackFacts,
  collectIssueLogEntries,
  formatIssueLogEntries,
  listCaptureRecords,
  type AggregatedPackFacts,
} from "@/lib/captureStore";
import {
  formatIntelValue,
  partitionLocalIntel,
  sumImpactZar,
} from "@/lib/parseLocalCommunityIntel";
import { trustIndexFromIncidents } from "@/lib/grievanceProcess";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import type {
  EvidenceStubRef,
  ReportKind,
  ReportSectionId,
} from "@/types/activityReport";
import {
  buildExecutiveRiskRows,
  buildFunderSnapshot,
  reportLensForKind,
  type ExecutiveRiskRow,
  type FunderSnapshot,
  type ReportLens,
} from "@/lib/reportLenses";
import type { Incident } from "@/types/incident";
import type { Project, ProjectDossier } from "@/types/project";

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
  packs: AggregatedPackFacts;
  dossier?: ProjectDossier;
};

export function emptyAggregatedPackFacts(): AggregatedPackFacts {
  return {
    projectProfiles: [],
    bbbee: [],
    employment: [],
    csi: [],
    esg: [],
    grm: [],
    issueLogs: [],
    budget: [],
  };
}

/** True when dossier / capture packs / meetings can ground a report without cases. */
export function periodFactsHaveWritableEvidence(
  facts: PeriodActivityFacts | null | undefined,
): boolean {
  if (!facts) return false;
  if (facts.attended.length > 0) return true;
  if (facts.meetingCaptures.length > 0) return true;
  const p = facts.packs;
  if (
    p.projectProfiles.length ||
    p.bbbee.length ||
    p.employment.length ||
    p.csi.length ||
    p.esg.length ||
    p.grm.length ||
    p.issueLogs.length ||
    p.budget.length
  ) {
    return true;
  }
  const d = facts.dossier;
  if (!d) return false;
  return Boolean(
    d.funder?.name ||
      d.geo?.wardName ||
      d.geo?.municipalityName ||
      d.geo?.placeId ||
      d.sector ||
      d.siteDescription ||
      d.budget?.authorisedZar ||
      d.empowermentTargets?.localHireTarget != null ||
      d.empowermentTargets?.empowermentBudgetZar != null ||
      d.empowermentTargets?.bbbeeLevelTarget ||
      (d.promises && d.promises.length > 0) ||
      d.communityIntel?.unemploymentRatePct != null ||
      (d.communityIntel?.attachedIndicators?.length ?? 0) > 0,
  );
}

export type ComposeNarrativeInput = {
  kind?: ReportKind;
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

function incidentsFromFacts(facts: PeriodActivityFacts): Incident[] {
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

export function riskRowsFromFacts(facts: PeriodActivityFacts): ExecutiveRiskRow[] {
  return buildExecutiveRiskRows(incidentsFromFacts(facts), {
    promises: facts.dossier?.promises,
  });
}

export function funderSnapshotFromFacts(
  facts: PeriodActivityFacts,
): FunderSnapshot {
  return buildFunderSnapshot(incidentsFromFacts(facts), {
    trustIndex: facts.trustIndex,
    trustLabel: facts.trustLabel,
  });
}

function inferReportLens(input: ComposeNarrativeInput): ReportLens {
  if (input.kind) return reportLensForKind(input.kind);
  if (/executive risk/i.test(input.kindLabel)) return "executive";
  if (
    /board|investor|funder/i.test(input.kindLabel) ||
    input.tonePreference === "board"
  ) {
    return "funder";
  }
  return "monthly";
}

/** True when the draft names at least one of the workspace case ids (INC-1001, INC-NCGR-01, …). */
export function bodyCitesAnyCaseId(body: string, caseIds: string[]): boolean {
  if (!caseIds.length) return true;
  const text = body || "";
  return caseIds.some((id) => {
    const token = id.trim();
    return token.length > 0 && text.includes(token);
  });
}

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
  options?: {
    projectId?: string;
    projectName?: string;
    project?: Project;
  },
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
  const allCaptures = listCaptureRecords().filter((c) => {
    if (options?.projectId && c.projectId && c.projectId !== options.projectId) {
      return false;
    }
    return true;
  });
  const meetingCaptures = allCaptures.filter(
    (c) =>
      c.source === "minutes" ||
      c.source === "attendance" ||
      c.source === "pasted_report" ||
      c.source === "social_intel",
  );
  const packs = aggregatePackFacts(allCaptures, options?.projectId);
  const dossier = options?.project?.dossier;

  // Dossier baselines fill empty period packs so reports do not re-ask for programme facts.
  if (dossier) {
    if (!packs.projectProfiles.length) {
      packs.projectProfiles.push({
        periodLabel: undefined,
        clientFunder: dossier.funder?.name,
        ward: dossier.geo?.wardName,
        municipality: dossier.geo?.municipalityName,
        startDate: dossier.dates?.startDate,
        targetEndDate: dossier.dates?.targetEndDate,
        budgetTotal: dossier.budget?.authorisedZar,
        publicSummary: dossier.siteDescription,
        sector: dossier.sector,
        siteDescription: dossier.siteDescription,
      });
    }
    if (!packs.bbbee.length && dossier.empowermentTargets) {
      const local = dossier.communityIntel?.localIndicators || [];
      const pref =
        local.find((r) => r.key === "preferential_procurement_zar")?.value ??
        local.find((r) => r.key === "local_procurement_zar")?.value ??
        dossier.empowermentTargets.preferentialProcurementTargetZar;
      const skills =
        local.find((r) => r.key === "skills_dev_zar")?.value ??
        local.find((r) => r.key === "training_spend_zar")?.value ??
        dossier.empowermentTargets.skillsDevTargetZar;
      packs.bbbee.push({
        bbbeeLevel: dossier.empowermentTargets.bbbeeLevelTarget,
        blackOwnershipPct: dossier.empowermentTargets.blackOwnershipTargetPct,
        preferentialProcurementZar: pref,
        skillsDevSpendZar: skills,
        notes: [
          dossier.empowermentTargets.womenYouthPwdTargets,
          local.length
            ? "Preferential / skills figures include local project impact intel where captured."
            : null,
        ]
          .filter(Boolean)
          .join(" "),
      });
    }
    {
      const local = dossier.communityIntel?.localIndicators || [];
      const hire =
        local.find((r) => r.key === "local_hire_pct")?.value ??
        dossier.empowermentTargets?.localHireTarget;
      const intake = local.find((r) => r.key === "labour_intake_count")?.value;
      const jobs = local.find((r) => r.key === "jobs_created_fte")?.value;
      const trained = local.find(
        (r) => r.key === "training_beneficiaries",
      )?.value;
      if (!packs.employment.length && (hire != null || intake != null || jobs != null)) {
        packs.employment.push({
          localHireTarget:
            dossier.empowermentTargets?.localHireTarget ?? hire,
          localHireActual: hire,
          totalWorkforce: intake ?? jobs,
          womenEmployed: local.find((r) => r.key === "women_employed_count")
            ?.value,
          youthEmployed: local.find((r) => r.key === "youth_employed_count")
            ?.value,
          trainingSpendZar:
            local.find((r) => r.key === "training_spend_zar")?.value ??
            local.find((r) => r.key === "skills_dev_zar")?.value,
          wardOfOriginNotes: dossier.geo?.wardName,
          notes: [
            intake != null ? `Labour intake ${intake}` : null,
            jobs != null ? `Jobs created (FTE) ${jobs}` : null,
            trained != null ? `People trained ${trained}` : null,
            "From local project impact intel (LED/ESG/M&E).",
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }
    }
    if (!packs.budget.length) {
      const empBudget = dossier.empowermentTargets?.empowermentBudgetZar;
      const authorised = dossier.budget?.authorisedZar;
      const impactZar = sumImpactZar(
        dossier.communityIntel?.localIndicators || [],
      );
      const spent =
        dossier.empowermentTargets?.empowermentSpentZar ??
        (impactZar > 0 ? impactZar : undefined);
      if (empBudget != null || authorised != null || spent != null) {
        packs.budget.push({
          budgetTotalZar: empBudget ?? authorised,
          spendToDateZar: spent,
          contingencyZar: dossier.budget?.contingencyZar,
        });
      }
    }
    if (
      !packs.esg.length &&
      (dossier.communityIntel?.unemploymentRatePct != null ||
        dossier.communityIntel?.structuresNotes ||
        (dossier.communityIntel?.attachedIndicators?.length ?? 0) > 0 ||
        (dossier.communityIntel?.localIndicators?.length ?? 0) > 0)
    ) {
      const attached =
        dossier.communityIntel?.attachedIndicators
          ?.map(
            (r) =>
              `${r.label} ${r.value}${r.unit === "%" ? "%" : ` ${r.unit}`}`,
          )
          .join("; ") || null;
      const localRows = dossier.communityIntel?.localIndicators || [];
      const { baselineCompare, projectImpact } = partitionLocalIntel(localRows);
      const baselineLocal =
        baselineCompare
          .map((r) => `${r.label} ${formatIntelValue(r)}`)
          .join("; ") || null;
      const impactLocal =
        projectImpact
          .map((r) => `${r.label} ${formatIntelValue(r)}`)
          .join("; ") || null;
      const zar = sumImpactZar(localRows);
      packs.esg.push({
        communityTrustNotes: [
          dossier.communityIntel?.unemploymentRatePct != null
            ? `Area unemployment ${dossier.communityIntel.unemploymentRatePct}%`
            : null,
          attached
            ? `Platform baseline${dossier.communityIntel?.baselinePlaceId ? ` (${dossier.communityIntel.baselinePlaceId})` : ""}: ${attached}`
            : null,
          baselineLocal
            ? `Local survey (vs baseline): ${baselineLocal}`
            : null,
          impactLocal
            ? `Project impact LED/ESG/M&E${zar > 0 ? ` (R${zar.toLocaleString("en-ZA")} ZAR logged)` : ""}: ${impactLocal}`
            : null,
          dossier.communityIntel?.structuresNotes
            ? `Structures: ${dossier.communityIntel.structuresNotes}`
            : null,
          dossier.communityIntel?.localBusinessesNotes
            ? `Businesses: ${dossier.communityIntel.localBusinessesNotes}`
            : null,
          "Funder track: local project evidence sits beside municipal/provincial Stats SA for upward reporting.",
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
  }

  const evidence: EvidenceStubRef[] = meetingCaptures.slice(0, 12).map((c) => ({
    id: `ev-${c.id}`,
    kind:
      c.source === "attendance"
        ? "attendance"
        : c.source === "minutes"
          ? "minutes"
          : "other",
    label: c.title || c.source,
    linkedCaptureId: c.id,
  }));

  let issueLogEvidenceDone = false;
  for (const row of allCaptures.filter((c) => Boolean(c.structured)).slice(0, 8)) {
    if (row.structured?.pack === "issue_log") {
      // Captures are newest-first — only the latest Issue log pack is evidence SoT.
      if (issueLogEvidenceDone) continue;
      issueLogEvidenceDone = true;
      if (
        (row.structured.data.entries || []).some((e) => e.title?.trim())
      ) {
        const entries = (row.structured.data.entries || []).filter((e) =>
          e.title?.trim(),
        );
        evidence.push({
          id: `ev-${row.id}`,
          kind: "other",
          label: `Issue log pathway ×${entries.length} — ${entries
            .slice(0, 3)
            .map((e) => e.title)
            .join("; ")}${entries.length > 3 ? "…" : ""}`,
          linkedCaptureId: row.id,
        });
        for (const entry of entries.slice(0, 6)) {
          evidence.push({
            id: `ev-${row.id}-${entry.id}`,
            kind: "other",
            label: `Pathway: ${entry.title}${entry.closedAt ? " (closed)" : entry.resolvedAt ? " (resolved)" : entry.escalatedAt || entry.escalatedTo ? " (escalated)" : " (open)"}`,
            linkedCaptureId: row.id,
          });
        }
        continue;
      }
    }
    evidence.push({
      id: `ev-${row.id}`,
      kind: "other",
      label: row.title || row.source,
      linkedCaptureId: row.id,
    });
  }

  if (evidence.length < 2 && !isCustomerWorkspaceClient()) {
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
  } else if (evidence.length === 0 && options?.project) {
    evidence.push({
      id: `ev-project-${options.project.id}`,
      kind: "other",
      label: `Project dossier — ${options.project.name}`,
    });
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
    meetingCaptures,
    evidence,
    trustIndex: trust.trustIndex,
    trustLabel: trust.label,
    avgSentiment: trust.avgSentiment,
    projectName:
      options?.projectName ||
      options?.project?.name ||
      scoped[0]?.projectName,
    packs,
    dossier,
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
    `Pack captures — B-BBEE:${facts.packs.bbbee.length} Employment:${facts.packs.employment.length} CSI:${facts.packs.csi.length} ESG:${facts.packs.esg.length} GRM:${facts.packs.grm.length} Issue log:${facts.packs.issueLogs.length} Budget:${facts.packs.budget.length} Profile:${facts.packs.projectProfiles.length}`,
    facts.dossier
      ? `Project dossier — funder:${facts.dossier.funder?.name || "—"} ward:${facts.dossier.geo?.wardName || "—"} hire target:${facts.dossier.empowermentTargets?.localHireTarget ?? "—"} promises:${facts.dossier.promises?.length ?? 0}`
      : "Project dossier: none",
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

    case "grievance_lifecycle": {
      const grm = facts.packs.grm[0];
      const issueLog = facts.packs.issueLogs[0];
      const pathways = collectIssueLogEntries(facts.packs.issueLogs);
      const base = `## ${label}

GRM lifecycle for ${scope} in ${period}: **${facts.attended.length}** attended · **${facts.escalated.length}** escalated · **${facts.resolved.length}** resolved · **${facts.pending.length}** pending · **${facts.unresolvedBlocked.length}** blocked. Priority pathway items: ${shortList(facts.escalated.length ? facts.escalated : facts.attended)}.`;
      if (!grm && !issueLog && !pathways.length) return base;
      return `${base}

${
  grm
    ? `Period GRM pack:
- Opened / closed / escalated: ${grm.casesOpened ?? "—"} / ${grm.casesClosed ?? "—"} / ${grm.casesEscalated ?? "—"}
- Average days to close: ${grm.avgDaysToClose ?? "—"}
${grm.topThemes ? `- Themes: ${grm.topThemes}` : ""}
${grm.communityFeedback ? `- Community feedback: ${grm.communityFeedback}` : ""}
${grm.processImprovements ? `- Process improvements: ${grm.processImprovements}` : ""}`
    : ""
}
${
  issueLog
    ? `Issue log pack:
- Logged / open / closed / escalated: ${issueLog.casesLogged ?? "—"} / ${issueLog.casesOpen ?? "—"} / ${issueLog.casesClosed ?? "—"} / ${issueLog.casesEscalated ?? "—"}
${issueLog.topThemes ? `- Themes: ${issueLog.topThemes}` : ""}
${issueLog.openCaseRefs ? `- Open refs: ${issueLog.openCaseRefs}` : ""}
${issueLog.deskNotes ? `- Desk notes: ${issueLog.deskNotes}` : ""}`
    : ""
}
${
  pathways.length
    ? `\nSequenced pathways (report → close):\n\n${formatIssueLogEntries(pathways).join("\n\n")}`
    : ""
}`;
    }

    case "issue_log_pathway": {
      const pathways = collectIssueLogEntries(facts.packs.issueLogs);
      const issueLog = facts.packs.issueLogs[0];
      if (!pathways.length) {
        return `## ${label}

No sequenced issue pathways were captured for **${scope}** in **${period}**. Under Capture → **Issue log**, record each matter in order: title → category → person reporting → date/time reported → follow-ups (action, outcomes, date/time; add steps as needed) → escalated (to whom, date/time) → feedback → resolved → closed. Saved pathways appear here and in the evidence appendix.`;
      }
      return `## ${label}

Clear pathway from report through close for **${scope}** in **${period}** (${pathways.length} issue${pathways.length === 1 ? "" : "s"}):
${
  issueLog
    ? `\nRollup: logged ${issueLog.casesLogged ?? pathways.length} · open ${issueLog.casesOpen ?? "—"} · closed ${issueLog.casesClosed ?? "—"} · escalated ${issueLog.casesEscalated ?? "—"}.\n`
    : ""
}
${formatIssueLogEntries(pathways).join("\n\n")}`;
    }

    case "environmental_indicators": {
      const env = facts.attended.filter((i) =>
        /dust|noise|water|env|pollut|waste/i.test(
          `${i.nature || ""} ${i.category} ${i.title}`,
        ),
      );
      const rows = env.length ? env : facts.attended.slice(0, 3);
      const esg = facts.packs.esg[0];
      return `## ${label}

Environmental interface cases in ${period}:

${findingLines(rows)}
${
  esg
    ? `Captured ESG period notes:
- Environmental incidents: ${esg.environmentalIncidents ?? "—"}
- Dust / water / noise / waste: ${esg.dustWaterNoiseNotes || "—"}
- Rehabilitation: ${esg.rehabilitationProgress || "—"}`
    : "Dust suppression, night-work windows, and water disruption controls remain the primary environmental controls under watch."
}`;
    }

    case "hs_incidents": {
      const hs = facts.attended.filter((i) =>
        /safety|trench|injur|hs|barrier|hazard/i.test(
          `${i.nature || ""} ${i.category} ${i.title}`,
        ),
      );
      const rows = hs.length ? hs : facts.attended.slice(0, 3);
      const esg = facts.packs.esg[0];
      return `## ${label}

Health and safety related filings in ${period}:

${findingLines(rows)}
${
  esg
    ? `Captured H&S pack figures: near misses **${esg.hsNearMisses ?? "—"}** · lost-time injuries **${esg.hsLostTimeInjuries ?? "—"}**.`
    : "Barrier integrity and open-excavation controls are the standing H&S priorities until the pending set is closed."
}`;
    }

    case "esg_scorecard": {
      const esg = facts.packs.esg[0];
      const emp = facts.packs.employment[0];
      return `## ${label}

ESG position for ${period} on ${scope}:
- **Social licence:** trust ${facts.trustIndex}/100 (${facts.trustLabel})
- **Grievance load:** ${facts.attended.length} cases · ${facts.escalated.length} escalations · ${facts.resolved.length} closures
- **Lead social risks:** ${shortList(facts.escalated.length ? facts.escalated : facts.attended)}
${
  esg
    ? `- **Environmental incidents (captured):** ${esg.environmentalIncidents ?? "—"}
- **H&S near misses / LTI:** ${esg.hsNearMisses ?? "—"} / ${esg.hsLostTimeInjuries ?? "—"}
- **Environment controls:** ${esg.dustWaterNoiseNotes || "—"}
- **Community trust notes:** ${esg.communityTrustNotes || "—"}
- **Governance actions:** ${esg.governanceActions || "—"}`
    : "- ESG period pack not yet captured in Capture hub — environmental and H&S narratives follow matching case natures."
}
${
  emp
    ? `- **Local hire:** ${emp.localHireActual ?? "—"} of ${emp.localHireTarget ?? "—"} target · workforce ${emp.totalWorkforce ?? "—"}`
    : ""
}`;
    }

    case "bbbee_empowerment": {
      const bb = facts.packs.bbbee[0];
      const emp = facts.packs.employment[0];
      if (!bb && !emp) {
        return `## ${label}

Local participation and empowerment interface for ${period} is evidenced through community-facing cases (${shortList(facts.attended)}) and Capture records (${facts.meetingCaptures.length} on file). Capture a **B-BBEE / Empowerment** and **Employment** pack under Capture hub to populate ownership, skills, procurement, and local hire figures.`;
      }
      return `## ${label}

Empowerment evidence for ${period} on ${scope}:
${
  bb
    ? `- **B-BBEE level / status:** ${bb.bbbeeLevel || "—"}
- **Ownership / black ownership:** ${bb.ownershipPct ?? "—"}% / ${bb.blackOwnershipPct ?? "—"}%
- **Skills development spend:** R${bb.skillsDevSpendZar?.toLocaleString("en-ZA") ?? "—"}
- **Preferential procurement:** R${bb.preferentialProcurementZar?.toLocaleString("en-ZA") ?? "—"}
- **ESD spend:** R${bb.esdSpendZar?.toLocaleString("en-ZA") ?? "—"}
- **Local suppliers engaged:** ${bb.localSupplierCount ?? "—"}
- **Certificate ref:** ${bb.certificateRef || "—"}
- **Management control:** ${bb.managementControlNotes || "—"}
${bb.notes ? `- **Notes:** ${bb.notes}` : ""}`
    : "- B-BBEE pack not yet filed."
}
${
  emp
    ? `
Employment interface:
- **Local hire:** ${emp.localHireActual ?? "—"} / ${emp.localHireTarget ?? "—"} target
- **Workforce / contractor labour:** ${emp.totalWorkforce ?? "—"} / ${emp.contractorLabour ?? "—"}
- **Women / youth / PWD:** ${emp.womenEmployed ?? "—"} / ${emp.youthEmployed ?? "—"} / ${emp.personsWithDisability ?? "—"}
- **Training days / spend:** ${emp.trainingDays ?? "—"} / R${emp.trainingSpendZar?.toLocaleString("en-ZA") ?? "—"}
${emp.trainingActivityNotes ? `- **Training activity:** ${emp.trainingActivityNotes}` : ""}
- **Open labour disputes:** ${emp.labourDisputesOpen ?? "—"}
${emp.wardOfOriginNotes ? `- **Ward / origin:** ${emp.wardOfOriginNotes}` : ""}`
    : ""
}
Community cases in period: ${shortList(facts.attended)}.`;
    }

    case "csi_spend": {
      const csiRows = facts.packs.csi;
      if (!csiRows.length) {
        return `## ${label}

CSI and community investment activity in ${period} is reflected in ${facts.meetingCaptures.length} meeting/capture record${facts.meetingCaptures.length === 1 ? "" : "s"} and community cases (${shortList(facts.attended)}). Capture a **CSI programme** pack to record programme name, beneficiaries, and spend.`;
      }
      return `## ${label}

CSI programmes captured for ${period}:

${csiRows
  .map(
    (c) =>
      `- **${c.programmeName || "Programme"}** — ${c.beneficiaryGroup || "beneficiaries"}; R${c.amountZar?.toLocaleString("en-ZA") ?? "—"} · reached ${c.beneficiariesReached ?? "—"}${c.outcomes ? `; outcomes: ${c.outcomes}` : ""}`,
  )
  .join("\n")}

Related meetings on file: ${facts.meetingCaptures.length}. Community cases: ${shortList(facts.attended)}.`;
    }

    case "mel_indicators": {
      const escRate = facts.attended.length
        ? Math.round((facts.escalated.length / facts.attended.length) * 100)
        : 0;
      const grm = facts.packs.grm[0];
      const issueLog = facts.packs.issueLogs[0];
      return `## ${label}

MEL snapshot for ${period}:
- Cases attended: **${facts.attended.length}**
- Resolved: **${facts.resolved.length}**
- Escalation rate: **${escRate}%**
- Trust index: **${facts.trustIndex}/100 (${facts.trustLabel})**
- Blocked / SLA pressure: **${facts.unresolvedBlocked.length}**
${
  grm
    ? `- **GRM pack:** opened ${grm.casesOpened ?? "—"} · closed ${grm.casesClosed ?? "—"} · escalated ${grm.casesEscalated ?? "—"} · avg days ${grm.avgDaysToClose ?? "—"}
${grm.topThemes ? `- **Top themes:** ${grm.topThemes}` : ""}`
    : ""
}
${
  issueLog
    ? `- **Issue log:** logged ${issueLog.casesLogged ?? "—"} · open ${issueLog.casesOpen ?? "—"} · closed ${issueLog.casesClosed ?? "—"}
${issueLog.openCaseRefs ? `- **Open refs:** ${issueLog.openCaseRefs}` : ""}
${
  (issueLog.entries || []).filter((e) => e.title?.trim()).length
    ? `- **Sequenced pathways on file:** ${(issueLog.entries || []).filter((e) => e.title?.trim()).length}`
    : ""
}`
    : ""
}`;
    }

    case "budget_spend": {
      const bud = facts.packs.budget[0];
      const profile = facts.packs.projectProfiles[0];
      const bb = facts.packs.bbbee[0];
      const emp = facts.packs.employment[0];
      const total =
        bud?.budgetTotalZar ?? profile?.budgetTotal;
      const spent =
        bud?.spendToDateZar ?? profile?.budgetSpent;
      if (bud || profile || bb || emp) {
        return `## ${label}

Empowerment budget and spend for ${period} on ${scope}:
- **Empowerment budget authorised:** R${total?.toLocaleString("en-ZA") ?? "—"}
- **Empowerment spent to date:** R${spent?.toLocaleString("en-ZA") ?? "—"}
${bud?.periodSpendZar != null ? `- **Period empowerment spend:** R${bud.periodSpendZar.toLocaleString("en-ZA")}` : ""}
${emp?.trainingSpendZar != null ? `- **Training spend (employment pack):** R${emp.trainingSpendZar.toLocaleString("en-ZA")}` : ""}
${bb?.skillsDevSpendZar != null ? `- **Skills development spend:** R${bb.skillsDevSpendZar.toLocaleString("en-ZA")}` : ""}
${bb?.preferentialProcurementZar != null ? `- **Preferential procurement:** R${bb.preferentialProcurementZar.toLocaleString("en-ZA")}` : ""}
${bb?.esdSpendZar != null ? `- **ESD spend:** R${bb.esdSpendZar.toLocaleString("en-ZA")}` : ""}
${bud?.contingencyZar != null ? `- **Contingency remaining:** R${bud.contingencyZar.toLocaleString("en-ZA")}` : ""}
${bud?.claimsPendingZar != null ? `- **Claims pending:** R${bud.claimsPendingZar.toLocaleString("en-ZA")}` : ""}
${bud?.varianceNotes ? `- **Variance:** ${bud.varianceNotes}` : ""}

Operational blockers tied to claims/evidence: ${shortList(facts.pending.length ? facts.pending : facts.attended, 3)}.`;
      }
      return `## ${label}

Progress-claim and evidence documentation risk is concentrated on ${shortList(facts.pending.length ? facts.pending : facts.attended, 3)}. Capture an **Empowerment budget**, **Employment** (training spend), or **B-BBEE** pack to file empowerment utilisation for ${period}.`;
    }

    case "portfolio_risk":
      return `## ${label}

Portfolio risk for ${scope} in ${period}: **${facts.unresolvedBlocked.length}** blocked/SLA-pressured case${facts.unresolvedBlocked.length === 1 ? "" : "s"}, **${facts.escalated.length}** escalation${facts.escalated.length === 1 ? "" : "s"}, trust **${facts.trustLabel}**. Highest-visibility items: ${shortList(facts.escalated.length ? facts.escalated : facts.unresolvedBlocked)}.`;

    case "identified_risks":
    case "project_impact":
    case "impact_level":
    case "mitigation_in_progress":
    case "mitigation_process":
    case "expected_outcome":
    case "executive_expedite":
      return writeExecutiveRiskSection(id, label, facts);

    case "board_recommendations":
      return `## ${label}

1. Clear or formally decision-gate blocked cases: ${shortList(facts.unresolvedBlocked) || "none open"}.
2. Hold a supervisor checkpoint on escalations: ${shortList(facts.escalated) || "none open"}.
3. Confirm Capture packs (B-BBEE, employment, CSI, ESG, budget) and the evidence appendix before investor or board circulation.
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

function writeExecutiveRiskSection(
  id: ReportSectionId,
  label: string,
  facts: PeriodActivityFacts,
): string {
  const rows = riskRowsFromFacts(facts);
  if (!rows.length) {
    return `## ${label}

No open issues are on the desk for this scope. There is nothing for executives to expedite this cycle.`;
  }
  if (id === "identified_risks") {
    return `## ${label}

${rows.map((r) => `- **${r.id} — ${r.issue}** (${r.projectName || "site"}; ${r.impactLevel}).`).join("\n")}`;
  }
  if (id === "executive_expedite") {
    const asks = rows.filter((r) => r.executiveAction);
    return `## ${label}

${
  asks.length
    ? asks.map((r) => `- **${r.id}:** ${r.executiveAction}`).join("\n")
    : "No executive intervention is required this cycle — the desk can complete the current stages."
}`;
  }
  return `## ${label}

${rows
  .map((r) => {
    if (id === "project_impact") return `- **${r.id}:** ${r.projectImpact}`;
    if (id === "impact_level")
      return `- **${r.id}:** ${r.impactLevel} (${r.impactLevelDetail})`;
    if (id === "mitigation_in_progress") return `- **${r.id}:** ${r.mitigation}`;
    if (id === "mitigation_process") return `- **${r.id}:** ${r.processStage}`;
    return `- **${r.id}:** ${r.expectedOutcome}`;
  })
  .join("\n")}`;
}

function composeHeader(input: ComposeNarrativeInput, title: string): string {
  const scope =
    input.projectName || input.facts.projectName || "portfolio scope";
  const today = new Date().toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `# ${title}

**Date:** ${today}  
**Prepared by:** ${input.authorName} (${input.authorTierLabel})  
**Audience:** ${input.audienceLabel}  
**Scope:** ${scope}  
`;
}

function composeExecutiveRiskBrief(input: ComposeNarrativeInput): {
  title: string;
  bodyMarkdown: string;
  executiveHighlight: string;
} {
  const title = `${input.kindLabel} — ${input.periodLabel}`;
  const scope =
    input.projectName || input.facts.projectName || "portfolio scope";
  const rows = riskRowsFromFacts(input.facts);
  const asks = rows.filter((r) => r.executiveAction);
  const issueBlocks = rows.length
    ? rows
        .map(
          (r) => `### ${r.id} — ${r.issue}

- **Project impact:** ${r.projectImpact}
- **Impact level:** ${r.impactLevel} (${r.impactLevelDetail})
- **Mitigation in progress:** ${r.mitigation}
- **Mitigation process:** ${r.processStage}
- **Expected outcome:** ${r.expectedOutcome}
- **Executive action:** ${r.executiveAction || "None required this cycle — desk can complete the current stage."}`,
        )
        .join("\n\n")
    : "No open issues are on the desk for this scope.";

  const bodyMarkdown = `${composeHeader(input, title).trim()}

## Position

Trust pulse for **${scope}** in **${input.periodLabel}**: **${input.facts.trustIndex}/100 (${input.facts.trustLabel})**. **${rows.length}** identified issue${rows.length === 1 ? "" : "s"}; **${asks.length}** need executive action to expedite.

## Identified issues

${issueBlocks}

## What executives can expedite

${
  asks.length
    ? asks.map((r) => `- **${r.id}:** ${r.executiveAction}`).join("\n")
    : "No executive intervention is required this cycle."
}

## Closing

This is an executive risk brief, not a monthly activity log. Human review is required before circulation.
`;

  return {
    title,
    bodyMarkdown: bodyMarkdown.trim(),
    executiveHighlight: `Executive risk brief: ${rows.length} issue(s), ${asks.length} expedite ask(s), trust ${input.facts.trustIndex}/100.`,
  };
}

function composeFunderBrief(input: ComposeNarrativeInput): {
  title: string;
  bodyMarkdown: string;
  executiveHighlight: string;
} {
  const title = `${input.kindLabel} — ${input.periodLabel}`;
  const scope =
    input.projectName || input.facts.projectName || "portfolio scope";
  const snap = funderSnapshotFromFacts(input.facts);
  const cited = incidentsFromFacts(input.facts)
    .map((i) => i.id)
    .slice(0, 8);
  const materials = snap.materialItems.length
    ? snap.materialItems.map((m) => `- ${m.line}`).join("\n")
    : "- No material open items this period.";
  const asks = snap.asks.map((a) => `- ${a}`).join("\n");
  const citations = cited.length
    ? cited.join(", ")
    : "none on file";

  const bodyMarkdown = `${composeHeader(input, title).trim()}

## Assurance snapshot

High-level position for **${scope}** in **${input.periodLabel}** (not a day-to-day activity dump):

- **Trust:** ${snap.trustIndex}/100 (${snap.trustLabel})
- **Open / closed:** ${snap.openCount} / ${snap.closedCount}
- **Material high-risk:** ${snap.highRiskCount}
- **SLA pressure:** ${snap.slaBreachedCount}
- **Cases cited:** ${citations}

## Material items

${materials}

## What we are asking

${asks}

## Closing

This client / funder pack is an assurance snapshot. Detailed operational activity sits in the monthly report. Human review is required before external circulation.
`;

  return {
    title,
    bodyMarkdown: bodyMarkdown.trim(),
    executiveHighlight: `Funder snapshot: trust ${snap.trustIndex}/100; ${snap.openCount} open; ${snap.highRiskCount} high-risk.`,
  };
}

/**
 * Write a finished markdown report from picked topics + evidence facts.
 * Never returns instructional placeholders.
 * Monthly = detailed activity (honours includedSectionIds).
 * Executive / funder = fixed briefs (topic ids are informational; the layout
 * is locked so packs do not collapse back into one generic dump).
 */
export function composeActivityReportMarkdown(
  input: ComposeNarrativeInput,
): { title: string; bodyMarkdown: string; executiveHighlight: string } {
  const lens = inferReportLens(input);
  if (lens === "executive") return composeExecutiveRiskBrief(input);
  if (lens === "funder") return composeFunderBrief(input);

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

  const packHint = periodFactsHaveWritableEvidence(input.facts)
    ? input.facts.attended.length
      ? `Lead case set: ${shortList(input.facts.attended)}.`
      : `Evidence from project dossier / Capture packs (${input.facts.meetingCaptures.length} meeting/note capture${input.facts.meetingCaptures.length === 1 ? "" : "s"}; packs filed for empowerment, employment, GRM, or budget as available).`
    : `Lead case set: ${shortList(input.facts.attended)}.`;

  const highlight = `## Summary

This detailed ${input.kindLabel.toLowerCase()} covers **${input.includedSectionLabels.length}** selected topic${input.includedSectionLabels.length === 1 ? "" : "s"} for **${input.periodLabel}** on **${scope}**. Trust pulse: **${input.facts.trustIndex}/100 (${input.facts.trustLabel})**. ${packHint}
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

The findings above are drawn from TrustLedger workspace evidence for ${input.periodLabel}. This monthly pack is the detailed operational record. Human review is required before external circulation; figures and annexures should be confirmed by the responsible desk.
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
