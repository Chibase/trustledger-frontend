/**
 * SEP Participatory Methodology Library
 * Phase D: TrustLedger SRM — SEP Generation Specification v1.0
 *
 * Specification Section 9: Participatory Methodology Library
 * Specification Section 9.1: Method Selection Matrix
 */

import type { MethodSelection, StakeholderProfile } from "@/types/sepAnalysis";

export type MethodLibraryId = "pra" | "pla" | "cbpr";

export type MethodLibraryEntry = {
  id: MethodLibraryId;
  name: string;
  primaryRole: string;
  description: string;
  examples: string[];
  selectionCriteria: string;
  participantRequirements: string[];
  typicalDuration: string;
  procedures: string[];
  expectedOutputs: string[];
  evidenceRequirements: string[];
  limitations: string[];
  reference?: string;
};

export const METHOD_LIBRARY: Record<MethodLibraryId, MethodLibraryEntry> = {
  pra: {
    id: "pra",
    name: "Participatory Rural Appraisal",
    primaryRole: "Participatory diagnosis and local knowledge generation",
    description:
      "PRA is a family of visual, group-based tools used to generate grounded understanding of local conditions, assets, vulnerabilities, services, livelihoods and priorities. It is diagnostic: communities analyse their own situation rather than responding only to externally framed questionnaires.",
    examples: [
      "mapping",
      "transects",
      "seasonal calendars",
      "social mapping",
      "ranking",
      "timelines",
      "problem trees",
    ],
    selectionCriteria:
      "Use for grounded understanding of context, assets, vulnerabilities, services, livelihoods and priorities — especially at inception and before design choices are locked.",
    participantRequirements: [
      "Affected people (not only representatives)",
      "Community leaders whose legitimacy can be checked",
      "Knowledge holders (elders, resource users, traders)",
      "Trained facilitator and note-taker",
    ],
    typicalDuration: "3–4 days for a full participatory appraisal; 2–4 hours per tool",
    procedures: [
      "1. Participatory mapping: geographic features, infrastructure, household distribution, access routes",
      "2. Transect walks: observe and discuss landscape, services, and change with local guides",
      "3. Seasonal calendars: identify livelihood cycles, hunger periods, and critical windows",
      "4. Social/institutional mapping: formal and informal structures that actually govern decisions",
      "5. Problem trees: root causes and effects of the issues the assignment must address",
      "6. Ranking/scoring: priorities, preferences, constraints, and trade-offs",
    ],
    expectedOutputs: [
      "Validated social context map",
      "Livelihood analysis",
      "Vulnerability matrix",
      "Institutional map",
    ],
    evidenceRequirements: [
      "Field notes",
      "Photographs (with consent)",
      "Sketches / maps",
      "Signed validation forms",
      "Attendance register (disaggregated)",
    ],
    limitations: [
      "Power dynamics can silence women, youth, or informal occupants in mixed groups",
      "Trained facilitators are required",
      "Time-intensive; not a substitute for statutory process",
    ],
    reference: "Chambers 1994; FAO PRA Manual",
  },
  pla: {
    id: "pla",
    name: "Participatory Learning and Action",
    primaryRole: "Joint learning, planning, and adaptation",
    description:
      "PLA extends appraisal into cycles of planning, action, and reflection. Communities and the implementing team learn from evidence, set priorities, agree actions, and adapt the programme. It is the method of choice when stakeholders must influence design choices that will actually be implemented.",
    examples: [
      "action planning",
      "participatory budgeting",
      "community scorecards",
      "after-action review",
      "priority matrix",
      "option ranking",
    ],
    selectionCriteria:
      "Use when the assignment must move from diagnosis to agreed action — restoration options, host-community consent, grievance design, sequencing, or mid-course adaptation.",
    participantRequirements: [
      "People who will live with the decision",
      "Decision-owners who can say what is negotiable",
      "Vulnerable-group representatives whose mandate is validated",
      "Recorder for commitments and dissent",
    ],
    typicalDuration: "Half-day to two-day workshops; repeat at decision gates",
    procedures: [
      "1. Recap validated findings (do not re-diagnose from scratch)",
      "2. Surface options that are actually available (no invented packages)",
      "3. Rank options against criteria the group agrees (cost, risk, timing, fairness)",
      "4. Record what stakeholders can influence versus what is already fixed",
      "5. Convert ranked options into an action plan with owners and evidence",
      "6. Schedule an after-action review or scorecard at the next gate",
    ],
    expectedOutputs: [
      "Priority matrix",
      "Agreed action plan",
      "Decision log (what changed because of participation)",
      "Community scorecard / after-action notes",
    ],
    evidenceRequirements: [
      "Workshop notes",
      "Option-ranking sheets",
      "Signed attendance",
      "Decision log",
      "Feedback to participants on what happened to their input",
    ],
    limitations: [
      "Fails if 'consultation' is held after decisions are already locked",
      "Requires an honest statement of what is negotiable",
      "Elite capture if only office-bearers attend",
    ],
    reference: "Chambers 2008; IIED PLA Notes",
  },
  cbpr: {
    id: "cbpr",
    name: "Community-Based Participatory Research",
    primaryRole: "Co-produced knowledge used for shared decisions",
    description:
      "CBPR treats affected people as co-researchers. Instruments, analysis, and findings are designed and validated with the community so that census data, impact evidence, and monitoring measures are owned locally and usable in decisions.",
    examples: [
      "participatory census",
      "photovoice",
      "community-designed survey",
      "joint analysis workshop",
      "co-authored findings brief",
      "household verification walks",
    ],
    selectionCriteria:
      "Use when knowledge must be co-produced and relied upon — household census, entitlement lists, impact evidence, or monitoring that communities will later use to hold the project to account.",
    participantRequirements: [
      "Affected households or their validated representatives",
      "Local enumerators / community researchers",
      "Person responsible for personal-information safeguards",
      "Joint analysis session before findings are treated as final",
    ],
    typicalDuration: "Multi-week cycles (instrument design → collection → joint analysis)",
    procedures: [
      "1. Agree the research questions with affected people (what must be known to decide)",
      "2. Co-design instruments (census fields, survey items, photovoice prompts)",
      "3. Train community researchers; agree consent, privacy, and grievance for research conduct",
      "4. Collect and verify data with households (not from a list invented off-site)",
      "5. Joint analysis workshop: findings, dissent, and gaps marked TBC",
      "6. Return results before they are used in entitlements or reports",
    ],
    expectedOutputs: [
      "Validated household census / register",
      "Co-analysed impact findings",
      "Community-owned evidence pack",
      "Gaps log (items still to be confirmed)",
    ],
    evidenceRequirements: [
      "Consent records",
      "Instrument version log",
      "Enumerator notes",
      "Joint analysis attendance and minutes",
      "Returned-findings acknowledgement",
    ],
    limitations: [
      "Slower than extractive surveys",
      "Personal information must be minimised and protected",
      "Cannot invent household counts to fill a tender estimate",
    ],
    reference: "Israel et al. 1998; Minkler & Wallerstein",
  },
};

/**
 * Specification Section 9.1 — objective → preferred method → example output.
 */
export const METHOD_SELECTION_MATRIX: Array<{
  objectivePattern: RegExp;
  objective: string;
  preferredMethod: MethodLibraryId;
  exampleOutput: string;
}> = [
  {
    objectivePattern: /understand|diagnos|local condition|context|asset|map/i,
    objective: "Understand local conditions",
    preferredMethod: "pra",
    exampleOutput: "Validated social/context map",
  },
  {
    objectivePattern: /livelihood|seasonal|income|restoration pathway/i,
    objective: "Diagnose livelihood systems",
    preferredMethod: "pra",
    exampleOutput: "Seasonal calendar and livelihood ranking",
  },
  {
    objectivePattern: /vulnerab|inclusion|barrier|women|disabled|elderly/i,
    objective: "Identify vulnerability and participation barriers",
    preferredMethod: "pra",
    exampleOutput: "Vulnerability matrix",
  },
  {
    objectivePattern: /plan|option|entitlement|consent|priority|sequence/i,
    objective: "Plan engagement and restoration",
    preferredMethod: "pla",
    exampleOutput: "Action plan and priority matrix",
  },
  {
    objectivePattern: /adapt|scorecard|after-action|learning|mid-course/i,
    objective: "Adapt the programme during implementation",
    preferredMethod: "pla",
    exampleOutput: "After-action review / community scorecard",
  },
  {
    objectivePattern: /grievance|redress|complaint|mechanism/i,
    objective: "Co-design grievance handling",
    preferredMethod: "pla",
    exampleOutput: "Agreed grievance workflow and service levels",
  },
  {
    objectivePattern: /census|household register|enumerat|headcount/i,
    objective: "Co-produce census / household knowledge",
    preferredMethod: "cbpr",
    exampleOutput: "Validated household census",
  },
  {
    objectivePattern: /research|impact evidence|co-produc|photovoice|survey/i,
    objective: "Joint research on impacts",
    preferredMethod: "cbpr",
    exampleOutput: "Co-analysed impact findings",
  },
];

export type MethodConstraint = {
  durationMonths?: number;
  budget?: string;
};

function toolFor(entry: MethodLibraryEntry, objective: string): string {
  const lower = objective.toLowerCase();
  const hit = entry.examples.find((example) => lower.includes(example.split(" ")[0]!));
  return hit || entry.examples[0]!;
}

function scoreMethod(
  method: MethodLibraryId,
  objective: string,
  constraints?: MethodConstraint,
): number {
  let score = 0;
  for (const row of METHOD_SELECTION_MATRIX) {
    if (row.objectivePattern.test(objective) && row.preferredMethod === method) {
      score += 3;
    }
  }
  const entry = METHOD_LIBRARY[method];
  if (entry.selectionCriteria.toLowerCase().split(/\W+/).some((w) => w.length > 4 && objective.toLowerCase().includes(w))) {
    score += 1;
  }
  if (constraints?.durationMonths && constraints.durationMonths <= 3 && method === "cbpr") {
    score -= 1;
  }
  return score;
}

/**
 * Match an engagement objective to PRA / PLA / CBPR, ranked by fit.
 */
export function selectMethodsForObjective(
  objective: string,
  stakeholders: StakeholderProfile[],
  constraints?: MethodConstraint,
): MethodSelection[] {
  const createdAt = new Date().toISOString();
  const participantNames = stakeholders
    .slice(0, 6)
    .map((row) => row.nameOrCategory);

  const ranked = (Object.keys(METHOD_LIBRARY) as MethodLibraryId[])
    .map((id) => ({ id, score: scoreMethod(id, objective, constraints) }))
    .sort((a, b) => b.score - a.score);

  const preferred = METHOD_SELECTION_MATRIX.find((row) =>
    row.objectivePattern.test(objective),
  );

  return ranked.map((row, index) => {
    const entry = METHOD_LIBRARY[row.id];
    const matrixHit = METHOD_SELECTION_MATRIX.find(
      (item) => item.preferredMethod === row.id && item.objectivePattern.test(objective),
    );
    return {
      id: `MS-${row.id}-${index + 1}`,
      engagementActivityId: "unassigned",
      methodology: row.id,
      tool: toolFor(entry, objective),
      selectedForObjective: objective,
      selectionRationale: matrixHit
        ? `Preferred for “${matrixHit.objective}” (Specification 9.1). ${entry.selectionCriteria}`
        : `${entry.selectionCriteria} Ranked ${index + 1} for this objective.`,
      participantRequirements:
        participantNames.length > 0
          ? [...entry.participantRequirements, `Named groups: ${participantNames.join("; ")}`]
          : entry.participantRequirements,
      estimatedDuration: entry.typicalDuration,
      procedures: entry.procedures,
      expectedOutputs: matrixHit ? [matrixHit.exampleOutput, ...entry.expectedOutputs] : entry.expectedOutputs,
      evidenceRequirements: entry.evidenceRequirements,
      limitations: entry.limitations,
      methodologyReference: entry.reference,
      createdAt,
    };
  });
}

export function getMethodEntry(
  methodology: MethodSelection["methodology"],
): MethodLibraryEntry | null {
  if (methodology === "pra" || methodology === "pla" || methodology === "cbpr") {
    return METHOD_LIBRARY[methodology];
  }
  return null;
}

/**
 * Check that a selection’s tool, procedures, and outputs sit inside the library definition.
 */
export function validateMethodSelection(
  selection: MethodSelection,
  libraryEntry: MethodLibraryEntry,
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (selection.methodology !== libraryEntry.id && selection.methodology !== "other") {
    warnings.push(
      `Selection methodology (${selection.methodology}) does not match library entry (${libraryEntry.id}).`,
    );
  }

  if (!selection.selectedForObjective.trim()) {
    warnings.push("Selection is missing the objective it was chosen for.");
  }
  if (!selection.selectionRationale.trim()) {
    warnings.push("Selection is missing a rationale — method integrity requires a stated why.");
  }

  if (selection.tool) {
    const toolKnown = libraryEntry.examples.some((example) =>
      selection.tool!.toLowerCase().includes(example.toLowerCase()) ||
      example.toLowerCase().includes(selection.tool!.toLowerCase()),
    );
    if (!toolKnown) {
      warnings.push(
        `Tool “${selection.tool}” is not among the ${libraryEntry.name} examples (${libraryEntry.examples.join(", ")}).`,
      );
    }
  }

  if (!selection.procedures.length) {
    warnings.push("No procedures recorded; cannot verify method integrity.");
  }
  if (!selection.expectedOutputs.length) {
    warnings.push("No expected outputs recorded.");
  }
  if (!selection.evidenceRequirements.length) {
    warnings.push("No evidence requirements recorded.");
  }

  const outputAligned = selection.expectedOutputs.some((output) =>
    libraryEntry.expectedOutputs.some(
      (expected) =>
        output.toLowerCase().includes(expected.toLowerCase().split(" ")[0]!) ||
        expected.toLowerCase().includes(output.toLowerCase().split(" ")[0]!),
    ),
  );
  if (selection.expectedOutputs.length > 0 && !outputAligned) {
    warnings.push("Expected outputs do not align with the library definition for this method.");
  }

  return { valid: warnings.length === 0, warnings };
}
