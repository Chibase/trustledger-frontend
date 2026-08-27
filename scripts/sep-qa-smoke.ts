/**
 * SEP Quality Assurance — Smoke Tests
 * Phase F: 14 automated quality tests on the relocation baseline
 */

import { parseTender } from "../src/lib/sepTenderParser";
import {
  analyseSocialContext,
  buildProjectProfileFromTender,
  generateSocialRisks,
} from "../src/lib/sepSocialContextAnalysis";
import { planParticipation } from "../src/lib/sepParticipationPlanner";
import { buildComplianceMatrix } from "../src/lib/sepComplianceMatrix";
import { generateQAReport, runQualityAssurance } from "../src/lib/sepQualityAssurance";
import { RELOCATION_TENDER_FIXTURE } from "./sep-tender-parser-smoke";
import type { SepGenerationPlan } from "../src/types/sepAnalysis";

const EXPECTED_TESTS = [
  "completeness",
  "tender_alignment",
  "fact_integrity",
  "method_integrity",
  "stakeholder_completeness",
  "participation_quality",
  "risk_coherence",
  "grievance_coherence",
  "me_coherence",
  "schedule_realism",
  "internal_consistency",
  "legal_restraint",
  "evidence_traceability",
  "professional_quality",
] as const;

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

function main() {
  console.log("\n=== SEP Quality Assurance Smoke Tests (Phase F) ===\n");

  const tender = parseTender(RELOCATION_TENDER_FIXTURE);
  const project = buildProjectProfileFromTender(tender);
  const socialContext = analyseSocialContext(tender, project);
  const risks = generateSocialRisks(socialContext, project);
  const participation = planParticipation({
    tender,
    project,
    socialContext,
    risks,
    constraints: { durationMonths: tender.contractPeriod.durationMonths || 6 },
  });
  const plan: SepGenerationPlan = {
    id: `PLAN-${project.id}`,
    projectProfileId: project.id,
    tenderIntelligenceId: tender.id,
    project,
    socialContext,
    risks,
    ...participation,
    complianceMatrix: [],
    qaResults: [],
    createdAt: new Date().toISOString(),
  };
  plan.complianceMatrix = buildComplianceMatrix(tender, plan);
  plan.qaResults = runQualityAssurance(plan, tender, plan.complianceMatrix);
  const report = generateQAReport(plan.qaResults);

  check("14 QA tests ran", plan.qaResults.length === 14, `n=${plan.qaResults.length}`);
  check(
    "all specified tests present",
    EXPECTED_TESTS.every((id) => plan.qaResults.some((row) => row.qaTest === id)),
  );
  check("tender parsed", /relocation/i.test(tender.projectName) || /relocation/i.test(tender.tenderTitle));
  check(
    "no high/critical blockers",
    report.blockers.length === 0,
    report.blockers.map((row) => `${row.qaTest}:${row.finding}`).join(" | "),
  );
  check("ready for approval is true when blockers empty", report.readyForApproval === (report.blockers.length === 0));
  check("at least some tests pass", report.passed >= 8, `passed=${report.passed}`);
  check(
    "failures (if any) are not silent",
    report.failures === 0 || plan.qaResults.filter((row) => row.result === "fail").every((row) => Boolean(row.remediation)),
  );

  for (const row of plan.qaResults) {
    if (row.result === "fail") {
      console.log(`  fail  ${row.qaTest}: ${row.finding}`);
      (row.details || []).slice(0, 3).forEach((d) => console.log(`         - ${d}`));
    } else if (row.result === "warning") {
      console.log(`  warn  ${row.qaTest}: ${row.finding}`);
    }
  }

  const failed = checks.filter((row) => !row.ok);
  console.log(`\n---\nPassed: ${checks.length - failed.length} | Failed: ${failed.length}\n`);
  if (failed.length) process.exitCode = 1;
}

void main();
