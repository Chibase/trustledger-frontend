/**
 * Academic / reporting-style SEP section bodies.
 * Prose + structured tables (no raw markdown pipes in the PDF path).
 * Citations only from logged reference documents and Specification s.25 literature.
 */

import {
  citeFramework,
  citeSpec,
  referencesBlock,
  SEP_FRAMEWORK_CITE,
  SEP_SPEC_CITE,
} from "@/data/sepCanon";
import { METHOD_LIBRARY } from "@/lib/sepMethodLibrary";
import { complianceStatus } from "@/lib/sepComplianceMatrix";
import { generateQAReport } from "@/lib/sepQualityAssurance";
import type { SepDocumentTable } from "@/types/engagementPlan";
import type { SepGenerationPlan, TenderIntelligence } from "@/types/sepAnalysis";

export type RenderedSection = {
  body: string;
  tables?: SepDocumentTable[];
};

function tbc(value?: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed !== "TBC" ? trimmed : "TBC";
}

function para(...parts: string[]): string {
  return parts.filter(Boolean).join("\n\n");
}

function issuer(plan: SepGenerationPlan): string {
  return (
    plan.implementingOrganisation?.trim() ||
    "the implementing organisation named at appointment"
  );
}

function clientOf(tender: TenderIntelligence): string {
  return tbc(tender.procuringEntity);
}

export function renderAcademicSections(
  plan: SepGenerationPlan,
  tender: TenderIntelligence,
): RenderedSection[] {
  const duration = tender.contractPeriod.durationMonths
    ? `${tender.contractPeriod.durationMonths} months`
    : "the contract period (TBC at inception)";
  const place = tbc(tender.projectLocation);
  const title = tbc(tender.projectName || tender.tenderTitle);
  const client = clientOf(tender);
  const org = issuer(plan);
  const censusNote = plan.socialContext.affectedPeople.estimatedNumbers
    ? `The tender states an estimate of ${plan.socialContext.affectedPeople.estimatedNumbers}. That figure is a tender estimate, not a field count ${citeSpec("s.3")}.`
    : `Household numbers are not treated as known until participatory enumeration is validated ${citeSpec("s.3")}.`;
  const summary = complianceStatus(plan.complianceMatrix);
  const qa = generateQAReport(plan.qaResults);

  const s1: RenderedSection = {
    body: para(
      `**1.1 Purpose.** This Stakeholder Engagement Plan (SEP) is the output of structured tender analysis, not a template filled in reverse ${citeSpec("s.1")}. It sets out how **${org}** will identify, inform and involve the people and institutions affected by **${title}**, issued by **${client}** (tender ${tbc(tender.tenderNumber)}).`,
      `**1.2 Scope and limits.** The plan covers a ${duration} assignment at ${place}. It states what participation must achieve, who can influence which decisions, how grievances will be handled, and how evidence will be kept. It is not legal advice and it does not substitute statutory processes named in the tender ${citeSpec("s.3")}.`,
      `**1.3 Methodological base.** Analysis and design follow ${SEP_SPEC_CITE.short} and ${SEP_FRAMEWORK_CITE.short}. Those documents require project-specific method selection: “the purpose is not to prescribe a single methodology for every project” ${citeFramework("s.1")}.`,
      `**1.4 Provenance.** Facts below are taken from the tender where they exist. Professional inferences are labelled. Items that are not in the tender or a client brief are marked TBC and are not invented ${citeSpec("s.3, s.17")}.`,
    ),
  };

  const s2: RenderedSection = {
    body: para(
      `**2.1 Assignment.** ${title}. Sector classified from the tender: ${plan.project.sector}. Location: ${place}.`,
      `**2.2 Displacement.** ${
        plan.project.displacementType === "none"
          ? "The tender does not state physical or economic displacement."
          : `The tender indicates ${plan.project.displacementType.replace(/_/g, " ")} displacement. ${plan.project.displacementDescription || ""}`
      } ${censusNote}`,
      `**2.3 Duration and horizon.** ${duration}. Implementation horizon: ${plan.project.implementationHorizon.replace(/_/g, " ")}. Social impact profile (professional classification): ${plan.project.socialImpactProfile} — ${plan.project.socialImpactRationale} ${citeSpec("s.6")}.`,
      `**2.4 Instruments cited.** ${
        tender.regulatoryReferences.length
          ? tender.regulatoryReferences.map((row) => row.instrument).join("; ")
          : "No statute is named beyond the tender’s own consultation conditions; none is invented here."
      }`,
    ),
  };

  const s3: RenderedSection = {
    body: para(
      `**3.1 Character of the work.** The assignment is classified from tender facts (sector, displacement, duration, named counterparts), then designed ${citeSpec("s.4–s.6")}. A relocation-and-livelihood problem is treated as such only if the tender states displacement; a statutory-alignment problem is treated as such where a municipality or licensing condition is named.`,
      `**3.2 Stated tasks.** ${tender.scope.activities.slice(0, 8).join("; ") || tender.requirements.map((r) => r.text).slice(0, 5).join("; ") || "As extracted from the tender."}`,
      `**3.3 Decision linkage.** What stakeholders can influence is stated in Section 7. What they cannot influence will be stated at inception — not discovered after a decision is already locked ${citeSpec("s.10")}.`,
    ),
  };

  const s4: RenderedSection = {
    body: para(
      `**4.1 Requirement.** Every identifiable SEP-related tender requirement must be mapped to a response, a section, and evidence. Partial and missing rows must be flagged before the plan is treated as complete ${citeSpec("s.18")}.`,
      `**4.2 Coverage on this draft.** ${summary.covered} covered; ${summary.partial} partial; ${summary.missing} missing (of ${plan.complianceMatrix.length} extracted requirements). The plan does not claim compliance where the matrix shows only partial coverage.`,
      `*Table 4.1. Tender requirements mapped to SEP response*`,
      `The full matrix, including evidence paths, is reproduced in Appendix J.`,
    ),
    tables: [
      {
        caption: "Table 4.1. Tender requirements mapped to SEP response",
        headers: ["Requirement", "Source", "SEP response", "Sections", "Status"],
        rows: plan.complianceMatrix.slice(0, 18).map((row) => [
          row.tenderRequirement.slice(0, 120),
          row.sourceReference,
          row.sepResponse.slice(0, 140),
          row.sepSections.join(", "),
          row.status,
        ]),
      },
    ],
  };

  const s5: RenderedSection = {
    body: para(
      `**5.1 Function.** Social context is the analytical bridge between the tender and the SEP: not only what the project is, but what it means socially ${citeSpec("s.7")}. This draft is ${plan.socialContext.analysisSource.replace(/_/g, " ")}; confidence is ${plan.socialContext.confidenceLevel}.`,
      `**5.2 Affected people.** ${plan.socialContext.affectedPeople.description} Geography: ${plan.socialContext.affectedPeople.geographicLocation}. ${censusNote}`,
      `**5.3 Livelihoods.** Sectors in play: ${plan.socialContext.livelihoodImpacts.sectors.join("; ") || "TBC"}. Potential effects: ${plan.socialContext.livelihoodImpacts.potentialEffects.join("; ") || "TBC"}. ${plan.socialContext.livelihoodImpacts.seasonalityNote || ""}`,
      `**5.4 Governance.** ${
        plan.socialContext.governanceStructures.length
          ? plan.socialContext.governanceStructures
              .map((row) => `${row.name} (${row.type.replace(/_/g, " ")}) — ${row.relevance}`)
              .join("; ")
          : "Governance counterparts will be confirmed at inception; none are invented."
      }`,
      `**5.5 Vulnerability.** Groups that may face disproportionate impacts or participation barriers are listed in Table 5.1. The community is not treated as homogeneous ${citeFramework("s.22")}.`,
      `**5.6 Notes.** ${plan.socialContext.notesAndAssumptions || "Field-based participatory analysis will refine this assessment."}`,
    ),
    tables: [
      {
        caption: "Table 5.1. Vulnerability and participation barriers",
        headers: ["Group", "Vulnerability", "Disproportionate risk", "Barriers"],
        rows: plan.socialContext.vulnerabilities.map((row) => [
          row.group,
          row.vulnerability,
          row.disproportionateRisk.slice(0, 120),
          row.participationBarriers.join("; "),
        ]),
      },
    ],
  };

  const s6: RenderedSection = {
    body: para(
      `**6.1 Identification.** Stakeholders are listed as classes and named organisations from the tender. Personal names are not invented ${citeSpec("s.3, s.8")}.`,
      `**6.2 Representation.** Representation is not treated as valid until the group confirms it. Office-bearers are a starting list, not a substitute for that check ${citeSpec("s.12")}.`,
      `*Table 6.1. Stakeholder register (this draft)*`,
    ),
    tables: [
      {
        caption: "Table 6.1. Stakeholder identification and participation level",
        headers: ["Name / class", "Type", "Participation", "What they can influence", "Confidence"],
        rows: plan.stakeholders.map((row) => [
          row.nameOrCategory,
          row.stakeholderType.replace(/_/g, " "),
          row.participationLevel,
          row.whatTheyCanInfluence.slice(0, 2).join("; "),
          row.confidenceLevel,
        ]),
      },
    ],
  };

  const s7: RenderedSection = {
    body: para(
      `**7.1 Mandatory rule.** Every major stakeholder group has an explicit participation objective. The engine does not describe all stakeholders as simply “consulted” ${citeSpec("s.10")}.`,
      `**7.2 Levels used.** Inform, consult, involve, collaborate, empower — each with a required question (what must they know; what input is required; which parts can they shape; what can be jointly designed; what authority is actually delegated) ${citeSpec("s.10")}.`,
      `**7.3 Feedback.** Input is logged against the decision it was meant to influence. Where it cannot be adopted, the reason is returned. Silence is not a response.`,
    ),
    tables: [
      {
        caption: "Table 7.1. Participation framework and decision linkage",
        headers: ["Stakeholder", "Level", "Decision / design area", "How input is considered"],
        rows: plan.participationObjectives.map((row) => [
          row.stakeholderCategory,
          row.participationLevel,
          row.decisionOrDesignArea,
          row.howInputWillBeConsidered.slice(0, 140),
        ]),
      },
    ],
  };

  const s8: RenderedSection = {
    body: para(
      `**8.1 Social risk.** Each material risk records issue, cause, affected groups, rating, early-warning trigger, mitigation, participation response, owner and evidence ${citeSpec("s.7.1, s.15")}.`,
      plan.socialContext.opportunities.length
        ? `**8.2 Opportunity.** ${plan.socialContext.opportunities.map((row) => row.description).join("; ")} Required conditions: ${plan.socialContext.opportunities.flatMap((row) => row.requiredConditions).slice(0, 4).join("; ")}.`
        : `**8.2 Opportunity.** No local-content opportunity is claimed beyond what the tender states.`,
      `*Table 8.1. Social risk register (this draft)*`,
    ),
    tables: [
      {
        caption: "Table 8.1. Social risks, ratings and owners",
        headers: ["Issue", "Who is affected", "Rating", "Mitigation", "Owner"],
        rows: plan.risks.map((row) => [
          row.issue,
          row.affectedStakeholders.join("; "),
          row.riskRating,
          row.mitigation.slice(0, 120),
          row.owner,
        ]),
      },
    ],
  };

  const s9: RenderedSection = {
    body: para(
      `**9.1 Selection rule.** Methods are chosen because of identified project needs, not as decoration ${citeSpec("s.3, s.9")}. The three families stored in the method library are PRA, PLA and CBPR ${citeFramework("s.3")}.`,
      `**9.2 PRA.** ${METHOD_LIBRARY.pra.primaryRole}. ${METHOD_LIBRARY.pra.selectionCriteria} ${citeFramework("s.3.1")}.`,
      `**9.3 PLA.** ${METHOD_LIBRARY.pla.primaryRole}. ${METHOD_LIBRARY.pla.selectionCriteria} ${citeFramework("s.1, s.3")}.`,
      `**9.4 CBPR.** ${METHOD_LIBRARY.cbpr.primaryRole}. ${METHOD_LIBRARY.cbpr.selectionCriteria} ${citeFramework("s.3")}.`,
      `**9.5 Record.** TrustLedger holds the record of engagements, promises and grievances. Social Licence to Build (SL2B) is a sequencing frame only. They are tools, not a protocol annex.`,
    ),
    tables: [
      {
        caption: "Table 9.1. Method selections for this assignment",
        headers: ["Method", "Selected for", "Rationale", "Expected output"],
        rows: plan.methods.map((row) => [
          row.methodology.toUpperCase(),
          row.selectedForObjective.slice(0, 80),
          row.selectionRationale.slice(0, 140),
          row.expectedOutputs[0] || "",
        ]),
      },
    ],
  };

  const s10: RenderedSection = {
    body: para(
      `**10.1 Design.** Engagement is sequenced from this assignment’s classification (displacement, sector, research intensity), not from a single standing calendar ${citeFramework("s.1")}; ${citeSpec("s.11")}.`,
      `**10.2 Rule.** Each activity has a purpose, method, output and decision linkage. Activities that do not change a decision are not scheduled as participation ${citeSpec("s.11")}.`,
    ),
  };

  const s11: RenderedSection = {
    body: para(
      `**11.1 Programme.** Table 11.1 is the community participation programme generated for this tender. Timing is stated as months of the contract; calendar dates inside a month remain TBC at inception.`,
    ),
    tables: [
      {
        caption: "Table 11.1. Community participation programme",
        headers: ["Activity", "Purpose", "Method", "Output", "Decision linkage", "Timing", "Owner"],
        rows: plan.activities.map((row) => [
          row.activityName,
          row.purpose.slice(0, 90),
          row.method,
          row.expectedOutput.slice(0, 80),
          row.decisionLinkage.slice(0, 90),
          row.plannedDate || row.trigger,
          row.owner,
        ]),
      },
    ],
  };

  const s12: RenderedSection = {
    body: para(
      `**12.1 Safeguard.** “The community” is not treated as a homogeneous group. Those absent from participatory processes may include the poorest and most disadvantaged ${citeFramework("s.22")}.`,
      `**12.2 Alternatives.** Home visits, separate focus groups, daylight timing, oral briefing and accessible venues are used where a hall meeting will not reach. Languages of the project area are TBC at inception.`,
      `See Table 5.1 for groups and barriers identified on this draft.`,
    ),
  };

  const s13: RenderedSection = {
    body: para(
      `**13.1 Requirement.** Each audience has a message, channel, language/accessibility, frequency, owner and evidence of receipt ${citeSpec("s.13")}.`,
      `**13.2 Verification.** Receipt is verified by attendance register or written acknowledgement — not by assuming a notice was seen.`,
    ),
    tables: [
      {
        caption: "Table 13.1. Communication plan",
        headers: ["Audience", "Core message", "Channels", "Language / access", "Frequency", "Owner"],
        rows: plan.communications.map((row) => [
          row.audience,
          row.messageCore.slice(0, 100),
          row.channels.join("; "),
          row.language,
          row.frequency,
          row.owner,
        ]),
      },
    ],
  };

  const s14: RenderedSection = {
    body: para(
      `**14.1 Mechanism.** One mechanism handles all project-related complaints. Acknowledgement standard: 48 hours. Closure requires that the complainant is informed and evidence is on file ${citeSpec("s.14")}.`,
      `**14.2 Channels.** ${plan.grievanceFramework.lodgementChannels.map((row) => row.channel).join("; ")}. Repeated-issue threshold: ${plan.grievanceFramework.trendMonitoring.repeatedIssueThreshold} similar complaints are treated as a programme risk ${citeSpec("s.15")}.`,
    ),
    tables: [
      {
        caption: "Table 14.1. Grievance workflow",
        headers: ["Stage", "Function", "Role", "Service level", "Evidence"],
        rows: plan.grievanceFramework.stages.map((row) => [
          row.stage,
          row.function.slice(0, 120),
          row.responsibleRole,
          row.serviceLevel || "—",
          row.evidence,
        ]),
      },
    ],
  };

  const s15: RenderedSection = {
    body: para(
      `**15.1 Early warning.** Observable triggers are required for material risks. When a trigger fires, the related activity pauses long enough to brief the client and the people affected ${citeSpec("s.15")}.`,
    ),
    tables: [
      {
        caption: "Table 15.1. Early-warning triggers",
        headers: ["Risk", "Early-warning trigger", "Monitoring indicator", "Participation response"],
        rows: plan.risks.map((row) => [
          row.issue,
          row.earlyWarningTrigger,
          row.monitoringIndicator || "—",
          row.participationResponse.slice(0, 120),
        ]),
      },
    ],
  };

  const s16: RenderedSection = {
    body: para(
      plan.socialContext.opportunities.length
        ? `**16.1 Local economic participation.** Measures follow what the tender actually requires. Employment numbers, package values and SMME quotas are not invented ${citeSpec("s.3")}.`
        : `**16.1 Local economic participation.** The tender does not state a local-content quota. This plan therefore does not promise jobs, set-asides or package values.`,
      `**16.2 Livelihood restoration.** Where displacement is stated, pathways are ranked with households after validated enumeration. Restoration is not a slogan and not a number invented for this document.`,
    ),
  };

  const types = ["input", "process", "output", "outcome"] as const;
  const s17: RenderedSection = {
    body: para(
      `**17.1 Levels.** Input (were resources available?), process (did engagement occur?), output (what did it produce?), outcome (did it change something?) ${citeSpec("s.16")}.`,
      `**17.2 Unknowns.** Where baseline or target is unknown, it is marked TBC rather than invented ${citeSpec("s.16")}.`,
    ),
    tables: [
      {
        caption: "Table 17.1. Selected indicators",
        headers: ["Type", "Indicator", "Definition", "Frequency", "Evidence", "Owner"],
        rows: types.flatMap((type) =>
          plan.indicators
            .filter((row) => row.indicatorType === type)
            .slice(0, 3)
            .map((row) => [
              row.indicatorType,
              row.indicatorName.slice(0, 80),
              row.definition.slice(0, 100),
              row.frequency,
              row.evidenceSource.slice(0, 60),
              row.owner,
            ]),
        ),
      },
    ],
  };

  const s18: RenderedSection = {
    body: para(
      `**18.1 Monthly.** Progress report from records: activities held or adapted, grievance log extract, commitment register extract, TBC items still open. Recipient: ${tender.reportingRequirements.recipients?.join(", ") || client}. Format: ${tender.reportingRequirements.formats?.join(", ") || "written report"}.`,
      `**18.2 Decision gates.** Decision log returned to the group whose input was sought.`,
      `**18.3 Close-out.** Handover pack: registers, open grievances, unfulfilled commitments. Nothing is closed on paper to make a timeline look clean.`,
    ),
  };

  const owners = [...new Set(plan.activities.map((row) => row.owner))];
  const s19: RenderedSection = {
    body: para(
      `**19.1 Functions.** Roles below are functions, not invented personal names ${citeSpec("s.3")}.`,
    ),
    tables: [
      {
        caption: "Table 19.1. Roles and responsibilities",
        headers: ["Role", "Accountable for"],
        rows: [
          ["Plan Owner / Social Performance Lead", "Decision log, commitment register, client reporting, escalation"],
          ["Facilitation Lead", "PRA/PLA sessions, inclusion adjustments, map validation"],
          ["Community liaison", "Day-to-day contact, grievance lodgement and acknowledgement, notices"],
          ["Livelihood lead (if displacement is stated)", "Seasonal calendars, restoration ranking after enumeration"],
          ...owners
            .filter((row) => !/plan owner|facilitation|CLO|livelihood|liaison/i.test(row))
            .map((row) => [row, "As assigned on the activity register"]),
        ],
      },
    ],
  };

  const s20: RenderedSection = {
    body: para(
      `**20.1 Horizon.** Activities are not planned beyond the tender duration ${citeSpec("s.20 — schedule realism")}. Calendar dates inside a month remain TBC at inception.`,
    ),
    tables: [
      {
        caption: "Table 20.1. Implementation schedule",
        headers: ["Timing", "Activity", "Trigger", "Dependencies"],
        rows: plan.activities.map((row) => [
          row.plannedDate || row.trigger,
          row.activityName,
          row.trigger,
          row.informationNeeded.slice(0, 2).join("; "),
        ]),
      },
    ],
  };

  const s21: RenderedSection = {
    body: para(
      `**21.1 Capacity.** A Plan Owner, a facilitator competent in the selected methods, a community liaison and a recorder are required before first public activity. Names, curricula vitae and fee rates are a commercial submission, not invented here.`,
      `**21.2 Budget.** Participation costs (transport, venues, translation, childcare where required) are TBC in the financial proposal. This document does not fabricate a budget line ${citeSpec("s.3")}.`,
    ),
  };

  const s22: RenderedSection = {
    body: para(
      `**22.1 Evidence types.** Attendance (disaggregated), consent, maps, ranking sheets, decision logs, grievance records, photographs only with consent, and the commitment register ${citeSpec("s.17")}; ${citeFramework("s.24")}.`,
      `**22.2 Personal information.** Minimised to what enumeration and grievance handling require. Not published in public reports.`,
      `**22.3 Provenance labels.** Tender fact; professional inference; proposed methodology; to be confirmed.`,
    ),
  };

  const s23: RenderedSection = {
    body: para(
      `**23.1 Tests.** Automated quality assurance is run against the tests in Specification s.20.`,
      `**23.2 Result on this draft.** ${qa.passed} pass; ${qa.warnings} warning; ${qa.failures} fail. Ready for approval (no high/critical blockers): ${qa.readyForApproval ? "yes" : "no"}.`,
      qa.blockers.length
        ? `**23.3 Blockers.**\n${qa.blockers.map((row) => `- ${row.qaTest}: ${row.finding}`).join("\n")}`
        : `**23.3 Blockers.** None open on this draft.`,
      `The full QA report is Appendix K.`,
    ),
  };

  const s24: RenderedSection = {
    body: para(
      `**24.1 Assumptions.** The tender text is the fact base. Counterparts named in the tender exist and can be reached. Field conditions will differ; first-contact validation is the correction mechanism.`,
      `**24.2 Dependencies.** Client statement of what is negotiable; access to the project area; a decision-owner who can attend ranking; personal-information safeguards for enumeration.`,
      `**24.3 Limitations.** This draft is not field-confirmed. It does not guarantee consent, statutory approval or livelihood outcomes. It is not legal advice. Languages, exact sites and household counts remain TBC until validated ${citeSpec("s.3")}.`,
    ),
  };

  const s25: RenderedSection = {
    body: para(
      `This SEP is the method for running participation on **${title}** over ${duration} at ${place}, prepared for **${client}** by **${org}**. Participation levels and decision linkage are stated in Section 7. One grievance mechanism will acknowledge complaints within 48 hours.`,
      `Approval of this draft means the procuring entity accepts the decision-linkage rules and the TBC list — not that field facts have already been collected.`,
    ),
  };

  return [s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15, s16, s17, s18, s19, s20, s21, s22, s23, s24, s25];
}

export function renderAcademicAppendices(plan: SepGenerationPlan): RenderedSection[] {
  return [
    {
      body: para("Stakeholder register generated from tender analysis. Representation not yet validated."),
      tables: [
        {
          caption: "Table A.1. Stakeholder register",
          headers: ["ID", "Name", "Type", "Influence", "Level", "Validated?"],
          rows: plan.stakeholders.map((row) => [
            row.id,
            row.nameOrCategory,
            row.stakeholderType,
            row.influence,
            row.participationLevel,
            row.representation.representationValidated ? "yes" : "not yet",
          ]),
        },
      ],
    },
    {
      body: para("Engagement matrix for this assignment."),
      tables: [
        {
          caption: "Table B.1. Engagement matrix",
          headers: ["ID", "Activity", "Method", "Output", "Records"],
          rows: plan.activities.map((row) => [
            row.id,
            row.activityName,
            row.method,
            row.expectedOutput.slice(0, 80),
            row.requiredRecords.join("; "),
          ]),
        },
      ],
    },
    {
      body: para("Risk register."),
      tables: [
        {
          caption: "Table C.1. Risk register",
          headers: ["ID", "Issue", "Likelihood", "Severity", "Trigger", "Owner", "Status"],
          rows: plan.risks.map((row) => [
            row.id,
            row.issue,
            row.likelihood,
            row.severity,
            row.earlyWarningTrigger.slice(0, 80),
            row.owner,
            row.status,
          ]),
        },
      ],
    },
    {
      body: para("Grievance workflow and lodgement channels."),
      tables: [
        {
          caption: "Table D.1. Stages",
          headers: ["Stage", "Function", "SLA", "Evidence"],
          rows: plan.grievanceFramework.stages.map((row) => [
            row.stage,
            row.function.slice(0, 140),
            row.serviceLevel || "—",
            row.evidence,
          ]),
        },
        {
          caption: "Table D.2. Channels",
          headers: ["Channel", "Accessibility", "Recording"],
          rows: plan.grievanceFramework.lodgementChannels.map((row) => [
            row.channel,
            row.accessibility,
            row.recordingMethod,
          ]),
        },
      ],
    },
    {
      body: para("Participation tools selected for this assignment."),
      tables: [
        {
          caption: "Table E.1. Tools",
          headers: ["Method", "Tool", "Objective", "Evidence required"],
          rows: plan.methods.map((row) => [
            row.methodology.toUpperCase(),
            row.tool || "—",
            row.selectedForObjective.slice(0, 80),
            row.evidenceRequirements.join("; "),
          ]),
        },
      ],
    },
    {
      body: para("Full indicator list."),
      tables: [
        {
          caption: "Table F.1. Indicators",
          headers: ["ID", "Type", "Name", "Target", "Evidence", "Owner"],
          rows: plan.indicators.map((row) => [
            row.id,
            row.indicatorType,
            row.indicatorName.slice(0, 80),
            row.target || "—",
            row.evidenceSource.slice(0, 60),
            row.owner,
          ]),
        },
      ],
    },
    {
      body: para(
        "**G.1 Monthly progress report (minimum contents).** Period; activities completed or adapted; attendance (disaggregated); grievances opened/closed/overdue; commitments due/overdue; TBC items still open; decisions taken because of participation.",
        "**G.2 Consultation record fields.** Date; place; groups present; purpose; method; outputs; decision linkage; absences / inclusion gaps; next contact.",
      ),
    },
    {
      body: para(
        "Consultation records are opened when the first activity is held. This draft therefore contains the template, not invented minutes.",
      ),
    },
    {
      body: para("Standing commitments generated from tender requirements."),
      tables: [
        {
          caption: "Table I.1. Commitment register",
          headers: ["ID", "Commitment", "Owner", "Evidence", "Status"],
          rows: plan.commitments.map((row) => [
            row.id,
            row.commitmentText.slice(0, 140),
            row.owner,
            row.requiredEvidence.join("; "),
            row.status,
          ]),
        },
      ],
    },
    {
      body: para("Complete compliance matrix."),
      tables: [
        {
          caption: "Table J.1. Compliance matrix",
          headers: ["ID", "Requirement", "Response", "Evidence", "Status"],
          rows: plan.complianceMatrix.map((row) => [
            row.id,
            row.tenderRequirement.slice(0, 100),
            row.sepResponse.slice(0, 100),
            (row.evidence || []).slice(0, 3).join("; "),
            row.status,
          ]),
        },
      ],
    },
    {
      body: para("Automated quality-assurance findings."),
      tables: [
        {
          caption: "Table K.1. QA report",
          headers: ["Test", "Result", "Finding", "Remediation"],
          rows: plan.qaResults.map((row) => [
            row.qaTest,
            row.result,
            row.finding.slice(0, 120),
            (row.remediation || "—").slice(0, 100),
          ]),
        },
      ],
    },
    {
      body: para(
        "Only the following sources are used. The method library is not expanded from informal or invented material (Specification s.25).",
        referencesBlock(),
      ),
    },
  ];
}
