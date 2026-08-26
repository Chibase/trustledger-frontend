/**
 * Local SEP composer — maps a briefing/RFP/tender onto a sector playbook.
 * Suggestions only; humans apply. Does not call Cloud LLM (reportComposer rule).
 */

import { SEP_SECTOR_PLAYBOOKS } from "@/data/sepSectors";
import type {
  EngagementPlan,
  SepSectorId,
  SepSourceKind,
  SepStakeholderClass,
} from "@/types/engagementPlan";
import { SEP_SECTOR_LABELS } from "@/types/engagementPlan";

const SECTOR_HINTS: Array<{ id: SepSectorId; re: RegExp }> = [
  { id: "mining", re: /\b(mining|mine|mprda|slp|extractive|opencast|shaft)\b/i },
  { id: "energy", re: /\b(ipp|reipppp|solar|wind farm|pv plant|substation|grid connection|generation)\b/i },
  { id: "water", re: /\b(wula|water use|sanitation|wastewater|reservoir|bulk water|sewer)\b/i },
  { id: "housing", re: /\b(housing|human settlement|bn g|rental stock|informal settlement|beneficiary list)\b/i },
  { id: "infrastructure", re: /\b(road|highway|bridge|stormwater|bulk earthworks|public works|civil works)\b/i },
  { id: "municipal", re: /\b(idp|led strategy|municipality|ward committee|mfma|municipal)\b/i },
  { id: "conservation", re: /\b(protected area|heritage|sahra|stewardship|biodiversity|national park)\b/i },
  { id: "logistics", re: /\b(port|harbour|rail yard|freight|container terminal|truck staging)\b/i },
  { id: "agriculture", re: /\b(irrigation|smallholder|agri[- ]?park|farmers. association|grazing)\b/i },
  { id: "education", re: /\b(school|sgb|learner|education district|classroom block)\b/i },
  { id: "health", re: /\b(clinic|hospital|phc|health facility|maternity)\b/i },
];

const INSTRUMENT_HINTS: Array<{ id: string; re: RegExp; label: string; note: string }> = [
  {
    id: "nema-eia",
    re: /\b(nema|eia|bar\b|s&eir|scoping and eir|environmental authorisation|i&ap)\b/i,
    label: "Environmental authorisation / public participation",
    note: "I&AP rounds in the brief are engagements with minutes, not a side notebook.",
  },
  {
    id: "mprda-slp",
    re: /\b(mprda|social and labour plan|\bslp\b|mining charter)\b/i,
    label: "Mining social performance (as cited)",
    note: "SLP lines become commitments with evidence, not appendix claims.",
  },
  {
    id: "wula",
    re: /\b(wula|water use licence|water-use licence)\b/i,
    label: "Water-use authorisation (as cited)",
    note: "Licence consultation conditions belong on the engagement calendar.",
  },
  {
    id: "ifc",
    re: /\b(ifc performance|equator principle|ps1|esai|esmp)\b/i,
    label: "Funder safeguard (as cited)",
    note: "Only the standard named in the RFP. Map it onto registry, engagements, and grievance.",
  },
  {
    id: "pppfa",
    re: /\b(pppfa|preferential procurement|local content|b-?bbee)\b/i,
    label: "Preferential procurement / local content (as cited)",
    note: "Labour and procurement targets feed Intelligence + commitments.",
  },
  {
    id: "spluma",
    re: /\b(spluma|land use|rezoning|township establishment)\b/i,
    label: "Land-use process (as cited)",
    note: "Statutory land-use meetings are still logged as engagements.",
  },
];

function cleanLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line.length > 3);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

export function detectSepSector(text: string): SepSectorId {
  const scores = new Map<SepSectorId, number>();
  for (const hint of SECTOR_HINTS) {
    const hits = text.match(new RegExp(hint.re, "gi"));
    if (hits?.length) scores.set(hint.id, hits.length);
  }
  const heading = text.split(/\r?\n/).slice(0, 8).join(" ");
  for (const hint of SECTOR_HINTS) {
    if (hint.re.test(heading)) {
      scores.set(hint.id, (scores.get(hint.id) || 0) + 3);
    }
  }
  let best: SepSectorId = "generic";
  let n = 0;
  for (const [id, count] of scores) {
    if (count > n) {
      best = id;
      n = count;
    }
  }
  return best;
}

export function detectSepSourceKind(text: string): SepSourceKind {
  if (/\brequest for proposal\b|\brfp\b/i.test(text)) return "rfp";
  if (/\btender\b|\bbid document\b|\binvitation to bid\b/i.test(text)) {
    return "tender";
  }
  if (/\bbriefing\b|\bscope of work\b|\bterms of reference\b|\btor\b/i.test(text)) {
    return "briefing";
  }
  return "paste";
}

function extractTitle(text: string): string {
  const lines = cleanLines(text).slice(0, 40);
  const named = lines.find((line) =>
    /^(project|programme|assignment|title)\s*[:—-]/i.test(line),
  );
  if (named) {
    return named.replace(/^(project|programme|assignment|title)\s*[:—-]\s*/i, "").slice(0, 140);
  }
  const heading = lines.find(
    (line) =>
      line.length > 12 &&
      line.length < 140 &&
      !/^(request for proposal|confidential|page \d)/i.test(line),
  );
  return heading || "Stakeholder engagement plan";
}

function extractPlace(text: string): string {
  const ward = text.match(/\bward\s+(\d{1,3})\b/i);
  const muni = text.match(
    /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3}\s+(?:local|metropolitan)\s+municipality)\b/,
  );
  const parts = [
    muni?.[1],
    ward ? `Ward ${ward[1]}` : null,
    text.match(/\b(eastern cape|western cape|gauteng|kwazulu-natal|limpopo|mpumalanga|north west|northern cape|free state)\b/i)?.[1],
  ].filter(Boolean) as string[];
  return unique(parts).join(" · ").slice(0, 180);
}

function extractClient(text: string): string {
  const labeled = text.match(
    /\b(?:client|employer|procuring entity|department)\s*[:—-]\s*([^\n.]{8,80})/i,
  );
  if (labeled?.[1]) return labeled[1].trim();
  const org = text.match(
    /\b([A-Z][A-Za-z0-9&.’' -]{3,60}(?:Pty Ltd|Limited|Municipality|Department|Agency|SOC))\b/,
  );
  return org?.[1]?.trim() || "";
}

function extractNamedParties(text: string): string[] {
  const matches = text.match(
    /\b[A-Z][A-Za-z0-9&.’']+(?:\s+[A-Z][A-Za-z0-9&.’']+){0,4}\s+(?:Pty Ltd|Ltd|Limited|Municipality|Traditional Council|Royal Council|Trust|Forum|Association)\b/g,
  );
  return unique(matches || []).slice(0, 8);
}

function extractPurpose(text: string): string {
  if (/\b(resettle|rap\b|relocation)\b/i.test(text)) {
    return "Consult affected people on land access and livelihood change, and keep a grievance path that can carry RAP issues without losing the thread.";
  }
  if (/\b(grievance|complaint|remediat)/i.test(text)) {
    return "Remediate existing harm and restore a credible update cadence — not only announce the next phase of works.";
  }
  if (/\b(decide|consent|agreement)\b/i.test(text)) {
    return "Move named counterparts from information to a recorded decision, with commitments owned after the room empties.";
  }
  if (/\b(i&ap|public participation|consult)/i.test(text)) {
    return "Consult affected people and authorities so the project can show who was heard, what was promised, and what remains open.";
  }
  return "Inform and consult the people who can grant or withhold social licence, then keep promises and grievances on one trail.";
}

function snippet(text: string, limit = 1800): string {
  const trimmed = text.replace(/\u0000/g, "").trim();
  if (trimmed.length <= limit) return trimmed;
  return `${trimmed.slice(0, limit).trim()}…`;
}

function mergeNamedIntoClasses(
  classes: SepStakeholderClass[],
  named: string[],
): SepStakeholderClass[] {
  if (!named.length) return classes;
  return classes.map((row) => {
    if (row.id === "client-funder" || row.id === "local-government") {
      const hits = named.filter((name) =>
        /municipality|department|agency|pty|ltd|soc/i.test(name),
      );
      return hits.length ? { ...row, namedFromBrief: hits.slice(0, 4) } : row;
    }
    if (row.id === "traditional-authority") {
      const hits = named.filter((name) =>
        /traditional|royal|inkosi|kgosi/i.test(name),
      );
      return hits.length ? { ...row, namedFromBrief: hits.slice(0, 4) } : row;
    }
    return row;
  });
}

function buildDocument(plan: Omit<EngagementPlan, "documentSections">): EngagementPlan["documentSections"] {
  const sector = SEP_SECTOR_LABELS[plan.sectorId];
  const named = plan.stakeholderClasses
    .flatMap((row) => row.namedFromBrief || [])
    .slice(0, 8);
  return [
    {
      id: "purpose",
      heading: "1. Purpose of this plan",
      body: `${plan.purposeStatement}\n\nThis Stakeholder Engagement Plan (SEP) is prepared from the supplied ${plan.sourceKind} briefing for a ${sector.toLowerCase()} assignment. It is a working plan for the TrustLedger SRM desk — not a substitute for statutory processes named in the briefing, and not legal advice.`,
    },
    {
      id: "context",
      heading: "2. Assignment context",
      body: [
        plan.projectNameHint ? `Working title: ${plan.projectNameHint}.` : null,
        plan.clientFunderHint ? `Client / procuring entity (from brief): ${plan.clientFunderHint}.` : null,
        plan.placeHint ? `Place sketched from the brief: ${plan.placeHint}.` : "Place is not yet clear in the brief — lock municipality, ward, and customary structure in inception.",
        named.length
          ? `Named counterpart organisations detected in the brief: ${named.join("; ")}.`
          : "No organisation names were confidently extracted — inception should add them by hand.",
        plan.instruments.length
          ? `Instruments cited or detected: ${plan.instruments.map((i) => i.label).join("; ")}.`
          : "No statutes were detected in the extract. Add only instruments the client confirms.",
      ]
        .filter(Boolean)
        .join(" "),
    },
    {
      id: "analysis",
      heading: "3. Stakeholder analysis",
      body: plan.stakeholderClasses
        .map(
          (row) =>
            `**${row.label}** (${row.kind.replaceAll("_", " ")}, ${row.influence} influence, purpose: ${row.purpose}). ${row.why}${
              row.namedFromBrief?.length
                ? ` Named in brief: ${row.namedFromBrief.join(", ")}.`
                : ""
            }`,
        )
        .join("\n\n"),
    },
    {
      id: "process",
      heading: "4. Process from inception to close-out",
      body: plan.phases
        .map(
          (phase) =>
            `**Phase ${phase.order} — ${phase.title}** (${phase.typicalDuration}). ${phase.intent} Exit: ${phase.exitCriteria}`,
        )
        .join("\n\n"),
    },
    {
      id: "methods",
      heading: "5. Methods, cadence and evidence",
      body: plan.activities
        .map(
          (act) =>
            `**${act.title}** — ${act.method} (${act.engagementKind}). Owner: ${act.ownerHint}. Timing: ${act.timingHint}. Evidence: ${act.evidenceHint}. Lands in ${act.module}.`,
        )
        .join("\n\n"),
    },
    {
      id: "promises",
      heading: "6. Standing commitments and grievance",
      body: `${plan.commitments.map((row) => `**${row.title}** — ${row.ownerHint}; ${row.dueHint}. ${row.why}`).join("\n\n")}\n\n**Grievance path:** ${plan.grievancePath}`,
    },
    {
      id: "srm",
      heading: "7. How this seeds the SRM after approval",
      body: "When the client approves the assignment, apply this plan on the TrustLedger desk: stakeholder classes become registry rows, planned activities become draft engagements (minutes/attendance via Capture), standing promises become the commitments board, and the grievance path is the Incidents desk with one case ID. Reports later cite that trail — they are not rewritten from memory. Geo / Intelligence attach when place and labour/procurement facts exist. Humans apply each row; the composer never writes the live desk alone.",
    },
    {
      id: "assumptions",
      heading: "8. Assumptions and limits",
      body: plan.assumptions.map((row) => `• ${row}`).join("\n"),
    },
  ];
}

export type ComposeSepInput = {
  text: string;
  sectorId?: SepSectorId | "auto";
  projectId?: string | null;
  projectName?: string;
};

export function composeEngagementPlan(input: ComposeSepInput): EngagementPlan {
  const sectorHint =
    !input.sectorId || input.sectorId === "auto"
      ? detectSepSector((input.text || "").trim())
      : input.sectorId;
  const playbook = SEP_SECTOR_PLAYBOOKS[sectorHint];
  const text = (input.text || "").trim() || playbook.summary;
  const sectorId = sectorHint;
  const usedPlaybookOnly = !(input.text || "").trim();
  const named = extractNamedParties(text);
  const now = new Date().toISOString();
  const titleBase =
    input.projectName?.trim() ||
    (usedPlaybookOnly ? SEP_SECTOR_LABELS[sectorId] : extractTitle(text));
  const detected = INSTRUMENT_HINTS.filter((row) => row.re.test(text)).map(
    (row) => ({
      id: row.id,
      label: row.label,
      note: row.note,
    }),
  );

  const base: Omit<EngagementPlan, "documentSections"> = {
    id: `SEP-${Date.now().toString(36).toUpperCase()}`,
    title: `SEP — ${titleBase}`.slice(0, 160),
    status: "suggested",
    sourceKind: detectSepSourceKind(text),
    sectorId,
    projectId: input.projectId || null,
    projectNameHint: titleBase,
    placeHint: extractPlace(text),
    clientFunderHint: extractClient(text),
    createdAt: now,
    updatedAt: now,
    sourceExcerpt: snippet(text),
    purposeStatement: extractPurpose(text),
    phases: playbook.phases,
    stakeholderClasses: mergeNamedIntoClasses(
      playbook.stakeholderClasses,
      named,
    ),
    activities: playbook.activities,
    commitments: playbook.commitments,
    instruments: uniqueInstruments([...detected, ...playbook.instruments]),
    grievancePath: playbook.grievancePath,
    assumptions: [
      ...playbook.assumptions,
      "Composer output is a suggestion from the extract + sector playbook. Edit before presenting to a client.",
      "Named people are only listed when they appear in the briefing. Do not invent counterparts.",
    ],
  };

  return { ...base, documentSections: buildDocument(base) };
}

function uniqueInstruments(
  rows: EngagementPlan["instruments"],
): EngagementPlan["instruments"] {
  const seen = new Set<string>();
  const out: EngagementPlan["instruments"] = [];
  for (const row of rows) {
    const key = row.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function rebuildSepDocument(plan: EngagementPlan): EngagementPlan {
  const next = { ...plan, updatedAt: new Date().toISOString() };
  return { ...next, documentSections: buildDocument(next) };
}
