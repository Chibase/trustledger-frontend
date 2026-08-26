/**
 * Client-presentable SEP in tender-report format:
 * cover block, numbered sections, subsections, tables.
 * Explains this project, this document, and this plan — not product architecture.
 */

import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
} from "@/lib/sepMatrix";
import type {
  EngagementPlan,
  SepDocumentSection,
  SepDocumentTable,
  SepInstrument,
} from "@/types/engagementPlan";
import { SEP_PURPOSE_LABELS, SEP_SECTOR_LABELS } from "@/types/engagementPlan";

function uniqueNames(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const key = value.replace(/\s+/g, " ").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(value.replace(/\s+/g, " ").trim());
  }
  return out;
}

function namedLine(plan: Pick<EngagementPlan, "stakeholderClasses">): string {
  return uniqueNames(
    plan.stakeholderClasses.flatMap((row) => row.namedFromBrief || []),
  ).join("; ");
}

function assignment(plan: Omit<EngagementPlan, "documentSections">) {
  return {
    title: plan.projectNameHint || "this assignment",
    client:
      plan.clientFunderHint || "the procuring entity (to be named at inception)",
    place:
      plan.placeHint ||
      "the project area (municipality, ward, and customary structure to be locked at inception)",
    time: plan.timelineHint || "the contract period (to be confirmed at inception)",
    sector: SEP_SECTOR_LABELS[plan.sectorId],
    budget: plan.budgetHint?.trim() || "",
    tender: plan.tenderRefHint?.trim() || "",
    named: namedLine(plan),
  };
}

export function sepCoverBlurb(
  plan: Pick<EngagementPlan, "programmeKind">,
): string {
  if (plan.programmeKind === "relocation") {
    return "Stakeholder Engagement Plan for the relocation and migration of project-affected households.";
  }
  return "Stakeholder Engagement Plan for identification, consultation, promises, and grievance redress on this assignment.";
}

export const SEP_ISSUER_LINE = "Prepared by Chibase Consulting.";

export function sepCoverFields(
  plan: Pick<
    EngagementPlan,
    | "projectNameHint"
    | "clientFunderHint"
    | "placeHint"
    | "timelineHint"
    | "budgetHint"
    | "tenderRefHint"
    | "instruments"
    | "updatedAt"
    | "programmeKind"
    | "sectorId"
  >,
): Array<[string, string]> {
  const issued = new Date(plan.updatedAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const framework = plan.instruments
    .slice(0, 4)
    .map((row) => row.label.replace(/\s+\(.*as cited.*\)$/i, ""))
    .join("; ");
  return [
    ["Project name", plan.projectNameHint || ""],
    ["Tender / reference", plan.tenderRefHint || "As in the briefing"],
    ["Implementing entity", "Chibase Consulting"],
    ["Procuring entity", plan.clientFunderHint || ""],
    ["Location", plan.placeHint || ""],
    ["Duration", plan.timelineHint || ""],
    ["Sector", SEP_SECTOR_LABELS[plan.sectorId] || ""],
    ["Framework (as cited)", framework],
    ["Budget (as briefed)", plan.budgetHint || "To be confirmed in the financial proposal"],
    ["Date", issued],
  ].filter(([, v]) => Boolean(v)) as Array<[string, string]>;
}

function fieldVoice(value: string): string {
  return value
    .replace(/\([^)]*Capture[^)]*\)/gi, "")
    .replace(/\bCapture(?:\s+minutes)?(?:\s+template)?s?\b/gi, "meeting records")
    .replace(/\bon Capture\b/gi, "on the meeting record")
    .replace(/\bsit on Incidents\b/gi, "are entered in the grievance register")
    .replace(/\bIncidents\b/g, "the grievance register")
    .replace(/\bTrustLedger(?:\s+SRM)?\b/gi, "")
    .replace(/\bThemba\b/g, "")
    .replace(/\bApply\b/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

function instrumentLine(row: SepInstrument, rap: boolean): string {
  switch (row.id) {
    case "nema-eia":
    case "eia-ppp":
      return `**${row.label}.** Observed during authorisation public participation: I&AP identification, notice, comment windows, and written feedback. Minutes and an I&AP register are the record. Where relocation also applies, one register and one grievance path serve both processes.`;
    case "ifc-ps5":
      return `**${row.label}.** Observed from cut-off through restoration: census, eligibility, host-community consent before first arrivals, and livelihood follow-up. Claimed only if the briefing named it.`;
    case "ifc":
      return `**${row.label}.** Observed before irreversible decisions: disclosure, consultation, and a grievance path people can use. Only the standard the client or funder cited is claimed.${rap ? " Cut-off and census precede packages." : ""}`;
    case "spluma":
      return `**${row.label}.** Observed at statutory land-use / township meetings, including any receiving-site process, with notice to adjacent owners and traditional authority where it exists.`;
    case "pppfa":
    case "epwp":
      return `**${row.label}.** Observed from first public contact: local hire and local-content targets are explained, recorded as owned promises, and reported with evidence.`;
    case "mprda-slp":
      return `**${row.label}.** Observed as time-bound Social and Labour Plan promises with evidence the community can recognise.`;
    case "wula":
      return `**${row.label}.** Observed before works that affect water access or quality; interruptions are explained in advance.`;
    case "msa":
      return `**${row.label}.** Observed on the municipal public-participation and ward-committee calendar named in the briefing.`;
    default:
      return `**${row.label}.** Observed at the stage the briefing requires. Meetings and conditions are minuted; resulting promises have owners and dates.`;
  }
}

function overviewBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const a = assignment(plan);
  const rap = plan.programmeKind === "relocation";
  return [
    `**1.1 The project.** This assignment is **${a.title}**, for **${a.client}**, in **${a.place}**, over **${a.time}** (${a.sector.toLowerCase()}). ${plan.purposeStatement}`,
    "",
    `**1.2 This document.** This is the Stakeholder Engagement Plan (SEP). It is the instruction Chibase Consulting will follow if appointed. It tells the procuring entity and, where relevant, the funder: what will be done, how it will be done, when, by whom, what is at stake, and how risk will be carried. It is not legal advice.`,
    "",
    rap
      ? "**1.3 This plan.** The work is a relocation and migration of project-affected households — not a round of information sessions. The plan covers: locking sending and receiving sites and a cut-off date; a participatory census and asset inventory; consultation on entitlements, replacement sites, and move windows (including home visits to vulnerable households); host-community consent before first arrivals; a move-week helpdesk; livelihood restoration follow-up; and one grievance path with acknowledgement within 48 hours."
      : "**1.3 This plan.** The work is to identify who is affected, consult them in the right order, record what is promised, and redress harm when it occurs. Courtesy to traditional authority and the ward precedes public notice. Every later meeting opens with the promise log. Grievances are acknowledged within 48 hours.",
    "",
    a.named
      ? `Organisations named in the briefing: ${a.named}.`
      : "Named organisations will be added when the briefing or first fieldwork supplies them. This draft does not invent counterparts or household counts.",
    "",
    a.budget
      ? `**Budget (as briefed):** ${a.budget}.`
      : "**Budget:** not labeled in the briefing. Professional fees and field costs sit in the financial proposal — they are not inferred here.",
  ].join("\n");
}

function complianceBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  const intro = rap
    ? "Laws, policies, and funder safeguards named in the briefing are scheduled into the work. Relocation adds a duty of care that ordinary consultation does not: people may lose a home, a stand, a trading site, or access. Cut-off, census, eligibility, and restoration are therefore compliance acts. This section is not legal advice."
    : "Laws, policies, and funder safeguards named in the briefing are scheduled into the engagement calendar so that a statutory meeting is still a real meeting: the right people, enough notice, a record, and an answer. This section is not legal advice.";
  if (!plan.instruments.length) {
    return `${intro}\n\nNo statute was confidently extracted. Inception will confirm with the client which instruments apply. Until then the team still observes lawful notice, customary courtesy where it exists, and a grievance path.`;
  }
  return `${intro}\n\n${plan.instruments.map((row) => instrumentLine(row, rap)).join("\n\n")}`;
}

function stakeholderBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  return rap
    ? [
        "Stakeholders are identified in the field, not from a workshop list. Sequence: desk review and courtesy to traditional authority and the ward; participatory census (including informal occupiers and tenants); snowball and site walk; a vulnerability overlay with home visits; mapping of the host community as its own constituency; validation of the draft list before it becomes a decision.",
        "",
        "**3.1 Stakeholder categorization matrix**",
        "",
        "Classes below are planning categories until the census names households. Influence and interest are working facts for sequencing, not a political judgement.",
      ].join("\n")
    : [
        "Stakeholders are identified from the structures that already govern the place, then widened. Sequence: desk review of the briefing and any existing lists; courtesy to traditional authority (where it exists) and the ward; snowball and site walk; a vulnerability overlay; validation of the working map before public notice.",
        "",
        "**3.1 Stakeholder categorization matrix**",
        "",
        "Names appear only when they are in the briefing. This draft does not invent households or office-holders.",
      ].join("\n");
}

function stakeholderTable(
  plan: Omit<EngagementPlan, "documentSections">,
): SepDocumentTable {
  return {
    headers: [
      "Stakeholder category",
      "Who they are",
      "Engagement objective",
      "Influence / interest",
    ],
    rows: plan.stakeholderClasses.map((row) => {
      const named = uniqueNames(row.namedFromBrief || []).join(", ");
      const who = named ? `${row.why} Named: ${named}.` : row.why;
      return [
        row.label,
        who,
        SEP_PURPOSE_LABELS[row.purpose],
        `${row.influence} / ${interestForClass(row)} (${SEP_QUADRANT_LABELS[quadrantForClass(row)]})`,
      ];
    }),
  };
}

function methodsBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const a = assignment(plan);
  const rap = plan.programmeKind === "relocation";
  return [
    `Work is sequenced over **${a.time}**. Statutory dates in the briefing override typical durations. Owners below are roles; names are confirmed at kick-off.`,
    "",
    "**4.1 Community-Based Participatory Research (CBPR)**",
    "",
    "Affected people help define the problem, validate findings, and test options. Local knowledge (including customary protocol) is used before public notice. Draft census figures, maps, and options are taken back to the people they describe before they are presented as decisions. Results are returned in accessible language, including home visits where a hall meeting will not reach. Related methods: IAP2-style purpose (inform / consult / involve) per class; ward and municipal channels; walkabouts and focus groups.",
    "",
    "**4.2 Engagement schedule**",
    "",
    rap
      ? "Cut-off and census precede entitlement workshops. Host consultation precedes first arrivals. The grievance path is briefed at first public contact, census launch, and move week."
      : "Courtesy precedes public notice. Every later meeting opens with the promise log.",
  ].join("\n");
}

function scheduleTable(
  plan: Omit<EngagementPlan, "documentSections">,
): SepDocumentTable {
  return {
    headers: [
      "Engagement mechanism",
      "Target audience",
      "When / milestone",
      "Responsible role",
      "Record",
    ],
    rows: plan.activities.map((act) => {
      const phase = plan.phases.find((row) => row.id === act.phaseId);
      return [
        act.title,
        act.method,
        act.timingHint || phase?.typicalDuration || "",
        act.ownerHint,
        fieldVoice(act.evidenceHint),
      ];
    }),
  };
}

function riskBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  return [
    "A grievance path is how this assignment stays legitimate when something goes wrong. It is explained at first public contact and repeated when a new group is met.",
    "",
    "**5.1 Grievance workflow**",
    "",
    "**Stage 1 — Lodgement.** In the meeting; in writing to the named community liaison; by telephone to the number given at first contact; or at the site / move-week helpdesk. Informal messages are written into the same register. One reference per concern.",
    "",
    "**Stage 2 — Acknowledgement.** Within 48 hours, with the reference and the name of the person responsible.",
    "",
    "**Stage 3 — Investigation.** The complainant’s account is on the record. Target: assessment within five working days unless the contract sets another period.",
    "",
    "**Stage 4 — Resolution.** Proposed action is communicated. Target: ten working days unless the contract sets another period.",
    "",
    "**Stage 5 — Close and escalation.** Verified with the complainant or a supervisor before close. Unresolved items remain visible to the client and may go to an independent mediation step the client names.",
    "",
    rap
      ? "Categories on this assignment: census / eligibility; compensation or package; replacement site or services; treatment or dignity; host-community amenity; contractor conduct."
      : "Categories on this assignment: access and livelihood; notice and process; treatment or dignity; labour and local content; contractor conduct; other.",
    "",
    "This plan does not claim a public SMS portal or a staffed 24-hour call centre unless the client separately funds one.",
    "",
    "**5.2 Priority risks and mitigations**",
  ].join("\n");
}

function riskTable(
  plan: Omit<EngagementPlan, "documentSections">,
): SepDocumentTable {
  const rap = plan.programmeKind === "relocation";
  const rows = rap
    ? [
        [
          "Census exclusion (informal occupiers, tenants, livelihood-only PAPs)",
          "Participatory census, snowball, validation workshop, eligibility grievance",
          "Census lead",
          "After cut-off, before entitlement workshops",
        ],
        [
          "A cut-off date that moves",
          "Publish through authority channels; honour it in the register",
          "Client counterpart + facilitation lead",
          "First contact",
        ],
        [
          "Move before an accepted package is recorded",
          "No loading day until the accepted option is on the promise log",
          "Move captain",
          "Each household, before the move window",
        ],
        [
          "Host site not consulted",
          "Host imbizo and amenity discussion before first arrivals",
          "Facilitation lead",
          "Before the first physical move",
        ],
        [
          "Vulnerable households only invited to the hall",
          "Flagged home visits in parallel with workshops",
          "CLO / social worker as appointed",
          "Consultation stage",
        ],
      ]
    : [
        [
          "Skipped customary or ward channels",
          "Courtesy first; public notice second",
          "Facilitation lead",
          "Before any public notice",
        ],
        [
          "Promises that die in the minutes",
          "Every later meeting opens with the promise log",
          "Facilitation lead",
          "Each engagement",
        ],
        [
          "Grievances only on informal channels",
          "One path, 48-hour acknowledgement, named owner, verify before close",
          "Case owner / CLO",
          "From first public contact",
        ],
        [
          "People who cannot attend the hall are excluded",
          "Vulnerability overlay and household visits",
          "CLO",
          "Parallel with public rounds",
        ],
      ];
  return {
    headers: ["Risk", "Mitigation", "Owner", "When"],
    rows,
  };
}

function ledBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const cited = plan.instruments.some((row) =>
    /pppfa|epwp|mprda|slp|local content/i.test(`${row.id} ${row.label}`),
  );
  if (!cited) {
    return "Local hire, supplier participation, and skills measures will follow targets the briefing names. This plan does not invent percentages or a procurement marketplace. Where the client names targets, they are explained at first contact, recorded as owned promises, and reported with evidence.";
  }
  return [
    "Local labour and enterprise are part of social licence on this assignment because the briefing named them. They are explained at first contact so they are not rumours.",
    "",
    "• Local supplier registration against packages the client opens — transparent, not a private list.",
    "• Labour intake in partnership with the ward and traditional authority where they exist, on a rotation the community can see.",
    "• Skills or induction measures named in the briefing, timed to early works.",
    "",
    "Targets and evidence sit in the promise log. This is not a claim that a separate procurement platform is being supplied.",
  ].join("\n");
}

function monitoringBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const a = assignment(plan);
  return [
    `**${a.client}** will see progress from the record of work, not from a free-standing narrative.`,
    "",
    "**Periods.** Weekly during intensive fieldwork; a one-page note after each public round; monthly (or as the contract allows) against the schedule in section 4; a close-out completion report.",
    "",
    "**Formats.** Minutes; attendance registers; field notes from household visits; an updated stakeholder map; a promise log; a grievance register with acknowledgement times.",
    "",
    "**7.1 Indicators** (populated from fieldwork — this draft does not invent numbers)",
  ].join("\n");
}

function kpiTable(
  plan: Omit<EngagementPlan, "documentSections">,
): SepDocumentTable {
  const rap = plan.programmeKind === "relocation";
  const rows = rap
    ? [
        ["Census completeness", "Households enumerated vs. footprint once estimated", "After census"],
        ["Vulnerable outreach", "Visits completed vs. households flagged", "Consultation"],
        ["Host consent", "Host engagements completed before first arrival", "Before move"],
        ["Packages vs. moves", "Accepted packages vs. households scheduled to move", "Move window"],
        ["Grievance SLA", "Share acknowledged within 48 hours; open vs. closed by category", "Standing"],
        ["Restoration", "Follow-ups at 30 / 90 days or as the contract allows", "Close-out"],
      ]
    : [
        ["Engagements held", "Held vs. planned, with minutes or attendance", "Each round"],
        ["Promises", "Opened vs. closed", "Monthly"],
        ["Grievance SLA", "Share acknowledged within 48 hours; open vs. closed", "Standing"],
        ["Local content (if cited)", "Labour / spend facts the briefing required, with evidence", "Monthly"],
      ];
  return {
    headers: ["Indicator", "How it is read", "When"],
    rows,
  };
}

function assumptionsBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  const rows = [
    "This plan is based on the briefing extract (or facts supplied without a file). It is not legal advice and not a substitute for statutory processes the competent authority must still run.",
    "Names, household counts, replacement sites, and package values are not invented.",
    "Typical durations flex to the contract period. Dates in the briefing and in law override the schedule sketched here.",
    rap
      ? "This engagement plan is not a full Resettlement Action Plan where the client or funder still requires one."
      : "This plan does not claim a public SMS portal or a staffed 24-hour call centre unless the client separately funds it.",
    "Professional fees sit in the financial proposal. A budget line appears here only if the briefing labeled one.",
    "The plan will be confirmed with the client at inception before it is treated as the working instruction.",
    ...plan.assumptions
      .filter(
        (row) =>
          !/TrustLedger|Themba|Composer|Social Licence to Build|shipped module|execution protocol/i.test(
            row,
          ),
      )
      .map(fieldVoice),
  ];
  return Array.from(new Set(rows))
    .map((row) => `• ${row}`)
    .join("\n");
}

function conclusionBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const a = assignment(plan);
  const rap = plan.programmeKind === "relocation";
  return [
    `This Stakeholder Engagement Plan is submitted to **${a.client}** for **${a.title}** in **${a.place}** over **${a.time}**.`,
    "",
    rap
      ? "What is at stake is whether households leave under rules they can recognise, arrive at a host site that was asked, can still make a living afterwards, and have a grievance path that answers within 48 hours."
      : "What is at stake is whether the people who live with this project recognise the process as fair: the right order of courtesy, a hearing that can change an option, promises that outlive the meeting, and a grievance path that works.",
    "",
    "The schedule, matrix, grievance stages, and indicators above are the basis on which Chibase Consulting asks to be appointed. Inception in week 0 will lock remaining facts (sites, counterparts, calendar) and this document will become the working instruction — still subject to law and to what fieldwork then shows.",
  ].join("\n");
}

function section(
  id: string,
  heading: string,
  body: string,
  tables?: SepDocumentTable[],
): SepDocumentSection {
  return tables?.length ? { id, heading, body, tables } : { id, heading, body };
}

export function buildSepDocument(
  plan: Omit<EngagementPlan, "documentSections">,
): EngagementPlan["documentSections"] {
  return [
    section("summary", "1. Project overview", overviewBody(plan)),
    section("compliance", "2. Regulatory and compliance framework", complianceBody(plan)),
    section(
      "stakeholders",
      "3. Stakeholder identification and mapping",
      stakeholderBody(plan),
      [stakeholderTable(plan)],
    ),
    section(
      "methods",
      "4. Engagement methodology and operational channels",
      methodsBody(plan),
      [scheduleTable(plan)],
    ),
    section(
      "grievance",
      "5. Grievance mechanism and risk mitigation",
      riskBody(plan),
      [riskTable(plan)],
    ),
    section("led", "6. Local economic participation", ledBody(plan)),
    section(
      "monitoring",
      "7. Monitoring, evaluation and reporting",
      monitoringBody(plan),
      [kpiTable(plan)],
    ),
    section("assumptions", "8. Assumptions and limits", assumptionsBody(plan)),
    section("conclusion", "9. Summary for the client", conclusionBody(plan)),
  ];
}
