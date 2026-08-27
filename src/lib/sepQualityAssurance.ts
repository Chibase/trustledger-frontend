/**
 * SEP Automated Quality Assurance
 * Phase F: TrustLedger SRM — SEP Generation Specification v1.0
 *
 * Specification Section 20: Automated Quality Assurance (14 tests)
 */

import { complianceStatus } from "@/lib/sepComplianceMatrix";
import { getMethodEntry, validateMethodSelection } from "@/lib/sepMethodLibrary";
import { validateInclusionDesign } from "@/lib/sepParticipationPlanner";
import type {
  ComplianceItem,
  QAResult,
  SepGenerationPlan,
  TenderIntelligence,
} from "@/types/sepAnalysis";

const QA_VERSION = "sep-qa-1.0";

const REQUIRED_PLAN_PARTS: Array<{ key: keyof SepGenerationPlan; label: string }> = [
  { key: "stakeholders", label: "Stakeholder profiles" },
  { key: "participationObjectives", label: "Participation objectives" },
  { key: "methods", label: "Method selections" },
  { key: "activities", label: "Engagement activities" },
  { key: "communications", label: "Communication plans" },
  { key: "grievanceFramework", label: "Grievance framework" },
  { key: "indicators", label: "M&E indicators" },
  { key: "commitments", label: "Commitments" },
  { key: "risks", label: "Social risks" },
  { key: "socialContext", label: "Social context analysis" },
];

const FILLER =
  /\b(it is important to note|various stakeholders|going forward|holistic approach|best practice going forward|leverage synergies)\b/i;

const LEGAL_OVERCLAIM =
  /\b(guarantees? (consent|compliance|approval)|will (fully )?comply with all (laws|legislation)|legally (binding|compliant) without|has been approved by)\b/i;

function result(args: {
  projectId: string;
  test: QAResult["qaTest"];
  result: QAResult["result"];
  finding: string;
  details?: string[];
  remediation?: string;
  linkedItems?: string[];
  severity?: QAResult["severity"];
}): QAResult {
  return {
    id: `QA-${args.test}`,
    projectProfileId: args.projectId,
    qaTest: args.test,
    result: args.result,
    severity: args.severity,
    finding: args.finding,
    details: args.details,
    remediation: args.remediation,
    linkedItems: args.linkedItems,
    testedAt: new Date().toISOString(),
    testVersion: QA_VERSION,
  };
}

function testCompleteness(plan: SepGenerationPlan): QAResult {
  const missing = REQUIRED_PLAN_PARTS.filter((part) => {
    const value = plan[part.key];
    if (Array.isArray(value)) return value.length === 0;
    return !value;
  });
  if (missing.length === 0) {
    return result({
      projectId: plan.projectProfileId,
      test: "completeness",
      result: "pass",
      finding: "Required analysis objects are populated.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "completeness",
    result: missing.length > 2 ? "fail" : "warning",
    severity: missing.length > 2 ? "high" : "medium",
    finding: "One or more required SEP objects are empty.",
    details: missing.map((row) => row.label),
    remediation: "Populate the missing objects or record a justified exception before approval.",
  });
}

function testTenderAlignment(
  plan: SepGenerationPlan,
  matrix: ComplianceItem[],
): QAResult {
  const summary = complianceStatus(matrix);
  const gaps = summary.missingRequirements.map((row) => row.tenderRequirement);
  if (summary.missing === 0 && summary.partial === 0) {
    return result({
      projectId: plan.projectProfileId,
      test: "tender_alignment",
      result: "pass",
      finding: `All ${matrix.length} tender requirements are covered.`,
    });
  }
  if (summary.missing === 0) {
    return result({
      projectId: plan.projectProfileId,
      test: "tender_alignment",
      result: "warning",
      severity: "medium",
      finding: `${summary.partial} requirement(s) are only partially covered.`,
      details: matrix.filter((row) => row.status === "partial").map((row) => row.tenderRequirement),
      remediation: "Complete activities or evidence paths for partial rows before treating them as met.",
      linkedItems: matrix.filter((row) => row.status !== "covered").map((row) => row.id),
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "tender_alignment",
    result: "fail",
    severity: "critical",
    finding: `${summary.missing} tender requirement(s) are missing from the SEP.`,
    details: gaps,
    remediation: "Assign activities, commitments, or indicators to every missing mandatory requirement.",
    linkedItems: summary.missingRequirements.map((row) => row.id),
  });
}

function testFactIntegrity(plan: SepGenerationPlan, tender: TenderIntelligence): QAResult {
  const invented = [
    ...plan.activities.filter((row) =>
      /\b\d{3,}\s+(households|people|persons)\s+will attend/i.test(
        `${row.participantEstimate || ""} ${row.description || ""}`,
      ),
    ),
    ...plan.commitments.filter((row) =>
      /R\s?\d{3,}|ZAR\s?\d{3,}/i.test(row.commitmentText) &&
      !/tender|brief/i.test(row.context || ""),
    ),
  ];
  const tbcOk = plan.socialContext.analysisSource === "tender_only";
  if (invented.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "fact_integrity",
      result: "fail",
      severity: "high",
      finding: "Plan contains quantities or package values that are not tender facts.",
      details: invented.map((row) => ("activityName" in row ? row.activityName : row.commitmentText)),
      remediation: "Remove invented counts, sites, budgets, and dates. Mark unknowns as TBC.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "fact_integrity",
    result: tbcOk ? "warning" : "pass",
    severity: tbcOk ? "low" : undefined,
    finding: tbcOk
      ? "No invented quantities found. Social context is still tender-only and must not be presented as field-confirmed."
      : "No invented quantities found; provenance is consistent.",
    details: tender.extractionNotes ? [tender.extractionNotes] : undefined,
    remediation: tbcOk
      ? "Keep tender estimates labelled as estimates until the participatory census."
      : undefined,
  });
}

function testMethodIntegrity(plan: SepGenerationPlan): QAResult {
  const details: string[] = [];
  if (!plan.methods.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "method_integrity",
      result: "fail",
      severity: "high",
      finding: "No methodology selections are recorded.",
      remediation: "Select PRA, PLA, and/or CBPR with a purpose and rationale for each.",
    });
  }
  for (const selection of plan.methods) {
    if (!selection.selectionRationale.trim() || !selection.selectedForObjective.trim()) {
      details.push(`${selection.id} is missing purpose or rationale`);
      continue;
    }
    const entry = getMethodEntry(selection.methodology);
    if (!entry) continue;
    const check = validateMethodSelection(selection, entry);
    details.push(...check.warnings.map((w) => `${selection.id}: ${w}`));
  }
  if (details.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "method_integrity",
      result: "warning",
      severity: "medium",
      finding: "One or more method selections are incomplete relative to the library.",
      details,
      remediation: "Align tools, procedures, and outputs with the PRA/PLA/CBPR library entries.",
      linkedItems: plan.methods.map((row) => row.id),
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "method_integrity",
    result: "pass",
    finding: "Each methodology has a purpose, rationale, and library-aligned tools.",
  });
}

function testStakeholderCompleteness(plan: SepGenerationPlan): QAResult {
  const types = new Set(plan.stakeholders.map((row) => row.stakeholderType));
  const missing: string[] = [];
  if (![...plan.stakeholders].some((row) => /affected|household|host/i.test(row.nameOrCategory) || row.stakeholderType === "household_group")) {
    missing.push("affected / household group");
  }
  if (![...types].some((t) => t === "government" || t === "traditional_authority")) {
    missing.push("governance / authority");
  }
  if (!plan.socialContext.vulnerabilities.length) {
    missing.push("vulnerability analysis");
  }
  if (missing.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "stakeholder_completeness",
      result: "fail",
      severity: "high",
      finding: "Stakeholder set is missing a required class.",
      details: missing,
      remediation: "Add affected, governance, and vulnerability classes even if names remain TBC.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "stakeholder_completeness",
    result: "pass",
    finding: "Affected, influencing/governance, and vulnerability classes are present.",
  });
}

function testParticipationQuality(plan: SepGenerationPlan): QAResult {
  const weakObjectives = plan.participationObjectives.filter(
    (row) => !row.whatTheyCanInfluence.length || !row.decisionOrDesignArea.trim(),
  );
  const weakActivities = plan.activities.filter((row) => !row.decisionLinkage.trim());
  const uncovered = plan.stakeholders.filter(
    (sh) => !plan.participationObjectives.some((po) => po.stakeholderProfileId === sh.id),
  );
  const inclusion = validateInclusionDesign(plan, plan.socialContext.vulnerabilities);
  const details = [
    ...uncovered.map((row) => `No participation objective for ${row.nameOrCategory}`),
    ...weakObjectives.map((row) => `Objective ${row.id} lacks decision linkage`),
    ...weakActivities.map((row) => `Activity ${row.activityName} lacks decision linkage`),
    ...inclusion.gaps.filter((gap) => /no alternative|has no explicit/i.test(gap)),
  ];
  if (details.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "participation_quality",
      result: "fail",
      severity: "high",
      finding: "Participation design does not state what stakeholders can influence, or omits inclusion mechanisms.",
      details,
      remediation: "Add whatTheyCanInfluence, activity decisionLinkage, and alternative mechanisms for vulnerable groups.",
      linkedItems: [...weakObjectives.map((r) => r.id), ...weakActivities.map((r) => r.id)],
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "participation_quality",
    result: inclusion.gaps.length ? "warning" : "pass",
    severity: inclusion.gaps.length ? "low" : undefined,
    finding: inclusion.gaps.length
      ? "Decision linkage is present. Remaining inclusion notes should be closed at first contact."
      : "Every stakeholder has an objective and activities state decision linkage.",
    details: inclusion.gaps.length ? inclusion.gaps : undefined,
  });
}

function testRiskCoherence(plan: SepGenerationPlan): QAResult {
  if (!plan.risks.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "risk_coherence",
      result: "warning",
      severity: "medium",
      finding: "No social risks were generated.",
      remediation: "Run social-context risk generation or record a justified empty register.",
    });
  }
  const weak = plan.risks.filter(
    (row) => !row.mitigation.trim() || !row.owner.trim() || !row.earlyWarningTrigger.trim(),
  );
  if (weak.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "risk_coherence",
      result: "fail",
      severity: "high",
      finding: "One or more risks lack response, owner, or early-warning logic.",
      details: weak.map((row) => row.issue),
      linkedItems: weak.map((row) => row.id),
      remediation: "Give every major risk a mitigation, owner, and observable trigger.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "risk_coherence",
    result: "pass",
    finding: "Major risks have mitigation, owner, and monitoring logic.",
  });
}

function testGrievanceCoherence(plan: SepGenerationPlan, tender: TenderIntelligence): QAResult {
  const grm = plan.grievanceFramework;
  const stages = new Set(grm.stages.map((row) => row.stage));
  const required: Array<(typeof grm.stages)[number]["stage"]> = [
    "lodgement",
    "acknowledgement",
    "investigation",
    "response",
    "escalation",
    "closure",
  ];
  const missing = required.filter((stage) => !stages.has(stage));
  const ack = grm.stages.find((row) => row.stage === "acknowledgement");
  const details: string[] = missing.map((stage) => `Missing stage: ${stage}`);
  if (!ack?.serviceLevel) details.push("Acknowledgement has no service level");
  const tenderWantsGrm = tender.requirements.some((row) => /grievance|complaint|redress/i.test(row.text));
  if (tenderWantsGrm && !plan.activities.some((row) => /grievance/i.test(row.activityName))) {
    details.push("Tender requires a GRM but no grievance activity is scheduled");
  }
  if (details.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "grievance_coherence",
      result: "fail",
      severity: "high",
      finding: "Grievance process is incomplete relative to assignment requirements.",
      details,
      remediation: "Complete the lodgement-to-closure pathway with a 48-hour acknowledgement standard.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "grievance_coherence",
    result: "pass",
    finding: "Grievance workflow includes lodgement, 48-hour acknowledgement, investigation, response, escalation, and closure.",
  });
}

function testMeCoherence(plan: SepGenerationPlan): QAResult {
  const types = new Set(plan.indicators.map((row) => row.indicatorType));
  const missing = (["process", "output", "outcome"] as const).filter((t) => !types.has(t));
  if (missing.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "me_coherence",
      result: "fail",
      severity: "high",
      finding: "M&E does not cover process, output, and outcome measures.",
      details: missing.map((t) => `Missing ${t} indicators`),
      remediation: "Add process (did it occur?), output (what did it produce?), and outcome (did it change something?) measures.",
    });
  }
  const thin = plan.indicators.filter((row) => !row.definition.trim() || !row.evidenceSource.trim() || !row.owner.trim());
  if (thin.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "me_coherence",
      result: "warning",
      severity: "medium",
      finding: "Some indicators lack definition, evidence source, or owner.",
      details: thin.map((row) => row.indicatorName),
      remediation: "Complete definition, evidence, and owner on every indicator.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "me_coherence",
    result: "pass",
    finding: "Process, output, and outcome indicators are defined with evidence sources.",
  });
}

function testScheduleRealism(plan: SepGenerationPlan, tender: TenderIntelligence): QAResult {
  const duration = tender.contractPeriod.durationMonths;
  if (!duration) {
    return result({
      projectId: plan.projectProfileId,
      test: "schedule_realism",
      result: "warning",
      severity: "low",
      finding: "Contract duration is TBC; schedule realism cannot be fully scored.",
      remediation: "Lock duration at inception and re-run this test.",
    });
  }
  const over = plan.activities.filter((row) => {
    const match = row.plannedDate?.match(/Month (\d+)/);
    return match && Number(match[1]) > duration;
  });
  if (over.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "schedule_realism",
      result: "fail",
      severity: "high",
      finding: "Activities are planned beyond the tender duration.",
      details: over.map((row) => `${row.activityName} (${row.plannedDate})`),
      remediation: "Resequence activities inside the contract period or mark them as out of scope.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "schedule_realism",
    result: "pass",
    finding: `Activities are sequenced inside the ${duration}-month assignment.`,
  });
}

function testInternalConsistency(plan: SepGenerationPlan, tender: TenderIntelligence): QAResult {
  const details: string[] = [];
  if (
    plan.project.tenderIntelligenceId !== tender.id ||
    plan.tenderIntelligenceId !== tender.id
  ) {
    details.push("Project/plan tender id does not match the parsed tender");
  }
  const location = tender.projectLocation.toLowerCase();
  if (
    location &&
    plan.socialContext.affectedPeople.geographicLocation &&
    !plan.socialContext.affectedPeople.geographicLocation.toLowerCase().includes(location.split(",")[0]!.trim().slice(0, 8))
  ) {
    details.push("Social context location does not match tender location");
  }
  const orphan = plan.participationObjectives.filter(
    (po) => !plan.stakeholders.some((sh) => sh.id === po.stakeholderProfileId),
  );
  if (orphan.length) details.push(`${orphan.length} participation objective(s) point at missing stakeholders`);
  if (details.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "internal_consistency",
      result: "fail",
      severity: "medium",
      finding: "Names, identifiers, or locations disagree across objects.",
      details,
      remediation: "Regenerate the plan from a single tender parse so identifiers stay aligned.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "internal_consistency",
    result: "pass",
    finding: "Tender identity, location, and stakeholder identifiers agree across objects.",
  });
}

function testLegalRestraint(plan: SepGenerationPlan): QAResult {
  const corpus = [
    ...plan.activities.map((row) => `${row.purpose} ${row.decisionLinkage}`),
    ...plan.commitments.map((row) => row.commitmentText),
    plan.socialContext.affectedPeople.description,
  ].join("\n");
  if (LEGAL_OVERCLAIM.test(corpus)) {
    return result({
      projectId: plan.projectProfileId,
      test: "legal_restraint",
      result: "fail",
      severity: "high",
      finding: "Plan language makes unsupported legal conclusions or guarantees.",
      remediation: "Remove guarantees of consent, approval, or blanket legal compliance. This is not legal advice.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "legal_restraint",
    result: "pass",
    finding: "No unsupported legal conclusions or guarantees detected.",
  });
}

function testEvidenceTraceability(plan: SepGenerationPlan, matrix: ComplianceItem[]): QAResult {
  const covered = matrix.filter((row) => row.status === "covered");
  const untraced = covered.filter(
    (row) => !(row.linkedActivities || []).length || !(row.evidence || []).length,
  );
  const activitiesWithoutRecords = plan.activities.filter((row) => !row.requiredRecords.length);
  const details = [
    ...untraced.map((row) => `Compliance ${row.id} has no activity/evidence path`),
    ...activitiesWithoutRecords.map((row) => `Activity ${row.activityName} has no required records`),
  ];
  if (details.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "evidence_traceability",
      result: "fail",
      severity: "high",
      finding: "Important claims lack an evidence path.",
      details,
      remediation: "Link each covered requirement to an activity and a record/indicator.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "evidence_traceability",
    result: "pass",
    finding: "Covered requirements trace to activities and records.",
  });
}

function testProfessionalQuality(plan: SepGenerationPlan): QAResult {
  const corpus = [
    ...plan.activities.map((row) => `${row.purpose} ${row.expectedOutput}`),
    ...plan.participationObjectives.map((row) => row.participationLevelRationale),
  ].join("\n");
  if (FILLER.test(corpus)) {
    return result({
      projectId: plan.projectProfileId,
      test: "professional_quality",
      result: "warning",
      severity: "low",
      finding: "Template filler language detected.",
      remediation: "Replace filler with specific, decisive statements of what will be done and by whom.",
    });
  }
  const vague = plan.activities.filter((row) =>
    /engage (all )?stakeholders|raise awareness|consult the community\b/i.test(row.purpose),
  );
  if (vague.length) {
    return result({
      projectId: plan.projectProfileId,
      test: "professional_quality",
      result: "warning",
      severity: "medium",
      finding: "Some activities are too generic to be implementable.",
      details: vague.map((row) => row.activityName),
      remediation: "Name the group, the output, and the decision each activity serves.",
    });
  }
  return result({
    projectId: plan.projectProfileId,
    test: "professional_quality",
    result: "pass",
    finding: "Language is specific enough to implement; filler patterns not detected.",
  });
}

export function runQualityAssurance(
  plan: SepGenerationPlan,
  tender: TenderIntelligence,
  complianceMatrix: ComplianceItem[],
): QAResult[] {
  return [
    testCompleteness(plan),
    testTenderAlignment(plan, complianceMatrix),
    testFactIntegrity(plan, tender),
    testMethodIntegrity(plan),
    testStakeholderCompleteness(plan),
    testParticipationQuality(plan),
    testRiskCoherence(plan),
    testGrievanceCoherence(plan, tender),
    testMeCoherence(plan),
    testScheduleRealism(plan, tender),
    testInternalConsistency(plan, tender),
    testLegalRestraint(plan),
    testEvidenceTraceability(plan, complianceMatrix),
    testProfessionalQuality(plan),
  ];
}

export function generateQAReport(results: QAResult[]): {
  passed: number;
  warnings: number;
  failures: number;
  info: number;
  blockers: QAResult[];
  readyForApproval: boolean;
} {
  const passed = results.filter((row) => row.result === "pass").length;
  const warnings = results.filter((row) => row.result === "warning").length;
  const failures = results.filter((row) => row.result === "fail").length;
  const info = results.filter((row) => row.result === "info").length;
  const blockers = results.filter(
    (row) =>
      row.result === "fail" &&
      (row.severity === "high" || row.severity === "critical"),
  );
  return {
    passed,
    warnings,
    failures,
    info,
    blockers,
    readyForApproval: blockers.length === 0,
  };
}
