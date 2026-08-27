/**
 * SEP Document Renderer
 * Phase G: TrustLedger SRM — SEP Generation Specification v1.0
 *
 * Specification Section 19: Standard tender-grade SEP structure (25 sections + appendices)
 * Client voice: bid-grade report. Letterhead only for TrustLedger / Chibase.
 * Methodology may name TrustLedger and SL2B as tools (ADR-053). No product architecture.
 */

import { METHOD_LIBRARY } from "@/lib/sepMethodLibrary";
import { complianceStatus } from "@/lib/sepComplianceMatrix";
import { generateQAReport } from "@/lib/sepQualityAssurance";
import type {
  ComplianceItem,
  QAResult,
  SEPDocument,
  SepGenerationPlan,
  TenderIntelligence,
} from "@/types/sepAnalysis";

export const SEP_SECTION_SPECS = [
  { number: 1, id: "introduction", title: "Introduction" },
  { number: 2, id: "project-overview", title: "Project Overview" },
  { number: 3, id: "understanding", title: "Understanding of the Assignment" },
  { number: 4, id: "compliance-matrix", title: "Tender Requirements & Compliance Matrix" },
  { number: 5, id: "social-context", title: "Social Context and Impact Analysis" },
  { number: 6, id: "stakeholders", title: "Stakeholder Identification and Analysis" },
  { number: 7, id: "participation", title: "Stakeholder Participation Framework" },
  { number: 8, id: "risk-opportunity", title: "Social Risk and Opportunity Assessment" },
  { number: 9, id: "methodology", title: "Participatory Methodology — PRA, PLA and CBPR" },
  { number: 10, id: "engagement-strategy", title: "Engagement Strategy" },
  { number: 11, id: "community-programme", title: "Community Participation Programme" },
  { number: 12, id: "inclusion", title: "Inclusion and Vulnerability Strategy" },
  { number: 13, id: "communication", title: "Communication Strategy" },
  { number: 14, id: "grievance", title: "Grievance Redress Mechanism" },
  { number: 15, id: "early-warning", title: "Social Risk and Early Warning" },
  { number: 16, id: "led", title: "Local Economic / Empowerment Participation" },
  { number: 17, id: "mel", title: "Monitoring, Evaluation and Learning" },
  { number: 18, id: "reporting", title: "Reporting Framework" },
  { number: 19, id: "roles", title: "Roles and Responsibilities" },
  { number: 20, id: "schedule", title: "Implementation Schedule" },
  { number: 21, id: "resources", title: "Resources and Capacity" },
  { number: 22, id: "data", title: "Data Management and Evidence" },
  { number: 23, id: "qa", title: "Quality Assurance" },
  { number: 24, id: "assumptions", title: "Assumptions, Dependencies and Limitations" },
  { number: 25, id: "conclusion", title: "Conclusion" },
] as const;

export const SEP_APPENDIX_SPECS = [
  { id: "app-stakeholders", title: "Appendix A — Stakeholder Register" },
  { id: "app-engagement", title: "Appendix B — Engagement Matrix" },
  { id: "app-risks", title: "Appendix C — Risk Register" },
  { id: "app-grm", title: "Appendix D — Grievance Workflow" },
  { id: "app-tools", title: "Appendix E — Participation Tools" },
  { id: "app-indicators", title: "Appendix F — Indicators" },
  { id: "app-reporting", title: "Appendix G — Reporting Templates" },
  { id: "app-consultation", title: "Appendix H — Consultation Record" },
  { id: "app-commitments", title: "Appendix I — Commitment Register" },
  { id: "app-compliance", title: "Appendix J — Compliance Matrix" },
  { id: "app-qa", title: "Appendix K — QA Report" },
] as const;

function mdTable(headers: string[], rows: string[][]): string {
  if (!rows.length) return "_None recorded at this stage._";
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => cell.replace(/\|/g, "/")).join(" | ")} |`),
  ].join("\n");
}

function tbc(value?: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "TBC" ? trimmed : "TBC";
}

function para(...parts: string[]): string {
  return parts.filter(Boolean).join("\n\n");
}

function sectionBodies(plan: SepGenerationPlan, tender: TenderIntelligence): string[] {
  const duration = tender.contractPeriod.durationMonths
    ? `${tender.contractPeriod.durationMonths} months`
    : "the contract period (TBC at inception)";
  const place = tbc(tender.projectLocation);
  const title = tbc(tender.projectName || tender.tenderTitle);
  const client = tbc(tender.procuringEntity);
  const censusNote =
    plan.socialContext.affectedPeople.estimatedNumbers
      ? `The tender states an estimate of ${plan.socialContext.affectedPeople.estimatedNumbers}. That figure is a tender estimate, not a field count.`
      : "Household numbers are not treated as known until a participatory census is validated.";
  const summary = complianceStatus(plan.complianceMatrix);
  const qa = generateQAReport(plan.qaResults);

  const s1 = para(
    `This Stakeholder Engagement Plan (SEP) sets out how Chibase Consulting will identify, inform, and involve the people and institutions affected by **${title}**, issued by **${client}** (tender ${tbc(tender.tenderNumber)}).`,
    `The plan is an operating document for a ${duration} assignment at ${place}. It states what participation will achieve, who can influence which decisions, how grievances will be handled, and how evidence will be kept. It is not legal advice and it does not substitute statutory processes named in the tender.`,
    `Facts below are taken from the tender where they exist. Professional inferences are labelled. Items that are not in the tender or a client brief are marked TBC and will not be invented to fill a template.`,
  );

  const s2 = para(
    `**2.1 Assignment.** ${title}. Sector (classified from the tender): ${plan.project.sector}. Location: ${place}.`,
    `**2.2 Displacement.** ${plan.project.displacementType === "none" ? "The tender does not state physical or economic displacement." : `The tender indicates ${plan.project.displacementType} displacement. ${plan.project.displacementDescription || ""}`} ${censusNote}`,
    `**2.3 Duration and horizon.** ${duration}. Implementation horizon: ${plan.project.implementationHorizon.replace(/_/g, " ")}. Social impact profile (professional classification): ${plan.project.socialImpactProfile} — ${plan.project.socialImpactRationale}`,
    `**2.4 Instruments cited.** ${
      tender.regulatoryReferences.length
        ? tender.regulatoryReferences.map((row) => row.instrument).join("; ")
        : "No statute is named beyond the tender’s own consultation conditions; none is invented here."
    }`,
  );

  const s3 = para(
    `The assignment is not a generic consultation calendar. It is a relocation-and-livelihood problem if the tender says so, and a statutory-alignment problem wherever a municipality or licensing condition is named.`,
    `What this team must do, on the tender’s own words: ${tender.scope.activities.slice(0, 8).join("; ") || tender.requirements.map((r) => r.text).slice(0, 5).join("; ")}.`,
    `What stakeholders can influence is stated in Section 7. What they cannot influence will be said out loud at inception — not discovered after a decision is already locked.`,
  );

  const s4 = para(
    `Every extracted tender requirement is mapped to a SEP response, section, activity, and evidence path. Status is covered, partial, or missing. Partial and missing rows block any claim that the requirement is already met.`,
    `Current coverage: ${summary.covered} covered, ${summary.partial} partial, ${summary.missing} missing (of ${plan.complianceMatrix.length}).`,
    mdTable(
      ["Requirement", "Source", "SEP response", "Sections", "Status"],
      plan.complianceMatrix.slice(0, 20).map((row) => [
        row.tenderRequirement.slice(0, 140),
        row.sourceReference,
        row.sepResponse.slice(0, 160),
        row.sepSections.join(", "),
        row.status,
      ]),
    ),
    `The full matrix is Appendix J.`,
  );

  const s5 = para(
    `**5.1 Affected people.** ${plan.socialContext.affectedPeople.description} Geography: ${plan.socialContext.affectedPeople.geographicLocation}. ${censusNote}`,
    `**5.2 Livelihoods.** Sectors at risk or in play: ${plan.socialContext.livelihoodImpacts.sectors.join("; ") || "TBC"}. Potential effects: ${plan.socialContext.livelihoodImpacts.potentialEffects.join("; ") || "TBC"}. ${plan.socialContext.livelihoodImpacts.seasonalityNote || ""}`,
    `**5.3 Governance.** ${
      plan.socialContext.governanceStructures.length
        ? plan.socialContext.governanceStructures.map((row) => `${row.name} (${row.type.replace(/_/g, " ")}) — ${row.relevance}`).join("; ")
        : "Governance counterparts will be confirmed at inception; none are invented."
    }`,
    `**5.4 Confidence.** Analysis source: ${plan.socialContext.analysisSource.replace(/_/g, " ")}. Confidence: ${plan.socialContext.confidenceLevel}. ${plan.socialContext.notesAndAssumptions || ""}`,
  );

  const s6 = para(
    `Stakeholders are listed as classes and named organisations from the tender. Personal names are not invented.`,
    mdTable(
      ["Name / class", "Type", "Participation", "What they can influence", "Confidence"],
      plan.stakeholders.map((row) => [
        row.nameOrCategory,
        row.stakeholderType.replace(/_/g, " "),
        row.participationLevel,
        row.whatTheyCanInfluence.slice(0, 2).join("; "),
        row.confidenceLevel,
      ]),
    ),
    `Representation is not treated as valid until the group confirms it. Office-bearers are a starting list, not a substitute for that check.`,
  );

  const s7 = para(
    `Every major stakeholder has an explicit participation objective. “Consulted” is not used as a blanket label.`,
    mdTable(
      ["Stakeholder", "Level", "Decision / design area", "How input is considered"],
      plan.participationObjectives.map((row) => [
        row.stakeholderCategory,
        row.participationLevel,
        row.decisionOrDesignArea,
        row.howInputWillBeConsidered.slice(0, 140),
      ]),
    ),
    `Feedback mechanism (standard): a decision log plus verbal or written return at the next contact with that group. Silence is not a response.`,
  );

  const s8 = para(
    mdTable(
      ["Issue", "Who is affected", "Rating", "Mitigation", "Owner"],
      plan.risks.map((row) => [
        row.issue,
        row.affectedStakeholders.join("; "),
        row.riskRating,
        row.mitigation.slice(0, 120),
        row.owner,
      ]),
    ),
    plan.socialContext.opportunities.length
      ? `**Opportunities.** ${plan.socialContext.opportunities.map((row) => row.description).join("; ")} Conditions: ${plan.socialContext.opportunities.flatMap((row) => row.requiredConditions).slice(0, 4).join("; ")}.`
      : "No local-content opportunity is claimed beyond what the tender states.",
  );

  const s9 = para(
    `This assignment uses three complementary methods. They are selected for purpose, not as decoration.`,
    `**PRA (Participatory Rural Appraisal)** — ${METHOD_LIBRARY.pra.primaryRole}. ${METHOD_LIBRARY.pra.selectionCriteria} Tools: ${METHOD_LIBRARY.pra.examples.join(", ")}. Reference: ${METHOD_LIBRARY.pra.reference}.`,
    `**PLA (Participatory Learning and Action)** — ${METHOD_LIBRARY.pla.primaryRole}. ${METHOD_LIBRARY.pla.selectionCriteria} Tools: ${METHOD_LIBRARY.pla.examples.join(", ")}. Reference: ${METHOD_LIBRARY.pla.reference}.`,
    `**CBPR (Community-Based Participatory Research)** — ${METHOD_LIBRARY.cbpr.primaryRole}. ${METHOD_LIBRARY.cbpr.selectionCriteria} Tools: ${METHOD_LIBRARY.cbpr.examples.join(", ")}. Reference: ${METHOD_LIBRARY.cbpr.reference}.`,
    mdTable(
      ["Method", "Selected for", "Rationale", "Expected output"],
      plan.methods.map((row) => [
        row.methodology.toUpperCase(),
        row.selectedForObjective.slice(0, 80),
        row.selectionRationale.slice(0, 120),
        row.expectedOutputs[0] || "",
      ]),
    ),
    `**Tools (record and sequence, not a protocol annex).** TrustLedger is the record of engagements, promises, and grievances on this assignment. Social Licence to Build (SL2B) is the sequencing frame — who is met, in what order, and how promises are kept. They are tools used to run the plan, not a separate annex.`,
  );

  const s10 = para(
    `Engagement is sequenced: authorities first (what is negotiable), then mapping, then census, then options and host consent, with grievance design in parallel before first material impact.`,
    `Each activity has a purpose, method, output, and decision linkage. Activities that do not change a decision are not scheduled as “participation”.`,
  );

  const s11 = para(
    mdTable(
      ["Activity", "Purpose", "Method", "Output", "Decision linkage", "Timing", "Owner"],
      plan.activities.map((row) => [
        row.activityName,
        row.purpose.slice(0, 90),
        row.method,
        row.expectedOutput.slice(0, 80),
        row.decisionLinkage.slice(0, 90),
        row.plannedDate || row.trigger,
        row.owner,
      ]),
    ),
  );

  const s12 = para(
    `Standard meetings will miss people. The following groups are treated as requiring alternative mechanisms, not an invitation to the same hall.`,
    mdTable(
      ["Group", "Vulnerability", "Disproportionate risk", "Barriers"],
      plan.socialContext.vulnerabilities.map((row) => [
        row.group,
        row.vulnerability,
        row.disproportionateRisk.slice(0, 100),
        row.participationBarriers.join("; "),
      ]),
    ),
    `Alternative mechanisms designed into this plan: home visits, separate focus groups, daylight timing, oral briefing, and accessible venues. Languages of the project area are TBC at inception.`,
  );

  const s13 = para(
    mdTable(
      ["Audience", "Core message", "Channels", "Language / access", "Frequency", "Owner"],
      plan.communications.map((row) => [
        row.audience,
        row.messageCore.slice(0, 100),
        row.channels.join("; "),
        row.language,
        row.frequency,
        row.owner,
      ]),
    ),
    `Receipt is verified by attendance register or written acknowledgement — not by assuming a notice was seen.`,
  );

  const s14 = para(
    `One mechanism handles all project-related complaints. Acknowledgement standard: 48 hours. Closure requires that the complainant is informed and evidence is on file.`,
    mdTable(
      ["Stage", "Function", "Role", "Service level", "Evidence"],
      plan.grievanceFramework.stages.map((row) => [
        row.stage,
        row.function.slice(0, 120),
        row.responsibleRole,
        row.serviceLevel || "—",
        row.evidence,
      ]),
    ),
    `Lodgement channels: ${plan.grievanceFramework.lodgementChannels.map((row) => row.channel).join("; ")}. Repeated-issue threshold: ${plan.grievanceFramework.trendMonitoring.repeatedIssueThreshold} similar complaints are treated as a programme risk.`,
  );

  const s15 = para(
    mdTable(
      ["Risk", "Early-warning trigger", "Monitoring indicator", "Participation response"],
      plan.risks.map((row) => [
        row.issue,
        row.earlyWarningTrigger,
        row.monitoringIndicator || "—",
        row.participationResponse.slice(0, 120),
      ]),
    ),
    `When a trigger fires, the related activity pauses long enough to brief the client and the people affected. Triggers are not decorative.`,
  );

  const s16 = para(
    plan.socialContext.opportunities.length
      ? `Local economic participation will follow what the tender actually requires. Claims of employment numbers, package values, or SMME quotas are not invented.`
      : `The tender does not state a local-content quota. This plan therefore does not promise jobs, set-asides, or package values. If the client later names a quota, it will be added as a tender fact.`,
    `Where livelihood restoration is required, pathways are ranked with households after the census. Restoration is not a slogan and not a number invented for this document.`,
  );

  const types = ["input", "process", "output", "outcome"] as const;
  const s17 = para(
    `M&E is built on four questions: were resources available (input); did engagement occur (process); what did it produce (output); did it change a decision or a risk (outcome).`,
    mdTable(
      ["Type", "Indicator", "Definition", "Frequency", "Evidence", "Owner"],
      types.flatMap((type) =>
        plan.indicators
          .filter((row) => row.indicatorType === type)
          .slice(0, 4)
          .map((row) => [
            row.indicatorType,
            row.indicatorName.slice(0, 80),
            row.definition.slice(0, 100),
            row.frequency,
            row.evidenceSource.slice(0, 60),
            row.owner,
          ]),
      ),
    ),
    `The full indicator list is Appendix F.`,
  );

  const s18 = para(
    `**Monthly.** Progress report from records: activities held or adapted, GRM log extract, commitment register extract, TBC items still open. Recipient: ${tender.reportingRequirements.recipients?.join(", ") || client}. Format: ${tender.reportingRequirements.formats?.join(", ") || "written report"}.`,
    `**At decision gates.** Decision log returned to the group whose input was sought.`,
    `**Close-out.** Handover pack: registers, open grievances, unfulfilled commitments. Nothing is closed on paper to make a timeline look clean.`,
  );

  const owners = [...new Set(plan.activities.map((row) => row.owner))];
  const s19 = para(
    `Roles below are functions, not invented personal names.`,
    mdTable(
      ["Role", "Accountable for"],
      [
        ["Plan Owner / Social Performance Lead", "Decision log, commitment register, client reporting, escalation"],
        ["Facilitation Lead", "PRA/PLA sessions, inclusion adjustments, map validation"],
        ["CLO", "Day-to-day contact, GRM lodgement and acknowledgement, notices"],
        ["Livelihood Lead", "Seasonal calendars, restoration ranking (after census)"],
        ...owners.filter((row) => !/plan owner|facilitation|CLO|livelihood/i.test(row)).map((row) => [row, "As assigned on the activity register"]),
      ],
    ),
  );

  const s20 = para(
    mdTable(
      ["Timing", "Activity", "Trigger", "Dependencies"],
      plan.activities.map((row) => [
        row.plannedDate || row.trigger,
        row.activityName,
        row.trigger,
        row.informationNeeded.slice(0, 2).join("; "),
      ]),
    ),
    `Calendar dates inside a month are TBC at inception. Activities are not planned beyond the tender duration.`,
  );

  const s21 = para(
    `Capacity required: a Plan Owner, a facilitator competent in PRA/PLA, a CLO, a recorder, and (for census) trained community researchers. Names, CVs, and fee rates are a commercial submission, not invented here.`,
    `Budget for participation (transport, venues, translation, childcare where required) is TBC in the financial proposal. This document does not fabricate a budget line.`,
  );

  const s22 = para(
    `Evidence is the point of the system: attendance (disaggregated), consent, maps, ranking sheets, decision logs, GRM records, photographs only with consent, and the commitment register.`,
    `Personal information is minimised to what the census and GRM require. It is not published in public reports. Field confirmation status is kept distinct from tender facts.`,
    `Provenance labels used internally: tender fact, professional inference, proposed methodology, to be confirmed.`,
  );

  const s23 = para(
    `Automated quality assurance is run against fourteen tests (completeness, tender alignment, fact integrity, method integrity, stakeholder completeness, participation quality, risk coherence, grievance coherence, M&E coherence, schedule realism, internal consistency, legal restraint, evidence traceability, professional quality).`,
    `QA summary: ${qa.passed} pass, ${qa.warnings} warning, ${qa.failures} fail. Ready for approval (no high/critical blockers): ${qa.readyForApproval ? "yes" : "no"}.`,
    qa.blockers.length
      ? `Blockers that must be closed before approval:\n${qa.blockers.map((row) => `- ${row.qaTest}: ${row.finding}`).join("\n")}`
      : "No high or critical blockers are open on this draft.",
    `The full QA report is Appendix K.`,
  );

  const s24 = para(
    `**Assumptions.** The tender text is the fact base. Counterparts named in the tender exist and can be reached. Field conditions will differ; the census and first-contact validation are the correction mechanism.`,
    `**Dependencies.** Client statement of what is negotiable; access to the project area; a decision-owner who can attend option-ranking; personal-information safeguards for census.`,
    `**Limitations.** This draft is not field-confirmed. It does not guarantee consent, statutory approval, or livelihood outcomes. It is not legal advice. Languages, exact sites, and household counts remain TBC until validated.`,
  );

  const s25 = para(
    `This SEP is the method for running participation on **${title}** over ${duration} at ${place}. Affected households can influence options, entitlements, and restoration pathways; host structures can influence consent conditions; authorities can influence statutory windows and reporting. One grievance mechanism will acknowledge complaints within 48 hours.`,
    `Approval of this draft means the client accepts the decision-linkage rules and the TBC list — not that field facts have already been collected.`,
  );

  return [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21, s22, s23, s24, s25];
}

function appendixBodies(plan: SepGenerationPlan): string[] {
  const a = mdTable(
    ["ID", "Name", "Type", "Influence", "Level", "Validated?"],
    plan.stakeholders.map((row) => [
      row.id,
      row.nameOrCategory,
      row.stakeholderType,
      row.influence,
      row.participationLevel,
      row.representation.representationValidated ? "yes" : "not yet",
    ]),
  );
  const b = mdTable(
    ["ID", "Activity", "Stakeholders", "Method", "Output", "Records"],
    plan.activities.map((row) => [
      row.id,
      row.activityName,
      String(row.targetedStakeholders.length),
      row.method,
      row.expectedOutput.slice(0, 80),
      row.requiredRecords.join("; "),
    ]),
  );
  const c = mdTable(
    ["ID", "Issue", "Likelihood", "Severity", "Trigger", "Owner", "Status"],
    plan.risks.map((row) => [
      row.id,
      row.issue,
      row.likelihood,
      row.severity,
      row.earlyWarningTrigger.slice(0, 80),
      row.owner,
      row.status,
    ]),
  );
  const d = para(
    mdTable(
      ["Stage", "Function", "SLA", "Evidence"],
      plan.grievanceFramework.stages.map((row) => [
        row.stage,
        row.function.slice(0, 140),
        row.serviceLevel || "—",
        row.evidence,
      ]),
    ),
    mdTable(
      ["Channel", "Accessibility", "Recording"],
      plan.grievanceFramework.lodgementChannels.map((row) => [row.channel, row.accessibility, row.recordingMethod]),
    ),
  );
  const e = mdTable(
    ["Method", "Tool", "Objective", "Evidence required"],
    plan.methods.map((row) => [
      row.methodology.toUpperCase(),
      row.tool || "—",
      row.selectedForObjective.slice(0, 80),
      row.evidenceRequirements.join("; "),
    ]),
  );
  const f = mdTable(
    ["ID", "Type", "Name", "Target", "Evidence", "Owner"],
    plan.indicators.map((row) => [
      row.id,
      row.indicatorType,
      row.indicatorName.slice(0, 80),
      row.target || "—",
      row.evidenceSource.slice(0, 60),
      row.owner,
    ]),
  );
  const g = para(
    "Monthly progress report (minimum contents): period; activities completed or adapted; attendance (disaggregated); GRM opened/closed/overdue; commitments due/overdue; TBC items still open; decisions taken because of participation.",
    "Consultation record fields: date; place; groups present; purpose; method; outputs; decision linkage; absences / inclusion gaps; next contact.",
  );
  const h = para(
    "Consultation records are opened when the first activity is held. This draft therefore contains the template, not invented minutes.",
    "Required fields match Appendix G.",
  );
  const i = mdTable(
    ["ID", "Commitment", "Owner", "Evidence", "Status"],
    plan.commitments.map((row) => [
      row.id,
      row.commitmentText.slice(0, 140),
      row.owner,
      row.requiredEvidence.join("; "),
      row.status,
    ]),
  );
  const j = mdTable(
    ["ID", "Requirement", "Response", "Evidence", "Status"],
    plan.complianceMatrix.map((row) => [
      row.id,
      row.tenderRequirement.slice(0, 100),
      row.sepResponse.slice(0, 100),
      (row.evidence || []).slice(0, 3).join("; "),
      row.status,
    ]),
  );
  const k = mdTable(
    ["Test", "Result", "Finding", "Remediation"],
    plan.qaResults.map((row) => [
      row.qaTest,
      row.result,
      row.finding.slice(0, 120),
      (row.remediation || "—").slice(0, 100),
    ]),
  );
  return [a, b, c, d, e, f, g, h, i, j, k];
}

export function renderSepDocument(
  plan: SepGenerationPlan,
  tender: TenderIntelligence,
): SEPDocument {
  const bodies = sectionBodies(plan, tender);
  const documentSections: SEPDocument["documentSections"] = SEP_SECTION_SPECS.map((spec, index) => ({
    sectionNumber: spec.number,
    sectionTitle: spec.title,
    sectionId: spec.id,
    body: bodies[index] || "",
    linkedObjectIds: [plan.id],
  }));

  const appendices = appendixBodies(plan);
  SEP_APPENDIX_SPECS.forEach((spec, index) => {
    documentSections.push({
      sectionNumber: 25 + index + 1,
      sectionTitle: spec.title,
      sectionId: spec.id,
      body: appendices[index] || "",
    });
  });

  return {
    id: `SEPDOC-${plan.id}`,
    projectProfileId: plan.projectProfileId,
    title: `Stakeholder Engagement Plan — ${tender.projectName || tender.tenderTitle}`,
    status: "draft",
    version: "1.0",
    documentSections,
    complianceMatrix: plan.complianceMatrix,
    qaResults: plan.qaResults,
    generatedAt: new Date().toISOString(),
    generatedBy: "SEP generation engine",
    draftedWith: "template",
    formatsAvailable: ["markdown", "docx", "pdf"],
  };
}

export function assertSepStructure(doc: SEPDocument): { ok: boolean; missing: string[] } {
  const titles = new Set(doc.documentSections.map((row) => row.sectionTitle));
  const missing = [
    ...SEP_SECTION_SPECS.filter((spec) => !titles.has(spec.title)).map((spec) => spec.title),
    ...SEP_APPENDIX_SPECS.filter((spec) => !titles.has(spec.title)).map((spec) => spec.title),
  ];
  const empty = doc.documentSections.filter((row) => !row.body.trim()).map((row) => row.sectionTitle);
  return { ok: missing.length === 0 && empty.length === 0, missing: [...missing, ...empty.map((t) => `empty: ${t}`)] };
}

export function qaResultsReady(results: QAResult[]): boolean {
  return generateQAReport(results).readyForApproval;
}

export function complianceReady(matrix: ComplianceItem[]): boolean {
  return complianceStatus(matrix).missing === 0;
}
