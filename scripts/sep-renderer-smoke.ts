/**
 * SEP Renderer — Smoke Tests
 * Phase G: 25-section professional SEP from the relocation baseline
 */

import { extractText, getDocumentProxy } from "unpdf";
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
import { SEP_FRAMEWORK_CITE, SEP_SPEC_CITE } from "../src/data/sepCanon";
import {
  INFRASTRUCTURE_TENDER_FIXTURE,
  RELOCATION_TENDER_FIXTURE,
} from "./sep-tender-parser-smoke";

const checks: Array<{ name: string; ok: boolean; detail?: string }> = [];

function check(name: string, ok: boolean, detail?: string) {
  checks.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail && !ok ? ` — ${detail}` : ""}`);
}

function sectionOf(
  document: { documentSections: Array<{ sectionId: string; sectionNumber: number; body: string; tables?: unknown[] }> },
  id: string,
) {
  return document.documentSections.find((row) => row.sectionId === id);
}

async function main() {
  console.log("\n=== SEP Renderer Smoke Tests (Phase G) ===\n");

  const { tender, plan, document } = generateSepFromTender(RELOCATION_TENDER_FIXTURE, {
    implementingOrganisation: "Example Water Social Unit",
  });
  const structure = assertSepStructure(document);
  const markdown = sepDocumentToMarkdown({
    ...document,
    implementingOrganisation: plan.implementingOrganisation,
  });
  const html = sepDocumentToWordHtml({
    ...document,
    implementingOrganisation: plan.implementingOrganisation,
  });

  check("25 numbered sections present", SEP_SECTION_SPECS.every((spec) =>
    document.documentSections.some((row) => row.sectionTitle === spec.title && row.sectionNumber === spec.number),
  ));
  check("12 appendices present", SEP_APPENDIX_SPECS.every((spec) =>
    document.documentSections.some((row) => row.sectionTitle === spec.title),
  ));
  check("no empty sections", structure.ok, structure.missing.join("; "));
  check("compliance matrix appendix present", /Appendix J/i.test(markdown));
  check("QA report appendix present", /Appendix K/i.test(markdown));
  check("references appendix present", /Appendix L/i.test(markdown));
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
      .filter((row) => row.sectionId !== "methodology" && row.sectionId !== "app-references")
      .some((row) => /TrustLedger|SL-?2?B/i.test(row.body)),
  );
  check(
    "no invented attendance guarantee",
    !/\b\d{3,}\s+households will attend/i.test(markdown),
  );
  check("section references resolve", /Appendix J/.test(markdown) && /Section 7/.test(markdown));
  check("specification cited", markdown.includes(SEP_SPEC_CITE.short));
  check("framework cited", markdown.includes(SEP_FRAMEWORK_CITE.short));
  check(
    "no Chibase Consulting in analysis SEP",
    !/Chibase Consulting/i.test(markdown) && !/Chibase Consulting/i.test(html),
  );
  check(
    "implementing organisation is the named entity",
    /Example Water Social Unit/.test(markdown),
  );

  const academic = [
    { id: "compliance-matrix", heading: "4.1", table: "Table 4.1" },
    { id: "social-context", heading: "5.1", table: "Table 5.1" },
    { id: "stakeholders", heading: "6.1", table: "Table 6.1" },
    { id: "risk-opportunity", heading: "8.1", table: "Table 8.1" },
  ] as const;
  for (const row of academic) {
    const section = sectionOf(document, row.id);
    check(
      `section ${row.id} has ${row.heading} and ${row.table}`,
      Boolean(
        section &&
          section.body.includes(`**${row.heading}`) &&
          (section.tables?.length || section.body.includes(row.table)),
      ),
    );
  }

  const exportPlan = engagementPlanFromSepDocument(document, {
    projectName: tender.projectName,
    place: tender.projectLocation,
    client: tender.procuringEntity,
    timeline: tender.contractPeriod.durationMonths ? `${tender.contractPeriod.durationMonths} months` : "TBC",
    tenderRef: tender.tenderNumber,
    sectorId: plan.project.sector === "water" ? "water" : "generic",
    programmeKind: "relocation",
    implementingEntity: plan.implementingOrganisation,
  });
  check("adapter payload accepted for PDF", isSepPlanPayload(exportPlan));
  check("planToMarkdown includes 25+ sections", exportPlan.documentSections.length >= 25);
  check(
    "adapter copied structured tables",
    (exportPlan.documentSections.filter((row) => (row.tables || []).length > 0).length || 0) >= 4,
  );
  const deskMd = planToMarkdown(exportPlan);
  const deskHtml = planToWordHtml(exportPlan);
  check("desk markdown non-empty", deskMd.length > 1000);
  check("desk html non-empty", deskHtml.length > 1000);
  check("desk html has no Chibase letterhead", !/Chibase Consulting/i.test(deskHtml));

  const pdf = await buildSepPdf(exportPlan);
  check("PDF generated", pdf.length > 1000, `bytes=${pdf.length}`);

  const proxy = await getDocumentProxy(new Uint8Array(pdf));
  const { text, totalPages } = await extractText(proxy, { mergePages: false });
  const pages = Array.isArray(text) ? text : [String(text)];
  check("PDF has more than a cover page", totalPages >= 2, `pages=${totalPages}`);
  check(
    "PDF last page has body text",
    Boolean(pages[pages.length - 1]?.replace(/\s+/g, " ").trim().length),
    `last="${String(pages[pages.length - 1] || "").slice(0, 80)}"`,
  );
  const trailingEmpty = pages.slice(1).filter((page) => !page.replace(/\s+/g, " ").replace(/Page \d+ of \d+/g, "").trim()).length;
  check("PDF has no empty trailing content pages", trailingEmpty === 0, `empty=${trailingEmpty} pages=${totalPages}`);
  check("PDF does not mention Chibase Consulting", !pages.some((page) => /Chibase Consulting/i.test(page)));

  const road = generateSepFromTender(INFRASTRUCTURE_TENDER_FIXTURE);
  const relocActs = plan.activities.map((row) => row.activityName).join("|");
  const roadActs = road.plan.activities.map((row) => row.activityName).join("|");
  check("road SEP sequence differs from relocation", relocActs !== roadActs);
  check(
    "road SEP has no census activity",
    !road.plan.activities.some((row) => /census/i.test(row.activityName)),
  );
  check(
    "road SEP has no host-consent activity",
    !road.plan.activities.some((row) => /host-community consent/i.test(row.activityName)),
  );

  const failed = checks.filter((row) => !row.ok);
  console.log(`\n---\nPassed: ${checks.length - failed.length} | Failed: ${failed.length}\n`);
  if (failed.length) process.exitCode = 1;
}

void main();
