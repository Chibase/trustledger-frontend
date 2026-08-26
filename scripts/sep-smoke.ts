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
if (housing.documentSections.length !== 8) {
  checks.push(`housing sections=${housing.documentSections.length}`);
}
if (!housing.placeHint.toLowerCase().includes("ward")) {
  checks.push(`housing place=${housing.placeHint}`);
}
if (mining.title !== "SEP — Mining / extractives") {
  checks.push(`mining title=${mining.title}`);
}

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
