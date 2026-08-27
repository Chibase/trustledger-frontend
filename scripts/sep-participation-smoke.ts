/**
 * SEP Participation Planner — Smoke Tests
 * Phase E: Participation framework + engagement programme
 *
 * Baseline: Relocation and Migration Plan (Specification Section 22)
 */

import { parseTender } from "../src/lib/sepTenderParser";
import {
  analyseSocialContext,
  buildProjectProfileFromTender,
  generateSocialRisks,
} from "../src/lib/sepSocialContextAnalysis";
import { planParticipation, validateInclusionDesign } from "../src/lib/sepParticipationPlanner";
import { INFRASTRUCTURE_TENDER_FIXTURE, RELOCATION_TENDER_FIXTURE } from "./sep-tender-parser-smoke";

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

function main() {
  console.log("\n=== SEP Participation Planner Smoke Tests (Phase E) ===\n");

  const tender = parseTender(RELOCATION_TENDER_FIXTURE);
  const project = buildProjectProfileFromTender(tender);
  const socialContext = analyseSocialContext(tender, project);
  const risks = generateSocialRisks(socialContext, project);
  const planned = planParticipation({
    tender,
    project,
    socialContext,
    risks,
    constraints: { durationMonths: tender.contractPeriod.durationMonths || 6 },
  });

  check("stakeholders generated", planned.stakeholders.length >= 3, `n=${planned.stakeholders.length}`);
  check(
    "every stakeholder has a participation objective",
    planned.stakeholders.every((sh) =>
      planned.participationObjectives.some((po) => po.stakeholderProfileId === sh.id),
    ),
  );
  check(
    "no blanket consult-only labelling for affected households",
    planned.participationObjectives
      .filter((po) => /household|affected/i.test(po.stakeholderCategory))
      .every((po) => po.participationLevel === "collaborate" || po.participationLevel === "involve"),
  );
  check(
    "every objective states whatTheyCanInfluence",
    planned.participationObjectives.every((po) => po.whatTheyCanInfluence.length > 0),
  );
  check(
    "every objective has decision linkage language",
    planned.participationObjectives.every(
      (po) => po.decisionOrDesignArea.trim().length > 0 && po.howInputWillBeConsidered.trim().length > 0,
    ),
  );
  check("engagement activities designed", planned.activities.length >= 8, `n=${planned.activities.length}`);
  check(
    "every activity has output and decision linkage",
    planned.activities.every((a) => a.expectedOutput.trim() && a.decisionLinkage.trim()),
  );
  check(
    "methods include PRA, PLA and CBPR on relocation",
    ["pra", "pla", "cbpr"].every((id) => planned.methods.some((m) => m.methodology === id)),
  );
  check(
    "census activity present",
    planned.activities.some((a) => /census/i.test(a.activityName)),
  );
  check(
    "grievance activity present",
    planned.activities.some((a) => /grievance/i.test(a.activityName)),
  );
  check(
    "GRM has acknowledgement within 48 hours",
    planned.grievanceFramework.stages.some(
      (s) => s.stage === "acknowledgement" && /48/.test(s.serviceLevel || ""),
    ),
  );
  check(
    "GRM has eight-plus operational stages",
    planned.grievanceFramework.stages.length >= 8,
  );
  check("communications cover affected people", planned.communications.some((c) => /household|people who live/i.test(c.audience)));
  check(
    "indicators include input, process, output, outcome",
    ["input", "process", "output", "outcome"].every((t) =>
      planned.indicators.some((i) => i.indicatorType === t),
    ),
  );

  const inclusion = validateInclusionDesign(planned, socialContext.vulnerabilities);
  check("inclusion design has alternative mechanisms", inclusion.compliant, inclusion.gaps.join(" | "));
  check(
    "representation not assumed validated at tender stage",
    planned.stakeholders.every((s) => s.representation.representationValidated === false),
  );
  check(
    "no invented household attendance counts in activities",
    planned.activities.every((a) => !/\b\d{3,}\s+(people|households)\s+will attend/i.test(a.participantEstimate || "")),
  );

  const roadTender = parseTender(INFRASTRUCTURE_TENDER_FIXTURE);
  const roadProject = buildProjectProfileFromTender(roadTender);
  const roadContext = analyseSocialContext(roadTender, roadProject);
  const roadRisks = generateSocialRisks(roadContext, roadProject);
  const road = planParticipation({
    tender: roadTender,
    project: roadProject,
    socialContext: roadContext,
    risks: roadRisks,
    constraints: { durationMonths: roadTender.contractPeriod.durationMonths || 8 },
  });
  const relocNames = planned.activities.map((a) => a.activityName).join(" | ");
  const roadNames = road.activities.map((a) => a.activityName).join(" | ");
  check(
    "road assignment has no household census",
    !road.activities.some((a) => /census/i.test(a.activityName)),
  );
  check(
    "road assignment has no host-community consent process",
    !road.activities.some((a) => /host-community consent/i.test(a.activityName)),
  );
  check(
    "activity sequence differs between relocation and road upgrade",
    relocNames !== roadNames,
    `reloc=${relocNames}\nroad=${roadNames}`,
  );

  const failed = checks.filter((row) => !row.ok);
  console.log(`\n---\nPassed: ${checks.length - failed.length} | Failed: ${failed.length}\n`);
  if (failed.length) process.exitCode = 1;
}

void main();
