import { composeEngagementPlan, previewSepExtract, rebuildSepDocument } from "../src/lib/sepComposer";
import { mergeDraftedSections } from "../src/lib/sepGemini";
import { SEP_ARCHITECTURE_VOICE } from "../src/lib/sepDocument";
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
const architectureEssay = SEP_ARCHITECTURE_VOICE;
if (housing.sectorId !== "housing") checks.push(`housing detect=${housing.sectorId}`);
if (housing.programmeKind === "relocation") checks.push("housing should stay standard programme");
if (housing.sourceKind !== "rfp") checks.push(`housing source=${housing.sourceKind}`);
if (housing.phases.length !== 7) checks.push(`housing phases=${housing.phases.length}`);
if (housing.documentSections.length !== 9) {
  checks.push(`housing sections=${housing.documentSections.length}`);
}
if (housing.documentSections[0]?.id !== "summary") {
  checks.push(`housing first=${housing.documentSections[0]?.id}`);
}
if (housing.documentSections[8]?.id !== "conclusion") {
  checks.push(`housing last=${housing.documentSections[8]?.id}`);
}
if (!housing.documentSections.find((row) => row.id === "stakeholders")?.tables?.length) {
  checks.push("housing missing stakeholder table");
}
if (!housing.documentSections.find((row) => row.id === "methods")?.tables?.length) {
  checks.push("housing missing engagement schedule table");
}
if (housing.documentDrafter !== "template") {
  checks.push(`housing drafter=${housing.documentDrafter}`);
}
if (housing.documentSections.some((row) => row.protocol)) {
  checks.push("client document must not carry execution protocols");
}
const housingDoc = housing.documentSections.map((row) => row.body).join("\n");
if (architectureEssay.test(housingDoc)) {
  checks.push("housing document still contains architecture copy");
}
if (/TrustLedger Protocol|SL-?2?B protocol/i.test(housingDoc)) {
  checks.push("housing still has TrustLedger Protocol / SL2B annex");
}
const housingMethods =
  housing.documentSections.find((row) => row.id === "methods")?.body || "";
if (
  !/\*\*4\.3 Tools\.\*\*/.test(housingMethods) ||
  !/TrustLedger/.test(housingMethods) ||
  !/SL2B/.test(housingMethods)
) {
  checks.push("housing methods missing TrustLedger / SL2B tools paragraph");
}
const housingNonMethods = housing.documentSections
  .filter((row) => row.id !== "methods")
  .map((row) => row.body)
  .join("\n");
if (/TrustLedger|SL-?2?B/.test(housingNonMethods)) {
  checks.push("TrustLedger / SL2B leaked outside methodology");
}
if (!housing.placeHint.toLowerCase().includes("ward")) {
  checks.push(`housing place=${housing.placeHint}`);
}
const housingAssumptions =
  housing.documentSections.find((row) => row.id === "assumptions")?.body || "";
if (!/personal information/i.test(housingAssumptions)) {
  checks.push("housing assumptions dropped sector limit");
}
if (housingAssumptions.includes("Capture")) {
  checks.push("housing assumptions still name Capture");
}

const unlabeledRand = composeEngagementPlan({
  text: "Tender\nProject: Clinic upgrade\nClient: Example Department of Health\nCompensation of R50 000 per household is discussed. Terms of reference.",
  sectorId: "health",
});
if (unlabeledRand.budgetHint) {
  checks.push(`invented budget ${unlabeledRand.budgetHint}`);
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
if (md.includes("TrustLedger SRM execution protocol") || /TrustLedger Protocol/i.test(md)) {
  checks.push("markdown still has execution protocol");
}
if (!md.includes("| Stakeholder category |") && !md.includes("| Engagement mechanism |")) {
  checks.push("markdown missing report tables");
}
if (!md.includes("Chibase Consulting")) checks.push("markdown missing issuer");
if (!/Community-Based Participatory Research/i.test(md)) {
  checks.push("markdown missing CBPR");
}
if (!md.includes("9. Summary for the client")) checks.push("markdown missing client summary");

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
if (!/relocation and migration of project-affected/i.test(relocationSummary)) {
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
  coverPreview.namedParties.filter((name) => /municipality/i.test(name)).length > 1
) {
  checks.push(`cover named ${coverPreview.namedParties.join("; ")}`);
}

const inceptionPaste = previewSepExtract(`TRUSTLEDGER
Stakeholder Engagement Plan
SEP — • Inception report
ASSIGNMENT
• Inception report
CLIENT / PROCURING ENTITY
Winnie Madikizela Mandela Local Municipality
TIMELINE
3 months
This Stakeholder Engagement Plan is the operating plan for relocation and migration.
Relocation and Migration Plan
`);
if (/inception report/i.test(inceptionPaste.title)) {
  checks.push(`inception junk title=${inceptionPaste.title}`);
}
if (!/relocation and migration/i.test(inceptionPaste.title)) {
  checks.push(`inception title=${inceptionPaste.title}`);
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
if (!/Relocation and Migration Plan/i.test(rapMd)) {
  checks.push("markdown missing project name");
}

const geminiKept = rebuildSepDocument(
  {
    ...housing,
    documentDrafter: "gemini",
    documentSections: housing.documentSections.map((row) =>
      row.id === "summary"
        ? {
            ...row,
            body: `${row.body}\n\nGemini-only sentence for this assignment.`,
          }
        : row,
    ),
  },
  { touch: false },
);
if (!geminiKept.documentSections[0]?.body.includes("Gemini-only sentence")) {
  checks.push("rebuild wiped Gemini document");
}

const extraStakeholderTable = {
  headers: housing.documentSections.find((row) => row.id === "stakeholders")?.tables?.[0]?.headers || [
    "Stakeholder category",
    "Who they are",
    "Engagement objective",
    "Influence / interest",
  ],
  rows: [
    ...(housing.documentSections.find((row) => row.id === "stakeholders")?.tables?.[0]?.rows || []),
    ["Invented neighbours", "400 households next to the site", "Consult", "high / high"],
  ],
};
const geminiMerge = mergeDraftedSections(
  housing,
  {
    sections: housing.documentSections.map((row) => ({
      id: row.id,
      heading: row.heading,
      body:
        row.id === "summary"
          ? "**TrustLedger Protocol - SL2B**\n\n**1.1 The project.** This assignment is a housing upgrade for the named municipality over the contract period. Themba will answer WhatsApp 24/7. 400 households will move before census. **1.2 This document.** This is the Stakeholder Engagement Plan Chibase Consulting will follow if appointed. **1.3 This plan.** Identify, consult, record promises, and redress harm."
          : `${row.body}\n\nAdditional Gemini paragraph for ${row.id} covering what will be done, how, when, and by whom on this assignment so the procuring entity can read the plan.`,
      tables: row.id === "stakeholders" ? [extraStakeholderTable] : row.tables,
    })),
  },
  housing.sourceExcerpt,
);
const geminiSummary =
  geminiMerge.sections.find((row) => row.id === "summary")?.body || "";
if (/Themba|WhatsApp|400 households/i.test(geminiSummary)) {
  checks.push("gemini merge leaked banned copy or invented households");
}
if (/TrustLedger Protocol|SL-?2?B protocol/i.test(geminiSummary)) {
  checks.push("gemini merge kept TrustLedger Protocol annex");
}
const geminiMethods =
  geminiMerge.sections.find((row) => row.id === "methods")?.body || "";
if (!/TrustLedger/i.test(geminiMethods) || !/SL2B/i.test(geminiMethods)) {
  checks.push("gemini merge dropped methodology tools");
}
if (geminiMerge.draftedCount < 6) {
  checks.push(`gemini draftedCount=${geminiMerge.draftedCount}`);
}
const mergedStakeholderRows =
  geminiMerge.sections.find((row) => row.id === "stakeholders")?.tables?.[0]?.rows.length || 0;
if (mergedStakeholderRows !== housing.stakeholderClasses.length) {
  checks.push(`gemini extra stakeholder rows kept=${mergedStakeholderRows}`);
}

const budgetMerge = mergeDraftedSections(
  { ...housing, budgetHint: "R 1.2 million" },
  {
    sections: housing.documentSections.map((row) => ({
      id: row.id,
      heading: row.heading,
      body:
        row.id === "summary"
          ? `${row.body}\n\nProfessional fees as briefed are R 1.2 million. Gemini also claims R 999 000 for a portal that is not in the briefing.`
          : `${row.body}\n\nAdditional Gemini paragraph for ${row.id} covering what will be done, how, when, and by whom on this assignment so the procuring entity can read the plan.`,
      tables: row.tables,
    })),
  },
  `${housing.sourceExcerpt}\nBudget: R 1.2 million`,
);
const budgetBody =
  budgetMerge.sections.find((row) => row.id === "summary")?.body || "";
if (/R\s?999/.test(budgetBody)) {
  checks.push("gemini kept an extra rand amount beside the briefed budget");
}

const rapKeep = rebuildSepDocument(
  {
    ...housing,
    title: "SEP — RELOCATION AND MIGRATION PLAN",
    programmeKind: undefined,
    documentDrafter: "gemini",
    activities: housing.activities.filter((row) => row.id !== "census"),
    documentSections: housing.documentSections.map((row) =>
      row.id === "summary"
        ? {
            ...row,
            body: `${row.body}\n\nCensus, relocation, and cut-off will be locked at inception. Gemini-RAP sentence.`,
          }
        : row,
    ),
  },
  { touch: false, document: "keep" },
);
if (rapKeep.programmeKind !== "relocation") {
  checks.push(`rap keep programme=${rapKeep.programmeKind}`);
}
if (!rapKeep.documentSections[0]?.body.includes("Gemini-RAP sentence")) {
  checks.push("RAP overlay discarded a usable Gemini relocation draft");
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
