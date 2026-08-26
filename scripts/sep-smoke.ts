import { composeEngagementPlan, previewSepExtract } from "../src/lib/sepComposer";
import { SEP_EXAMPLE_BRIEFS } from "../src/data/sepSectors";
import { joinSepPlace } from "../src/lib/sepInstruments";
import { planToMarkdown, planToWordHtml } from "../src/lib/sepExport";
import { buildSepPdf } from "../src/lib/sepPdf";
import { previewSepApply } from "../src/lib/sepApply";

const housing = composeEngagementPlan({
  text: SEP_EXAMPLE_BRIEFS.housing,
  sectorId: "auto",
});
const mining = composeEngagementPlan({
  text: "",
  sectorId: "mining",
});

const checks: string[] = [];
if (housing.sectorId !== "housing") checks.push(`housing detect=${housing.sectorId}`);
if (housing.sourceKind !== "rfp") checks.push(`housing source=${housing.sourceKind}`);
if (housing.phases.length !== 7) checks.push(`housing phases=${housing.phases.length}`);
if (housing.documentSections.length !== 7) {
  checks.push(`housing sections=${housing.documentSections.length}`);
}
if (housing.documentSections[0]?.id !== "summary") {
  checks.push(`housing first=${housing.documentSections[0]?.id}`);
}
if (!housing.documentSections[0]?.protocol) {
  checks.push("housing missing execution protocol");
}
if (!housing.documentSections.every((row) => row.protocol)) {
  checks.push("section missing protocol");
}
if (!housing.placeHint.toLowerCase().includes("ward")) {
  checks.push(`housing place=${housing.placeHint}`);
}
if (!housing.instruments.some((row) => row.id === "nema-eia")) {
  checks.push("housing missing NEMA instrument");
}
if (mining.title !== "SEP — Mining / extractives") {
  checks.push(`mining title=${mining.title}`);
}
if (mining.sourceKind !== "manual") {
  checks.push(`mining source=${mining.sourceKind}`);
}

const facts = composeEngagementPlan({
  text: "",
  sectorId: "energy",
  projectName: "Karoo PV",
  placeHint: joinSepPlace({
    municipality: "Ubuntu Local Municipality",
    ward: "4",
  }),
  timelineHint: "24 months",
  instrumentIds: ["ifc", "nema-eia"],
  namedParties: ["Karoo Farmers Association"],
});
if (facts.sourceKind !== "manual") checks.push(`facts source=${facts.sourceKind}`);
if (!facts.placeHint.includes("Ubuntu")) checks.push(`facts place=${facts.placeHint}`);
if (!facts.placeHint.includes("Ward 4")) checks.push(`facts ward=${facts.placeHint}`);
if (facts.timelineHint !== "24 months") checks.push(`facts timeline=${facts.timelineHint}`);
if (!facts.instruments.some((row) => row.id === "ifc")) {
  checks.push("facts missing IFC");
}
if (
  !facts.stakeholderClasses.some((row) =>
    row.namedFromBrief?.includes("Karoo Farmers Association"),
  )
) {
  checks.push("facts named party not attached");
}

const preview = previewSepExtract(SEP_EXAMPLE_BRIEFS.housing);
if (preview.sectorId !== "housing") checks.push(`preview sector=${preview.sectorId}`);
if (!preview.place.toLowerCase().includes("ward")) {
  checks.push(`preview place=${preview.place}`);
}
if (!preview.instruments.some((row) => row.id === "nema-eia")) {
  checks.push("preview missing NEMA");
}

const md = planToMarkdown(housing);
if (!md.includes("TrustLedger SRM execution protocol")) {
  checks.push("markdown missing protocol");
}
if (!md.includes("| Class |")) checks.push("markdown missing matrix table");

const word = planToWordHtml(housing);
if (!word.includes("execution protocol")) checks.push("word missing protocol");
if (!word.includes("<table")) checks.push("word missing table");

const applyPreview = previewSepApply(housing);
if (
  applyPreview.engagements < 1 ||
  applyPreview.commitments < 1 ||
  applyPreview.stakeholders < 1
) {
  checks.push(`preview ${JSON.stringify(applyPreview)}`);
}

async function main() {
  const pdf = await buildSepPdf(housing);
  if (pdf.subarray(0, 4).toString() !== "%PDF") {
    checks.push("pdf magic missing");
  }
  if (pdf.length < 2000) checks.push(`pdf too small ${pdf.length}`);

  if (checks.length) {
    console.error(checks.join("\n"));
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        housing: {
          title: housing.title,
          sector: housing.sectorId,
          source: housing.sourceKind,
          place: housing.placeHint,
          phases: housing.phases.map((p) => p.title),
          preview: applyPreview,
        },
        mining: { title: mining.title, sector: mining.sectorId },
        facts: {
          title: facts.title,
          place: facts.placeHint,
          instruments: facts.instruments.map((row) => row.id),
        },
      },
      null,
      2,
    ),
  );
}

void main();
