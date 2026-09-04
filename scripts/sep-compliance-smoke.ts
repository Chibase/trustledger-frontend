/**
 * SEP Compliance Matrix — Smoke Tests
 * Phase D: Method library + tender requirement mapping
 *
 * Baseline: Relocation and Migration Plan (Specification Section 22)
 */

import { parseTender } from "../src/lib/sepTenderParser";
import { buildProjectProfileFromTender } from "../src/lib/sepSocialContextAnalysis";
import {
  METHOD_LIBRARY,
  selectMethodsForObjective,
  validateMethodSelection,
} from "../src/lib/sepMethodLibrary";
import {
  buildComplianceMatrix,
  complianceStatus,
  flagComplianceGaps,
} from "../src/lib/sepComplianceMatrix";
import { RELOCATION_TENDER_FIXTURE } from "./sep-tender-parser-smoke";
import type {
  EngagementActivity,
  Indicator,
  SepGenerationPlan,
} from "../src/types/sepAnalysis";

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

function coveringPlan(projectId: string, now: string): Pick<
  SepGenerationPlan,
  | "id"
  | "projectProfileId"
  | "activities"
  | "indicators"
  | "commitments"
  | "grievanceFramework"
  | "communications"
> {
  const activities: EngagementActivity[] = [
    {
      id: "ACT-MAP",
      projectProfileId: projectId,
      activityName: "Stakeholder identification and mapping workshop",
      purpose: "Structured consultation to identify and map project-affected households and authorities",
      trigger: "Inception",
      targetedStakeholders: ["PAH", "Municipality"],
      method: "PRA social mapping",
      tools: ["mapping", "ranking"],
      informationNeeded: ["tender stakeholder list"],
      facilitationApproach: "Visual group mapping with separate vulnerable-group check",
      expectedOutput: "Validated stakeholder map",
      decisionLinkage: "Map used to tailor engagement methods per group",
      owner: "Facilitation Lead",
      requiredRecords: ["attendance register", "signed map"],
      status: "planned",
      createdAt: now,
      plannedEvidence: "proposed_methodology",
    },
    {
      id: "ACT-CENSUS",
      projectProfileId: projectId,
      activityName: "Participatory census of affected households",
      purpose: "Co-produce a household register for relocation, entitlements, and livelihood restoration",
      trigger: "After mapping",
      targetedStakeholders: ["PAH"],
      method: "CBPR participatory census",
      tools: ["participatory census"],
      informationNeeded: ["consent protocol"],
      facilitationApproach: "Household visits with community researchers",
      expectedOutput: "Validated household census (counts confirmed in the field, not invented)",
      decisionLinkage: "Census is the only basis for entitlements and restoration targeting",
      owner: "Social Performance Lead",
      requiredRecords: ["consent records", "census forms"],
      status: "planned",
      createdAt: now,
      plannedEvidence: "proposed_methodology",
    },
    {
      id: "ACT-OPT",
      projectProfileId: projectId,
      activityName: "Relocation options and entitlements consultation",
      purpose: "Stakeholder consultation on relocation options, entitlements, and host-community consent",
      trigger: "After census draft",
      targetedStakeholders: ["PAH", "Host community"],
      method: "PLA option ranking",
      tools: ["option ranking", "priority matrix"],
      informationNeeded: ["available options from client — no invented packages"],
      facilitationApproach: "Option ranking with explicit negotiable vs fixed items",
      expectedOutput: "Ranked relocation options and consent record",
      decisionLinkage: "Client cannot lock a relocation option that households have not ranked",
      owner: "Plan Owner",
      requiredRecords: ["decision log", "attendance register"],
      status: "planned",
      createdAt: now,
      plannedEvidence: "proposed_methodology",
    },
    {
      id: "ACT-LIVE",
      projectProfileId: projectId,
      activityName: "Livelihood restoration planning",
      purpose: "Economic displacement analysis and livelihood restoration planning with affected households",
      trigger: "In parallel with options consultation",
      targetedStakeholders: ["PAH"],
      method: "PRA seasonal calendars and ranking",
      tools: ["seasonal calendars", "ranking"],
      informationNeeded: ["census livelihood fields"],
      facilitationApproach: "Seasonal calendars then restoration pathway ranking",
      expectedOutput: "Livelihood restoration plan (pathways TBC until census)",
      decisionLinkage: "Restoration packages are not issued until households validate pathways",
      owner: "Livelihood Lead",
      requiredRecords: ["livelihood ranking sheets"],
      status: "planned",
      createdAt: now,
      plannedEvidence: "proposed_methodology",
    },
    {
      id: "ACT-GRM",
      projectProfileId: projectId,
      activityName: "Grievance mechanism co-design",
      purpose: "Establish one grievance mechanism for all project-related complaints",
      trigger: "Month 1–2",
      targetedStakeholders: ["PAH", "Host community", "Municipality"],
      method: "PLA action planning",
      tools: ["action planning"],
      informationNeeded: ["tender GRM requirement"],
      facilitationApproach: "Walk through lodgement channels including non-meeting routes",
      expectedOutput: "Agreed grievance workflow and service levels",
      decisionLinkage: "GRM design is not final until users confirm channels they can actually use",
      owner: "CLO",
      requiredRecords: ["GRM SOP", "channel map"],
      status: "planned",
      createdAt: now,
      plannedEvidence: "proposed_methodology",
    },
    {
      id: "ACT-VULN",
      projectProfileId: projectId,
      activityName: "Vulnerability assessment focus groups",
      purpose: "Evidence of vulnerability assessment and alternative engagement for excluded groups",
      trigger: "During mapping",
      targetedStakeholders: ["Women", "Elderly", "Disabled persons"],
      method: "PRA ranking",
      tools: ["ranking"],
      informationNeeded: ["access barriers"],
      facilitationApproach: "Separate sessions; home visits for mobility-limited people",
      expectedOutput: "Vulnerability matrix and access adjustments",
      decisionLinkage: "Engagement calendar cannot be issued until access adjustments are listed",
      owner: "Facilitation Lead",
      requiredRecords: ["disaggregated attendance", "access log"],
      status: "planned",
      createdAt: now,
      plannedEvidence: "proposed_methodology",
    },
    {
      id: "ACT-REP",
      projectProfileId: projectId,
      activityName: "Monthly progress reporting",
      purpose: "Monthly progress reports and documentation of all engagements",
      trigger: "Monthly",
      targetedStakeholders: ["Procuring entity"],
      method: "Written report from engagement records",
      tools: ["commitment register"],
      informationNeeded: ["attendance, minutes, GRM log"],
      facilitationApproach: "Compile evidence; no invented counts",
      expectedOutput: "Monthly progress report",
      decisionLinkage: "Reports are the evaluation evidence of methodology quality",
      owner: "Plan Owner",
      requiredRecords: ["monthly report", "meeting minutes"],
      status: "planned",
      createdAt: now,
      plannedEvidence: "proposed_methodology",
    },
  ];

  const indicators: Indicator[] = activities.map((activity, index) => ({
    id: `IND-${index + 1}`,
    projectProfileId: projectId,
    indicatorName: `${activity.activityName} completed`,
    indicatorType: "process",
    indicatorTypeExplanation: "Did the engagement occur?",
    definition: `Recorded completion of ${activity.activityName}`,
    measurementUnit: "yes/no plus evidence pack",
    baseline: "Not started",
    target: "Completed with required records",
    frequency: "per activity",
    evidenceSource: activity.requiredRecords[0] || "attendance register",
    dataCollectionMethod: "CLO compiles records after the activity",
    owner: activity.owner,
    linkedToEngagementActivity: activity.id,
    createdAt: now,
  }));

  return {
    id: "PLAN-COVER",
    projectProfileId: projectId,
    activities,
    indicators,
    commitments: [
      {
        id: "COM-1",
        projectProfileId: projectId,
        commitmentText: "Maintain a commitment register with evidence tracking",
        madeToStakeholder: "Procuring entity",
        madeByRole: "Plan Owner",
        action: "Operate a live register of promises, owners, due dates, and evidence",
        owner: "Plan Owner",
        requiredEvidence: ["commitment register"],
        verificationMethod: "Monthly extract to the progress report",
        status: "open",
        createdAt: now,
        lastUpdatedAt: now,
      },
    ],
    grievanceFramework: {
      id: "GRM-1",
      projectProfileId: projectId,
      stages: [
        {
          stage: "acknowledgement",
          function: "Acknowledge receipt",
          responsibleRole: "CLO",
          serviceLevel: "48 hours",
          evidence: "acknowledgement record",
        },
      ],
      lodgementChannels: [
        {
          channel: "walk-in",
          accessibility: "Project helpdesk",
          recordingMethod: "Issue log",
        },
      ],
      issueCategories: [
        {
          category: "livelihood loss",
          severity: "high",
          routingLogic: "Livelihood Lead within 5 days",
        },
      ],
      escalationRules: [
        {
          trigger: "unresolved after 30 days",
          escalateTo: "Plan Owner",
          escalationOwner: "CLO",
        },
      ],
      trendMonitoring: {
        repeatedIssueThreshold: 3,
        systemicRiskResponse: "Treat as a programme risk, not a single case",
      },
      createdAt: now,
    },
    communications: [
      {
        id: "COMMS-1",
        projectProfileId: projectId,
        audience: "Affected households",
        messageCore: "Relocation options will not be locked without consultation",
        messageKeyPoints: ["census first", "options ranking", "GRM channels"],
        channel: "community_meeting",
        channels: ["in-person", "notice board"],
        language: "Languages of the project area (TBC at inception)",
        frequency: "before each milestone",
        owner: "CLO",
        createdAt: now,
      },
    ],
  };
}

function main() {
  console.log("\n=== SEP Compliance + Method Library Smoke Tests (Phase D) ===\n");

  const tender = parseTender(RELOCATION_TENDER_FIXTURE);
  const project = buildProjectProfileFromTender(tender);
  const now = new Date().toISOString();

  check("tender requirements extracted", tender.requirements.length > 0, `n=${tender.requirements.length}`);
  check(
    "relocation title extracted",
    /relocation/i.test(tender.tenderTitle) || /relocation/i.test(tender.projectName),
    tender.tenderTitle,
  );
  check("duration is 6 months", tender.contractPeriod.durationMonths === 6);

  const pra = METHOD_LIBRARY.pra;
  const pla = METHOD_LIBRARY.pla;
  const cbpr = METHOD_LIBRARY.cbpr;
  check("PRA library entry present", pra.id === "pra" && pra.examples.includes("mapping"));
  check("PLA library entry present", pla.id === "pla" && pla.examples.includes("action planning"));
  check("CBPR library entry present", cbpr.id === "cbpr" && cbpr.examples.includes("participatory census"));

  const censusMethods = selectMethodsForObjective(
    "Co-produce a participatory census of affected households",
    [],
    { durationMonths: 6 },
  );
  check("census prefers CBPR first", censusMethods[0]?.methodology === "cbpr");
  const censusValidation = validateMethodSelection(censusMethods[0]!, cbpr);
  check("CBPR selection validates", censusValidation.valid, censusValidation.warnings.join("; "));

  const contextMethods = selectMethodsForObjective("Understand local conditions and livelihood systems", []);
  check("local conditions prefers PRA first", contextMethods[0]?.methodology === "pra");
  const praValidation = validateMethodSelection(contextMethods[0]!, pra);
  check("PRA selection validates", praValidation.valid, praValidation.warnings.join("; "));

  const planMethods = selectMethodsForObjective("Plan relocation options and host-community consent", []);
  check("planning prefers PLA first", planMethods[0]?.methodology === "pla");

  const badSelection = {
    ...contextMethods[0]!,
    tool: "randomised control trial",
    expectedOutputs: ["econometric paper"],
  };
  const bad = validateMethodSelection(badSelection, pra);
  check("invalid tool is flagged", !bad.valid && bad.warnings.length > 0);

  const plan = coveringPlan(project.id, now);
  const matrix = buildComplianceMatrix(tender, plan);
  const summary = complianceStatus(matrix);

  check("every requirement has a status", matrix.length === tender.requirements.length);
  check(
    "no requirement left without covered/partial/missing",
    matrix.every((row) => ["covered", "partial", "missing"].includes(row.status)),
  );
  check(
    "relocation covering plan has no MISSING rows",
    summary.missing === 0,
    `missing=${summary.missing} covered=${summary.covered} partial=${summary.partial}`,
  );
  check("at least one requirement is COVERED", summary.covered > 0);

  const evidencePath = matrix.filter((row) => row.status === "covered");
  check(
    "evidence path requirement → activity → indicator",
    evidencePath.every(
      (row) =>
        (row.linkedActivities || []).length > 0 &&
        (row.linkedIndicators || []).length > 0,
    ),
  );

  const gappy = coveringPlan(project.id, now);
  gappy.activities = gappy.activities.filter((row) => row.id !== "ACT-GRM");
  gappy.indicators = gappy.indicators.filter((row) => row.linkedToEngagementActivity !== "ACT-GRM");
  gappy.grievanceFramework = {
    ...gappy.grievanceFramework,
    stages: [],
    lodgementChannels: [],
  };
  const gappyMatrix = buildComplianceMatrix(tender, gappy);
  const gaps = flagComplianceGaps(gappyMatrix, true);
  const grievanceGap = gaps.some((row) => /grievance|complaint/i.test(row));
  check("gap flagging identifies missing grievance design", grievanceGap, gaps.slice(0, 3).join(" | "));

  const failed = checks.filter((row) => !row.ok);
  console.log(`\n---\nPassed: ${checks.length - failed.length} | Failed: ${failed.length}\n`);
  if (failed.length) {
    process.exitCode = 1;
  }
}

void main();
