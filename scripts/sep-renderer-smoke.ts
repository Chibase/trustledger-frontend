/**
 * SEP Renderer — Smoke Tests
 * Phase G: 25-section professional SEP from the relocation baseline
 */

import { generateSepFromTender } from "../src/lib/sepGenerationPipeline";
import {
  SEP_APPENDIX_SPECS,
  SEP_SECTION_SPECS,
  assertSepStructure,
} from "../src/lib/sepDocumentRenderer";
import {
  engagementPlanFromSepDocument,
  planToMarkdown,
  planToWordHtml,
  sepDocumentToMarkdown,
  sepDocumentToWordHtml,
} from "../src/lib/sepExport";
import { buildSepPdf, isSepPlanPayload } from "../src/lib/sepPdf";
import { SEP_ARCHITECTURE_VOICE } from "../src/lib/sepDocument";
import { RELOCATION_TENDER_FIXTURE } from "./sep-tender-parser-smoke";

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("\n=== SEP Renderer Smoke Tests (Phase G) ===\n");

  const { tender, plan, document } = generateSepFromTender(RELOCATION_TENDER_FIXTURE);
  const structure = assertSepStructure(document);
  const markdown = sepDocumentToMarkdown(document);
  const html = sepDocumentToWordHtml(document);

  check("25 numbered sections present", SEP_SECTION_SPECS.every((spec) =>
    document.documentSections.some((row) => row.sectionTitle === spec.title && row.sectionNumber === spec.number),
  ));
  check("11 appendices present", SEP_APPENDIX_SPECS.every((spec) =>
    document.documentSections.some((row) => row.sectionTitle === spec.title),
  ));
  check("no empty sections", structure.ok, structure.missing.join("; "));
  check("compliance matrix appendix present", /Appendix J/i.test(markdown));
  check("QA report appendix present", /Appendix K/i.test(markdown));
  check("markdown includes all 25 headings", SEP_SECTION_SPECS.every((spec) => markdown.includes(spec.title)));
  check("html is well-formed enough", html.includes("<h1>") && html.includes("</html>"));
  check("html contains tables from matrix", /<table/i.test(html));
  check(
    "no architecture essay in client document",
    !SEP_ARCHITECTURE_VOICE.test(markdown),
  );
  check(
    "TrustLedger not used as product dump outside methodology",
    !document.documentSections
      .filter((row) => row.sectionId !== "methodology")
      .some((row) => /TrustLedger|SL-?2?B/i.test(row.body)),
  );
  check(
    "no invented attendance guarantee",
    !/\b\d{3,}\s+households will attend/i.test(markdown),
  );
  check("section references resolve", /Appendix J/.test(markdown) && /Section 7/.test(markdown));

  const exportPlan = engagementPlanFromSepDocument(document, {
    projectName: tender.projectName,
    place: tender.projectLocation,
    client: tender.procuringEntity,
    timeline: tender.contractPeriod.durationMonths ? `${tender.contractPeriod.durationMonths} months` : "TBC",
    tenderRef: tender.tenderNumber,
    sectorId: plan.project.sector === "water" ? "water" : "generic",
    programmeKind: "relocation",
  });
  check("adapter payload accepted for PDF", isSepPlanPayload(exportPlan));
  check("planToMarkdown includes 25+ sections", exportPlan.documentSections.length >= 25);
  const deskMd = planToMarkdown(exportPlan);
  const deskHtml = planToWordHtml(exportPlan);
  check("desk markdown non-empty", deskMd.length > 1000);
  check("desk html non-empty", deskHtml.length > 1000);

  const pdf = await buildSepPdf(exportPlan);
  check("PDF generated", pdf.length > 1000, `bytes=${pdf.length}`);

  const failed = checks.filter((row) => !row.ok);
  console.log(`\n---\nPassed: ${checks.length - failed.length} | Failed: ${failed.length}\n`);
  if (failed.length) process.exitCode = 1;
}

void main();
