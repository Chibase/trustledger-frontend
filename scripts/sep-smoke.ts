import { composeEngagementPlan, previewSepExtract, rebuildSepDocument } from "../src/lib/sepComposer";
import { SEP_EXAMPLE_BRIEFS } from "../src/data/sepSectors";
import { SEP_RELOCATION_EXAMPLE_BRIEF } from "../src/data/sepRelocation";
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
const architectureEssay =
  /three shipped anchors|strategic advisory|rapid-response workflows|srm integration|TrustLedger SRM execution protocol|Themba|shipped modules|Capture templates|Apply seeds|Social Licence to Build/i;
if (housing.sectorId !== "housing") checks.push(`housing detect=${housing.sectorId}`);
if (housing.programmeKind === "relocation") checks.push("housing should stay standard programme");
if (housing.sourceKind !== "rfp") checks.push(`housing source=${housing.sourceKind}`);
if (housing.phases.length !== 7) checks.push(`housing phases=${housing.phases.length}`);
if (housing.documentSections.length !== 8) {
  checks.push(`housing sections=${housing.documentSections.length}`);
}
if (housing.documentSections[0]?.id !== "summary") {
  checks.push(`housing first=${housing.documentSections[0]?.id}`);
}
if (housing.documentSections[7]?.id !== "conclusion") {
  checks.push(`housing last=${housing.documentSections[7]?.id}`);
}
if (housing.documentSections.some((row) => row.protocol)) {
  checks.push("client document must not carry execution protocols");
}
const housingDoc = housing.documentSections.map((row) => row.body).join("\n");
if (architectureEssay.test(housingDoc)) {
  checks.push("housing document still contains architecture copy");
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
if (mining.programmeKind === "relocation") {
  checks.push("mining playbook-only compose should stay standard");
}

const hostOnly = composeEngagementPlan({
  text: "Request for Proposal\nProject: Grid connection I&AP rounds\nClient: Example IPP Pty Ltd\nConsult the host community, landowners, and municipality. Terms of reference.",
  sectorId: "auto",
});
if (hostOnly.programmeKind === "relocation") {
  checks.push("host-community consultation must not overlay RAP");
}

const utilityMove = composeEngagementPlan({
  text: "Tender\nProject: 11kV utility relocation along the road reserve\nClient: Example Public Works Department\nConsult adjacent households before the line is moved. Terms of reference.",
  sectorId: "auto",
});
if (utilityMove.programmeKind === "relocation") {
  checks.push("utility relocation without RAP context must stay standard");
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
if (md.includes("TrustLedger SRM execution protocol")) {
  checks.push("markdown still has execution protocol");
}
if (!md.includes("| Class |")) checks.push("markdown missing matrix table");
if (!md.includes("Chibase Consulting")) checks.push("markdown missing issuer");
if (!/Community-Based Participatory Research/i.test(md)) {
  checks.push("markdown missing CBPR");
}
if (!md.includes("8. Conclusion")) checks.push("markdown missing conclusion");

const word = planToWordHtml(housing);
if (/execution protocol/i.test(word)) checks.push("word still has execution protocol");
if (!word.includes("<table")) checks.push("word missing table");
if (!word.includes("Chibase Consulting")) checks.push("word missing issuer");

const applyPreview = previewSepApply(housing);
if (
  applyPreview.engagements < 1 ||
  applyPreview.commitments < 1 ||
  applyPreview.stakeholders < 1
) {
  checks.push(`preview ${JSON.stringify(applyPreview)}`);
}

const relocation = composeEngagementPlan({
  text: SEP_RELOCATION_EXAMPLE_BRIEF,
  sectorId: "auto",
});
if (relocation.programmeKind !== "relocation") {
  checks.push(`relocation programme=${relocation.programmeKind}`);
}
if (relocation.sectorId !== "housing") {
  checks.push(`relocation sector=${relocation.sectorId} (expected housing, not municipal)`);
}
if (!/winnie madikizela mandela local municipality/i.test(relocation.placeHint)) {
  checks.push(`relocation place=${relocation.placeHint}`);
}
if (!/winnie madikizela mandela local municipality/i.test(relocation.clientFunderHint)) {
  checks.push(`relocation client=${relocation.clientFunderHint}`);
}
if (!/3\s*months/i.test(relocation.timelineHint)) {
  checks.push(`relocation timeline=${relocation.timelineHint}`);
}
if (!/relocation and migration/i.test(relocation.title)) {
  checks.push(`relocation title=${relocation.title}`);
}
if (/sep — sep/i.test(relocation.title)) {
  checks.push(`double SEP prefix ${relocation.title}`);
}
if (!relocation.activities.some((row) => row.id === "census")) {
  checks.push("relocation missing census activity");
}
if (!relocation.stakeholderClasses.some((row) => row.id === "host-community")) {
  checks.push("relocation missing host community class");
}
if (!relocation.stakeholderClasses.some((row) => row.id === "pap-physical")) {
  checks.push("relocation missing physically displaced class");
}
const relocationNamed = relocation.stakeholderClasses.flatMap(
  (row) => row.namedFromBrief || [],
);
if (relocationNamed.some((name) => /^(the municipality|mandela local municipality)$/i.test(name))) {
  checks.push(`relocation junk named parties ${relocationNamed.join("; ")}`);
}
const relocationSummary =
  relocation.documentSections.find((row) => row.id === "summary")?.body || "";
if (architectureEssay.test(relocationSummary)) {
  checks.push("relocation summary still architecture essay");
}
if (!/relocation and migration assignment/i.test(relocationSummary)) {
  checks.push("relocation summary missing assignment lead");
}
if (!/cut-off/i.test(relocationSummary) || !/census/i.test(relocationSummary)) {
  checks.push("relocation summary missing census/cut-off");
}
if (!/Chibase Consulting/i.test(relocationSummary)) {
  checks.push("relocation summary missing Chibase Consulting");
}
if (/Themba|TrustLedger SRM|execution protocol/i.test(relocationSummary)) {
  checks.push("relocation summary still names product architecture");
}
const relocationDoc = relocation.documentSections.map((row) => row.body).join("\n");
if (architectureEssay.test(relocationDoc)) {
  checks.push("relocation document still contains architecture copy");
}
if (!/Community-Based Participatory Research/i.test(relocationDoc)) {
  checks.push("relocation document missing CBPR");
}
if (!relocation.documentSections.some((row) => row.id === "conclusion")) {
  checks.push("relocation missing conclusion");
}

const wmmlmCover = `TRUSTLEDGER SRM
Stakeholder Engagement Plan
SEP — RELOCATION AND MIGRATION PLAN
SECTOR
Municipal / LED
SOURCE
Tender
ASSIGNMENT
RELOCATION AND MIGRATION PLAN
CLIENT / PROCURING ENTITY
Winnie Madikizela Mandela Local Municipality
TIMELINE
3 months
Consult affected people on land access and livelihood change, and keep a grievance path that can carry RAP issues without losing the thread.
Named in brief: Winnie Madikizela Mandela Local Municipality, Mandela Local Municipality, The Municipality.`;
const coverPreview = previewSepExtract(wmmlmCover);
if (coverPreview.programmeKind !== "relocation") {
  checks.push(`cover programme=${coverPreview.programmeKind}`);
}
if (coverPreview.sectorId !== "housing") {
  checks.push(`cover sector=${coverPreview.sectorId}`);
}
if (!/relocation and migration/i.test(coverPreview.title)) {
  checks.push(`cover title=${coverPreview.title}`);
}
if (!/winnie madikizela mandela local municipality/i.test(coverPreview.place)) {
  checks.push(`cover place=${coverPreview.place}`);
}
if (!/winnie madikizela mandela local municipality/i.test(coverPreview.client)) {
  checks.push(`cover client=${coverPreview.client}`);
}
if (!/3\s*months/i.test(coverPreview.timeline)) {
  checks.push(`cover timeline=${coverPreview.timeline}`);
}
if (
  coverPreview.namedParties.some((name) =>
    /^(the municipality|mandela local municipality)$/i.test(name),
  )
) {
  checks.push(`cover named ${coverPreview.namedParties.join("; ")}`);
}

const stale = composeEngagementPlan({
  text: SEP_EXAMPLE_BRIEFS.housing,
  sectorId: "housing",
});
const rebuilt = rebuildSepDocument(
  {
    ...stale,
    title: "SEP — RELOCATION AND MIGRATION PLAN",
    programmeKind: undefined,
    activities: stale.activities.filter((row) => row.id !== "census"),
  },
  { touch: false },
);
if (rebuilt.programmeKind !== "relocation") {
  checks.push(`rebuild programme=${rebuilt.programmeKind}`);
}
if (!rebuilt.activities.some((row) => row.id === "census")) {
  checks.push("rebuild did not overlay RAP census");
}
if (architectureEssay.test(rebuilt.documentSections[0]?.body || "")) {
  checks.push("rebuild still architecture essay");
}
if (rebuilt.documentSections.some((row) => row.protocol)) {
  checks.push("rebuild document still has protocols");
}

const rapMd = planToMarkdown(relocation);
if (!rapMd.includes("Relocation & migration")) {
  checks.push("markdown missing programme line");
}

async function main() {
  const pdf = await buildSepPdf(housing);
  if (pdf.subarray(0, 4).toString() !== "%PDF") {
    checks.push("pdf magic missing");
  }
  if (pdf.length < 2000) checks.push(`pdf too small ${pdf.length}`);

  const rapPdf = await buildSepPdf(relocation);
  if (rapPdf.subarray(0, 4).toString() !== "%PDF") {
    checks.push("relocation pdf magic missing");
  }
  if (rapPdf.length < 2000) checks.push(`relocation pdf too small ${rapPdf.length}`);

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
        relocation: {
          title: relocation.title,
          sector: relocation.sectorId,
          programme: relocation.programmeKind,
          place: relocation.placeHint,
          client: relocation.clientFunderHint,
          timeline: relocation.timelineHint,
          phases: relocation.phases.map((p) => p.title),
        },
      },
      null,
      2,
    ),
  );
}

void main();
