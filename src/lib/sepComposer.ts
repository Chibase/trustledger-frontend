/**
 * Local SEP composer — maps a briefing/RFP/tender onto a sector playbook.
 * Suggestions only; humans apply. Does not call Cloud LLM (reportComposer rule).
 */

import { SEP_SECTOR_PLAYBOOKS } from "@/data/sepSectors";
import { SEP_SLB_LANES, SLB_PHILOSOPHY } from "@/lib/sepExecution";
import {
  catalogInstrumentsByIds,
  detectCatalogInstruments,
} from "@/lib/sepInstruments";
import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
  vulnerabilityForClass,
} from "@/lib/sepMatrix";
import type {
  EngagementPlan,
  SepInstrument,
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
  const district = text.match(
    /\b([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,2}\s+district(?:\s+municipality)?)\b/,
  );
  const parts = [
    muni?.[1],
    district?.[1],
    ward ? `Ward ${ward[1]}` : null,
    text.match(/\b(eastern cape|western cape|gauteng|kwazulu-natal|limpopo|mpumalanga|north west|northern cape|free state)\b/i)?.[1],
  ].filter(Boolean) as string[];
  return unique(parts).join(" · ").slice(0, 180);
}

function extractTimeline(text: string): string {
  const labeled = text.match(
    /\b(?:contract period|duration|timeline|programme period|construction period)\s*[:—-]\s*([^\n.]{6,80})/i,
  );
  if (labeled?.[1]) return labeled[1].trim();
  const span = text.match(
    /\b((?:january|february|march|april|may|june|july|august|september|october|november|december)\s+20\d{2}\s+(?:to|–|-|through)\s+(?:january|february|march|april|may|june|july|august|september|october|november|december)\s+20\d{2})\b/i,
  );
  if (span?.[1]) return span[1];
  const months = text.match(/\b(\d{1,2}\s*(?:month|year)s?)\b/i);
  if (months?.[1]) return months[1];
  const years = text.match(/\b(20\d{2}\s*[–-]\s*20\d{2})\b/);
  return years?.[1] || "";
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
  const attached = new Set<string>();
  const next = classes.map((row) => {
    if (row.id === "client-funder" || row.id === "local-government") {
      const hits = named.filter((name) =>
        /municipality|department|agency|pty|ltd|soc/i.test(name),
      );
      hits.forEach((name) => attached.add(name.toLowerCase()));
      return hits.length ? { ...row, namedFromBrief: hits.slice(0, 4) } : row;
    }
    if (row.id === "traditional-authority") {
      const hits = named.filter((name) =>
        /traditional|royal|inkosi|kgosi/i.test(name),
      );
      hits.forEach((name) => attached.add(name.toLowerCase()));
      return hits.length ? { ...row, namedFromBrief: hits.slice(0, 4) } : row;
    }
    return row;
  });
  const leftover = named.filter((name) => !attached.has(name.toLowerCase()));
  if (!leftover.length) return next;
  let placed = false;
  return next.map((row) => {
    if (placed) return row;
    if (row.kind === "community_group") {
      placed = true;
      return {
        ...row,
        namedFromBrief: unique([
          ...(row.namedFromBrief || []),
          ...leftover,
        ]).slice(0, 6),
      };
    }
    return row;
  });
}

function lane(id: (typeof SEP_SLB_LANES)[number]["id"]) {
  return SEP_SLB_LANES.find((row) => row.id === id)!;
}

function buildDocument(plan: Omit<EngagementPlan, "documentSections">): EngagementPlan["documentSections"] {
  const sector = SEP_SECTOR_LABELS[plan.sectorId];
  const named = plan.stakeholderClasses
    .flatMap((row) => row.namedFromBrief || [])
    .slice(0, 8);
  const map = lane("map");
  const grievance = lane("grievance");
  const procure = lane("procure");
  const engage = lane("engage");
  const themba = lane("themba");

  const matrix = plan.stakeholderClasses
    .map((row) => {
      const q = SEP_QUADRANT_LABELS[quadrantForClass(row)];
      return `**${row.label}** — power ${row.influence}, interest ${interestForClass(row)} → **${q}**. ${row.why} Vulnerability: ${vulnerabilityForClass(row)}${
        row.namedFromBrief?.length ? ` Named in brief: ${row.namedFromBrief.join(", ")}.` : ""
      }`;
    })
    .join("\n\n");

  return [
    {
      id: "summary",
      heading: "1. Executive summary & Social Licence to Build™ philosophy",
      body: [
        plan.purposeStatement,
        "",
        `This Stakeholder Engagement Plan is prepared for a **${sector.toLowerCase()}** assignment from a ${plan.sourceKind === "manual" ? "structured facts pack (no tender file)" : `${plan.sourceKind} extract`}. Working title: ${plan.projectNameHint || "to be confirmed in inception"}.`,
        plan.clientFunderHint
          ? `Procuring entity / client (${plan.sourceKind === "manual" ? "from facts" : "from brief"}): ${plan.clientFunderHint}.`
          : null,
        plan.placeHint ? `Place sketched: ${plan.placeHint}.` : "Place is not yet locked — inception must name municipality, ward, and customary structure.",
        plan.timelineHint ? `Timeline sketched: ${plan.timelineHint}.` : "Contract period was not extracted — add it before the client presentation.",
        "",
        SLB_PHILOSOPHY,
      ]
        .filter((row) => row !== null)
        .join("\n"),
      protocol: `${map.protocol}\n\n${engage.protocol}\n\n${themba.protocol}`,
    },
    {
      id: "compliance",
      heading: "2. Regulatory & compliance mapping",
      body: plan.instruments.length
        ? plan.instruments
            .map((row) => `**${row.label}.** ${row.note}`)
            .join("\n\n")
        : "No statute or funder safeguard was confidently extracted. Add only instruments the client or briefing confirms (for example NEMA public participation, IFC Performance Standards, SLP, WULA). This section is not legal advice.",
      protocol:
        "Cited instruments become Engagement cadence (statutory meetings) and Commitments (conditions with owners). They are not parked in an appendix. Geo / Place attaches the ward and customary structure the instrument is exercised in.",
    },
    {
      id: "stakeholders",
      heading: "3. Stakeholder identification & vulnerability analysis",
      body: `${matrix}\n\nPower–interest is a working segmentation for the desk, not a political judgement. PAP / I&AP names are listed only when they appear in the extract. Land-rights and historical grievances belong on Incidents once a case exists — the composer does not invent them.`,
      protocol: map.protocol,
    },
    {
      id: "methods",
      heading: "4. Operational engagement methodology",
      body: [
        ...plan.phases.map(
          (phase) =>
            `**Phase ${phase.order} — ${phase.title}** (${phase.typicalDuration}). ${phase.intent} Exit: ${phase.exitCriteria}`,
        ),
        "",
        ...plan.activities.map(
          (act) =>
            `**${act.title}** — ${act.method} (${act.engagementKind}). Owner: ${act.ownerHint}. Timing: ${act.timingHint}. Evidence: ${act.evidenceHint}. Desk: ${act.module}.`,
        ),
      ].join("\n\n"),
      protocol: engage.protocol,
    },
    {
      id: "grievance",
      heading: "5. Risk mitigation & grievance mechanism architecture",
      body: [
        `**Grievance path.** ${plan.grievancePath}`,
        "",
        "**TrustLedger case lifecycle (shipped):** lodgment via Report issue → acknowledgment on the case (SLA due date) → investigation → resolution → community/supervisor verify → close. Escalation levels and owners are on the record.",
        "",
        plan.commitments.length
          ? plan.commitments
              .map((row) => `**${row.title}** — ${row.ownerHint}; ${row.dueHint}. ${row.why}`)
              .join("\n\n")
          : "Standing commitments will be named at first contact — do not invent dates.",
        named.length
          ? `\n\nNamed counterpart organisations detected: ${named.join("; ")}.`
          : "",
      ].join("\n"),
      protocol: `${grievance.protocol}\n\n${procure.protocol}`,
    },
    {
      id: "monitoring",
      heading: "6. Monitoring, evaluation & real-time reporting",
      body: "Reports on TrustLedger compose from saved work: engagements (who was in the room), commitments (what was promised), incidents (what was raised and closed), and Intelligence (labour / local content / empowerment facts on the project). Activity reports and compliance briefs use the local evidence composer — they are not fill-in-the-blank month-end templates from a cloud model. Empty reports mean empty desk work.",
      protocol:
        "After award, Apply this plan so prospect stakeholders, draft engagements, and open commitments land on the existing desks. Capture templates stay on the engagement rows. Humans apply; the composer never writes the live desk alone. Board and funder packs then cite that trail.",
    },
    {
      id: "assumptions",
      heading: "7. Assumptions and limits",
      body: plan.assumptions.map((row) => `• ${row}`).join("\n"),
      protocol:
        "Limits stay on the exported plan. Apply still only writes named classes, draft engagements, and open commitments — never invented people or grievance cases. Empty reports mean empty desk work.",
    },
  ];
}

export type ComposeSepInput = {
  text: string;
  sectorId?: SepSectorId | "auto";
  projectId?: string | null;
  projectName?: string;
  placeHint?: string;
  clientHint?: string;
  timelineHint?: string;
  purposeOverride?: string;
  /** Extra instruments ticked on the facts pack (or added to a tender compose). */
  instrumentIds?: string[];
  /** Operator-named PAP / I&AP organisations (not invented by the composer). */
  namedParties?: string[];
};

export type SepExtractPreview = {
  title: string;
  place: string;
  client: string;
  timeline: string;
  sectorId: SepSectorId;
  sourceKind: SepSourceKind;
  instruments: SepInstrument[];
  namedParties: string[];
};

export function previewSepExtract(text: string): SepExtractPreview {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      title: "",
      place: "",
      client: "",
      timeline: "",
      sectorId: "generic",
      sourceKind: "paste",
      instruments: [],
      namedParties: [],
    };
  }
  return {
    title: extractTitle(trimmed),
    place: extractPlace(trimmed),
    client: extractClient(trimmed),
    timeline: extractTimeline(trimmed),
    sectorId: detectSepSector(trimmed),
    sourceKind: detectSepSourceKind(trimmed),
    instruments: detectCatalogInstruments(trimmed),
    namedParties: extractNamedParties(trimmed),
  };
}

export function composeEngagementPlan(input: ComposeSepInput): EngagementPlan {
  const rawText = (input.text || "").trim();
  const usedPlaybookOnly = !rawText;
  const sectorHint =
    !input.sectorId || input.sectorId === "auto"
      ? detectSepSector(rawText)
      : input.sectorId;
  const playbook = SEP_SECTOR_PLAYBOOKS[sectorHint];
  const text = rawText || playbook.summary;
  const sectorId = sectorHint;
  const named = unique([
    ...(input.namedParties || []).map((row) => row.trim()).filter(Boolean),
    ...(usedPlaybookOnly ? [] : extractNamedParties(text)),
  ]);
  const now = new Date().toISOString();
  const titleBase =
    input.projectName?.trim() ||
    (usedPlaybookOnly ? SEP_SECTOR_LABELS[sectorId] : extractTitle(text));
  const detected = usedPlaybookOnly ? [] : detectCatalogInstruments(text);
  const sourceKind: SepSourceKind = usedPlaybookOnly
    ? "manual"
    : detectSepSourceKind(text);

  const base: Omit<EngagementPlan, "documentSections"> = {
    id: `SEP-${Date.now().toString(36).toUpperCase()}`,
    title: `SEP — ${titleBase}`.slice(0, 160),
    status: "suggested",
    sourceKind,
    sectorId,
    projectId: input.projectId || null,
    projectNameHint: titleBase,
    placeHint: input.placeHint?.trim() || (usedPlaybookOnly ? "" : extractPlace(text)),
    clientFunderHint:
      input.clientHint?.trim() || (usedPlaybookOnly ? "" : extractClient(text)),
    timelineHint:
      input.timelineHint?.trim() || (usedPlaybookOnly ? "" : extractTimeline(text)),
    createdAt: now,
    updatedAt: now,
    sourceExcerpt: usedPlaybookOnly
      ? snippet(
          `Facts pack · ${SEP_SECTOR_LABELS[sectorId]}. ${playbook.summary}`,
        )
      : snippet(text),
    purposeStatement:
      input.purposeOverride?.trim() || extractPurpose(text),
    phases: playbook.phases,
    stakeholderClasses: mergeNamedIntoClasses(
      playbook.stakeholderClasses,
      named,
    ),
    activities: playbook.activities,
    commitments: playbook.commitments,
    instruments: uniqueInstruments([
      ...catalogInstrumentsByIds(input.instrumentIds || []),
      ...detected,
      ...playbook.instruments,
    ]),
    grievancePath: playbook.grievancePath,
    assumptions: [
      ...playbook.assumptions,
      "Composer output is a suggestion from the extract (or facts pack) plus the sector playbook. Edit before presenting to a client.",
      "Named people are only listed when they appear in the briefing or the facts pack. Do not invent counterparts.",
      "Social Licence to Build™ is mapped to shipped TrustLedger modules. This document does not claim unshipped portals, GIS editing, or a staffed 24/7 division.",
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

export function rebuildSepDocument(
  plan: EngagementPlan,
  opts?: { touch?: boolean },
): EngagementPlan {
  const next = {
    ...plan,
    timelineHint: plan.timelineHint || "",
    updatedAt:
      opts?.touch === false ? plan.updatedAt : new Date().toISOString(),
  };
  return { ...next, documentSections: buildDocument(next) };
}
