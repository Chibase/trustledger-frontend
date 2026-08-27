/**
 * SEP Tender Parser — Smoke Tests
 * Phase B: Validation of extraction against relocation tender test case
 * 
 * Specification Section 22: Baseline Test Case — Relocation & Migration Plan
 */

import { parseTender, validateTenderIntelligence } from "@/lib/sepTenderParser";
import type { TenderIntelligence } from "@/types/sepAnalysis";

/**
 * Test case: Relocation and Migration Plan tender (simplified fixture)
 * Used to validate parser against known tender structure.
 */
const RELOCATION_TENDER_FIXTURE = `
INVITATION TO BID

Tender Number: DW/2026/0847
Procuring Entity: Example Water Authority
Issued by: Department of Water and Sanitation

PROJECT TITLE
Relocation and Migration Plan for Households Affected by Bulk Water Supply Infrastructure

PROJECT SECTOR
Water and Sanitation

LOCATION
Ward 12, Mpumalanga District Municipality, Limpopo Province

CONTRACT PERIOD
Duration: 6 months
Start: January 2026
End: June 2026

SCOPE OF WORK
The assignment requires structured consultation with project-affected households, economic displacement analysis, host community engagement, and livelihood restoration planning.

DELIVERABLES
1. Stakeholder identification and mapping
2. Social impact assessment
3. Participatory census of affected households
4. Livelihood restoration plan
5. Grievance mechanism design
6. Monthly progress reports

STAKEHOLDERS
- Project-affected households (estimated 500-800)
- Host community leaders and traditional authorities
- Local Municipality (Ward 12)
- Department of Water and Sanitation
- NGOs working on water and livelihood issues

REGULATORY FRAMEWORK
Compliance required with: WULA (Water Use Licence Agreement) consultation conditions, Environmental Impact Assessment public participation, and Municipal consultation requirements.

EVALUATION CRITERIA
- Quality of stakeholder engagement methodology
- Clarity of participation strategy
- Evidence of vulnerability assessment
- Monitoring and evaluation framework
- Feasibility of implementation schedule

REQUIREMENTS
Ensure stakeholder consultation on relocation options, entitlements, and host-community consent. Document all engagements. Establish one grievance mechanism for all project-related complaints. Maintain commitment register with evidence tracking.
`;

/**
 * Smoke test suite for tender parser.
 */
export const TENDER_PARSER_SMOKE_TESTS = [
  {
    name: "Extract tender identity",
    test: (intelligence: TenderIntelligence) => {
      const checks = [
        ["tenderNumber includes DW", intelligence.tenderNumber.includes("DW")],
        ["procuringEntity includes Authority", intelligence.procuringEntity.includes("Authority")],
        ["tenderTitle includes Relocation", intelligence.tenderTitle.toLowerCase().includes("relocation")],
      ];
      return checks;
    },
  },
  {
    name: "Extract project identity",
    test: (intelligence: TenderIntelligence) => {
      const checks = [
        ["projectSector is water", intelligence.projectSector.toLowerCase().includes("water")],
        ["projectLocation includes Ward", intelligence.projectLocation.includes("Ward")],
        ["projectLocation includes Mpumalanga", intelligence.projectLocation.includes("Mpumalanga")],
      ];
      return checks;
    },
  },
  {
    name: "Extract scope and stakeholders",
    test: (intelligence: TenderIntelligence) => {
      const checks = [
        ["scope.geographicCoverage populated", intelligence.scope.geographicCoverage.length > 0],
        ["namedStakeholders includes Municipality", 
          intelligence.namedStakeholders.some(s => s.name.toLowerCase().includes("municipality"))],
        ["namedStakeholders includes authority",
          intelligence.namedStakeholders.some(s => s.name.toLowerCase().includes("authority"))],
      ];
      return checks;
    },
  },
  {
    name: "Detect SEP requirements",
    test: (intelligence: TenderIntelligence) => {
      const checks = [
        ["requirements extracted", intelligence.requirements.length > 0],
        ["includes participation requirement",
          intelligence.requirements.some(r => r.category === "participation")],
        ["includes grievance requirement",
          intelligence.requirements.some(r => r.category === "grievance")],
        ["includes livelihood requirement",
          intelligence.requirements.some(r => r.category === "livelihood")],
      ];
      return checks;
    },
  },
  {
    name: "Extract regulatory references",
    test: (intelligence: TenderIntelligence) => {
      const checks = [
        ["regulatoryReferences populated", intelligence.regulatoryReferences.length > 0],
        ["includes WULA", 
          intelligence.regulatoryReferences.some(r => r.instrument.toUpperCase().includes("WULA"))],
      ];
      return checks;
    },
  },
  {
    name: "Contract period extraction",
    test: (intelligence: TenderIntelligence) => {
      const checks = [
        ["durationMonths is 6", intelligence.contractPeriod.durationMonths === 6],
      ];
      return checks;
    },
  },
  {
    name: "Stakeholder kind classification",
    test: (intelligence: TenderIntelligence) => {
      const checks = [
        ["municipality classified as government",
          intelligence.namedStakeholders
            .filter(s => s.name.toLowerCase().includes("municipality"))
            .some(s => s.kind === "government")],
        ["authority classified as government",
          intelligence.namedStakeholders
            .filter(s => s.name.toLowerCase().includes("authority"))
            .some(s => s.kind === "government")],
      ];
      return checks;
    },
  },
  {
    name: "Validation check",
    test: (intelligence: TenderIntelligence) => {
      const validation = validateTenderIntelligence(intelligence);
      const checks = [
        ["passes validation", validation.valid],
        ["no critical errors", validation.errors.filter(e => e.includes("number") || e.includes("title")).length === 0],
      ];
      return checks;
    },
  },
];

/**
 * Run smoke test suite against tender.
 */
export function runTenderParserSmokeTests(): {
  passed: number;
  failed: number;
  tests: Array<{ name: string; checks: Array<[string, boolean]> }>;
} {
  console.log("\n=== SEP Tender Parser Smoke Tests (Phase B) ===\n");
  
  const intelligence = parseTender(RELOCATION_TENDER_FIXTURE);
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const suite of TENDER_PARSER_SMOKE_TESTS) {
    const checks = suite.test(intelligence);
    const suitePassed = checks.every(([, result]) => result);
    
    if (suitePassed) {
      console.log(`✅ ${suite.name}`);
      passed += checks.length;
    } else {
      console.log(`❌ ${suite.name}`);
      for (const [check, result] of checks) {
        if (!result) {
          console.log(`   - ${check}: FAILED`);
          failed += 1;
        } else {
          passed += 1;
        }
      }
    }
    
    results.push({ name: suite.name, checks });
  }
  
  console.log(`\n---\nPassed: ${passed} | Failed: ${failed}\n`);
  
  // Print extracted intelligence for inspection
  console.log("=== Extracted TenderIntelligence ===");
  console.log(`Tender Number: ${intelligence.tenderNumber}`);
  console.log(`Title: ${intelligence.tenderTitle}`);
  console.log(`Procuring Entity: ${intelligence.procuringEntity}`);
  console.log(`Sector: ${intelligence.projectSector}`);
  console.log(`Location: ${intelligence.projectLocation}`);
  console.log(`Duration: ${intelligence.contractPeriod.durationMonths} months`);
  console.log(`Named Stakeholders: ${intelligence.namedStakeholders.length}`);
  console.log(`Requirements Extracted: ${intelligence.requirements.length}`);
  console.log(`Regulatory References: ${intelligence.regulatoryReferences.length}`);
  console.log("");
  
  return { passed, failed, tests: results };
}

/**
 * Detailed inspection of parsed tender intelligence.
 */
export function inspectTenderIntelligence(tenderText: string): void {
  const intelligence = parseTender(tenderText);
  const validation = validateTenderIntelligence(intelligence);
  
  console.log("\n=== TenderIntelligence Detailed Inspection ===\n");
  
  console.log("TENDER IDENTITY");
  console.log(`  Number: ${intelligence.tenderNumber}`);
  console.log(`  Title: ${intelligence.tenderTitle}`);
  console.log(`  Procuring Entity: ${intelligence.procuringEntity}`);
  console.log(`  Extracted: ${intelligence.extractedAt}`);
  console.log(`  Source: ${intelligence.extractionSource}\n`);
  
  console.log("PROJECT IDENTITY");
  console.log(`  Name: ${intelligence.projectName}`);
  console.log(`  Sector: ${intelligence.projectSector}`);
  console.log(`  Location: ${intelligence.projectLocation}\n`);
  
  console.log("SCOPE");
  console.log(`  Geographic Coverage: ${intelligence.scope.geographicCoverage.join(", ")}`);
  console.log(`  Stakeholder Coverage: ${intelligence.scope.stakeholderCoverage.join(", ")}`);
  console.log(`  Tasks: ${intelligence.scope.tasks.length} extracted\n`);
  
  console.log("CONTRACT PERIOD");
  console.log(`  Duration (months): ${intelligence.contractPeriod.durationMonths || "TBC"}\n`);
  
  console.log("NAMED STAKEHOLDERS");
  intelligence.namedStakeholders.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.name} (${s.kind})`);
  });
  console.log("");
  
  console.log("REQUIREMENTS");
  intelligence.requirements.forEach((r, i) => {
    console.log(`  ${i + 1}. [${r.category}] ${r.text.substring(0, 80)}...`);
  });
  console.log("");
  
  console.log("REGULATORY REFERENCES");
  intelligence.regulatoryReferences.forEach((r) => {
    console.log(`  - ${r.instrument}: ${r.implication}`);
  });
  console.log("");
  
  console.log("VALIDATION");
  if (validation.valid) {
    console.log("  ✅ Validation passed");
  } else {
    console.log("  ⚠️  Validation warnings:");
    validation.errors.forEach((e) => {
      console.log(`     - ${e}`);
    });
  }
  console.log("");
}

/**
 * Export test fixture for use in other test suites.
 */
export { RELOCATION_TENDER_FIXTURE };
