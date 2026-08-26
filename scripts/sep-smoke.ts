import { composeEngagementPlan } from "../src/lib/sepComposer";
import { SEP_EXAMPLE_BRIEFS } from "../src/data/sepSectors";
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
if (!housing.placeHint.toLowerCase().includes("ward")) {
  checks.push(`housing place=${housing.placeHint}`);
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
  placeHint: "Ubuntu LM · Ward 4",
  timelineHint: "24 months",
});
if (facts.sourceKind !== "manual") checks.push(`facts source=${facts.sourceKind}`);
if (!facts.placeHint.includes("Ubuntu")) checks.push(`facts place=${facts.placeHint}`);
if (facts.timelineHint !== "24 months") checks.push(`facts timeline=${facts.timelineHint}`);

const preview = previewSepApply(housing);
if (preview.engagements < 1 || preview.commitments < 1 || preview.stakeholders < 1) {
  checks.push(`preview ${JSON.stringify(preview)}`);
}

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
        preview,
      },
      mining: { title: mining.title, sector: mining.sectorId },
    },
    null,
    2,
  ),
);
