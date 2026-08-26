/**
 * Relocation / migration overlay for SEP compose.
 * Used when the brief is a physical or economic move (RAP / PS5),
 * not a generic consultation playbook.
 */

import type { SepSectorPlaybook } from "@/data/sepSectors";
import type {
  SepActivity,
  SepDraftCommitment,
  SepInstrument,
  SepPhase,
  SepProgrammeKind,
  SepStakeholderClass,
} from "@/types/engagementPlan";

const RELOCATION_RE =
  /\b(resettle|resettlement|\brap\b|relocation|migration plan|physical displacement|economic displacement|livelihood restoration|cut-?off date|project-affected (?:person|people|household|part(?:y|ies))|involuntary|host community)\b/i;

export function detectSepProgramme(...chunks: Array<string | undefined>): SepProgrammeKind {
  const text = chunks.filter(Boolean).join(" \n ");
  return RELOCATION_RE.test(text) ? "relocation" : "standard";
}

const RAP_PHASES: SepPhase[] = [
  {
    id: "inception",
    order: 1,
    title: "Inception, footprint & cut-off lock",
    intent:
      "Confirm who is moving, from where to where, on whose authority, and the date after which new arrivals are not eligible. Success is a locked footprint and a published cut-off — not a workshop count.",
    exitCriteria:
      "Written purpose; named client counterpart; sending and receiving sites sketched; cut-off date proposed; inform / consult / decide / remediate locked.",
    typicalDuration: "Week 0–1",
    module: "projects",
  },
  {
    id: "mapping",
    order: 2,
    title: "PAP census & asset inventory",
    intent:
      "Count and describe physically and economically displaced households, informal occupiers, tenants, and livelihood-only PAPs. Inventory structures, land, and livelihood assets against the cut-off.",
    exitCriteria:
      "Census register (prospect rows) with influence, vulnerability flags, and place. Traditional authority and local government named where they exist.",
    typicalDuration: "Week 1–3",
    module: "stakeholders",
  },
  {
    id: "scoping",
    order: 3,
    title: "Entitlement framework & options",
    intent:
      "Turn the census into an entitlement matrix the room can test: replacement housing or cash, moving support, livelihood restoration, and special measures for vulnerable PAPs.",
    exitCriteria:
      "Draft entitlement options with owners and evidence type. Geo / ward on sending and host sites.",
    typicalDuration: "Week 2–3",
    module: "geo",
  },
  {
    id: "first_contact",
    order: 4,
    title: "Legitimate notice",
    intent:
      "Notify traditional authority, ward, and PAP representatives through existing channels before any public relocation notice. Host community is notified as a counterpart, not an afterthought.",
    exitCriteria:
      "Courtesy letters / meetings logged. PAP and host counterparts know who to call and how a grievance is lodged.",
    typicalDuration: "Week 2–4",
    module: "engagements",
  },
  {
    id: "consultation",
    order: 5,
    title: "Options, sites & move windows",
    intent:
      "Consult on replacement sites, packages, and move windows. Always open with the previous commitment log. Vulnerable PAPs are visited, not only invited to the hall.",
    exitCriteria:
      "Minutes and attendance on Capture; options recorded per household class; issues that are disputes sit on Incidents.",
    typicalDuration: "Weeks 3–8 (or as the contract allows)",
    module: "capture",
  },
  {
    id: "commitments",
    order: 6,
    title: "Agreements, physical move & restoration",
    intent:
      "Convert accepted options into owned dates. Run the move with a helpdesk that creates case IDs. Start livelihood restoration on the same trail as the move.",
    exitCriteria:
      "Signed/accepted packages as commitments; move-week issues on Incidents; restoration owners named.",
    typicalDuration: "From first accepted package through the move window",
    module: "commitments",
  },
  {
    id: "closeout",
    order: 7,
    title: "Completion audit & handover",
    intent:
      "Show who moved, what was restored, what remains open, and the evidence trail for the client, board, or funder.",
    exitCriteria:
      "SEP applied; report pack cites census engagements, commitments, and cases; unresolved items have owners.",
    typicalDuration: "Final 2 weeks of the assignment / gate",
    module: "reports",
  },
];

const RAP_CLASSES: SepStakeholderClass[] = [
  {
    id: "pap-physical",
    label: "Physically displaced households",
    kind: "community_group",
    influence: "high",
    interest: "high",
    purpose: "consult",
    why: "People who must leave a structure or stand decide whether the move is legitimate. They are not a logistics line.",
    vulnerability:
      "High: late notice, unpaid packages, or a receiving site that does not exist yet will stop the programme in the yard, not in the hall.",
    module: "stakeholders",
  },
  {
    id: "pap-economic",
    label: "Economically displaced PAPs (livelihood / access)",
    kind: "community_group",
    influence: "high",
    interest: "high",
    purpose: "consult",
    why: "Loss of trading space, grazing, or access can impoverish a household that is never ‘moved’.",
    vulnerability:
      "High: if they are missing from the census they will appear as protest, not as a row.",
    module: "stakeholders",
  },
  {
    id: "pap-informal",
    label: "Informal occupiers / tenants / backyard residents",
    kind: "community_group",
    influence: "high",
    interest: "high",
    purpose: "consult",
    why: "Tenure status does not erase impact. Informal and tenant PAPs need a recorded eligibility path.",
    vulnerability:
      "High: exclusion from the register is the usual failure mode.",
    module: "stakeholders",
  },
  {
    id: "host-community",
    label: "Host community at the receiving site",
    kind: "community_group",
    influence: "high",
    interest: "high",
    purpose: "consult",
    why: "A receiving site without host consent relocates the conflict. Services, graves, and labour intake must be on the same plan.",
    vulnerability:
      "High: skipped host consultation becomes a second displacement dispute.",
    module: "stakeholders",
  },
  {
    id: "pap-vulnerable",
    label: "Vulnerable PAPs (elderly, disability, women- or child-headed)",
    kind: "community_group",
    influence: "medium",
    interest: "high",
    purpose: "consult",
    why: "Hall meetings underserve people who cannot travel, hear, or wait in a queue. They need a named visit, not only an open invitation.",
    vulnerability:
      "High: a standard package that ignores care, schooling, or disability is a rights failure.",
    module: "stakeholders",
  },
];

const RAP_ACTIVITIES: SepActivity[] = [
  {
    id: "kickoff",
    phaseId: "inception",
    title: "Client kick-off: footprint, authority, and cut-off",
    method: "Briefing meeting",
    purpose: "decide",
    engagementKind: "briefing",
    ownerHint: "Plan Owner / RAP facilitation lead",
    timingHint: "Week 0",
    evidenceHint: "Minutes locking sending/receiving sites and a proposed cut-off date",
    module: "capture",
    captureTemplate: "minutes",
  },
  {
    id: "place-sketch",
    phaseId: "mapping",
    title: "Sending and receiving site sketch",
    method: "Desk + local informant + geo",
    purpose: "inform",
    engagementKind: "other",
    ownerHint: "CLO / social facilitator",
    timingHint: "Week 1",
    evidenceHint: "Geo fields on the project dossier for both sites",
    module: "geo",
  },
  {
    id: "census",
    phaseId: "mapping",
    title: "PAP census and asset inventory",
    method: "Household visit + register",
    purpose: "consult",
    engagementKind: "other",
    ownerHint: "Census team / CLO",
    timingHint: "After cut-off is announced; before entitlement workshops",
    evidenceHint: "Field notes; household rows (no invented counts)",
    module: "capture",
    captureTemplate: "field_note",
  },
  {
    id: "cutoff-notice",
    phaseId: "first_contact",
    title: "Publish and brief the cut-off date",
    method: "Notice + authority briefing",
    purpose: "inform",
    engagementKind: "briefing",
    ownerHint: "Client + facilitation lead",
    timingHint: "Before census closes",
    evidenceHint: "Notice on Capture; meeting attendance",
    module: "engagements",
    captureTemplate: "attendance",
  },
  {
    id: "courtesy",
    phaseId: "first_contact",
    title: "Courtesy introduction — traditional authority and ward",
    method: "Letter + short meeting",
    purpose: "inform",
    engagementKind: "meeting",
    ownerHint: "Facilitation lead",
    timingHint: "Before any public relocation notice",
    evidenceHint: "Attendance + letter on Capture",
    module: "engagements",
    captureTemplate: "attendance",
  },
  {
    id: "host-imbizo",
    phaseId: "consultation",
    title: "Host-community imbizo at the receiving site",
    method: "Imbizo / consultation",
    purpose: "consult",
    engagementKind: "consultation",
    ownerHint: "Facilitation lead + CLO",
    timingHint: "Before households are asked to accept a site",
    evidenceHint: "Minutes + attendance",
    module: "capture",
    captureTemplate: "minutes",
  },
  {
    id: "entitlement-workshop",
    phaseId: "consultation",
    title: "Entitlement and options workshop with PAP classes",
    method: "Facilitated consultation",
    purpose: "consult",
    engagementKind: "consultation",
    ownerHint: "RAP facilitator + client housing / social performance",
    timingHint: "After census draft; before package sign-off",
    evidenceHint: "Minutes; options recorded as draft commitments",
    module: "capture",
    captureTemplate: "minutes",
  },
  {
    id: "vulnerable-visits",
    phaseId: "consultation",
    title: "Home visits to vulnerable PAPs",
    method: "Household visit",
    purpose: "consult",
    engagementKind: "other",
    ownerHint: "CLO / social worker (as appointed)",
    timingHint: "Parallel with hall workshops",
    evidenceHint: "Field notes; vulnerability flags on registry rows",
    module: "capture",
    captureTemplate: "field_note",
  },
  {
    id: "grievance-brief",
    phaseId: "commitments",
    title: "Brief the relocation grievance path",
    method: "Scripted acknowledgment + desk path",
    purpose: "inform",
    engagementKind: "briefing",
    ownerHint: "Case owner",
    timingHint: "First public meeting, census launch, and move week",
    evidenceHint: "Issue intake live; categories for compensation, site, and treatment",
    module: "incidents",
  },
  {
    id: "move-helpdesk",
    phaseId: "commitments",
    title: "Move-week helpdesk",
    method: "On-site desk + case intake",
    purpose: "remediate",
    engagementKind: "other",
    ownerHint: "CLO + contractor move captain",
    timingHint: "Physical move window",
    evidenceHint: "Cases opened the same day; commitments updated",
    module: "incidents",
  },
  {
    id: "restoration-followup",
    phaseId: "closeout",
    title: "Livelihood restoration follow-up",
    method: "Follow-up visits / meeting",
    purpose: "consult",
    engagementKind: "meeting",
    ownerHint: "Livelihood lead / CLO",
    timingHint: "30 / 90 days after move (or as the contract allows)",
    evidenceHint: "Engagement + commitment status; open cases named",
    module: "engagements",
    captureTemplate: "minutes",
  },
];

const RAP_COMMITMENTS: SepDraftCommitment[] = [
  {
    id: "ack-48h",
    title: "Acknowledge every recorded relocation concern within 48 hours",
    ownerHint: "Case owner / CLO",
    dueHint: "Standing SLA from first intake",
    why: "Silence during a move is how a census turns into a blockade.",
  },
  {
    id: "cutoff-honour",
    title: "Honour the published cut-off date in the census register",
    ownerHint: "Census lead / client",
    dueHint: "From the date announced at first contact",
    why: "A moving cut-off is not a register — it is a rumour.",
  },
  {
    id: "no-move-without-package",
    title: "Do not schedule a household move until the accepted package is on the commitment board",
    ownerHint: "Move captain / facilitator",
    dueHint: "Each household before loading day",
    why: "Trucks without a recorded package create cases that cannot be closed.",
  },
  {
    id: "host-before-arrival",
    title: "Complete host-community consultation before first arrivals",
    ownerHint: "Facilitation lead",
    dueHint: "Before the first physical move",
    why: "A receiving site that has not been consulted is a second project.",
  },
  {
    id: "commitment-review",
    title: "Open every subsequent PAP meeting with the commitment log",
    ownerHint: "Facilitation lead",
    dueHint: "Each engagement",
    why: "New options without old promises is theatre.",
  },
];

const RAP_INSTRUMENT: SepInstrument = {
  id: "ifc-ps5",
  label: "Involuntary resettlement (IFC PS5 / RAP — as cited)",
  note: "Census, cut-off, eligibility, entitlements, host community, and livelihood restoration are logged work — not a bound RAP left in an appendix. This is not a claim that PS5 applies unless the briefing named it.",
};

const DROP_WHEN_RAP = new Set([
  "affected-households",
  "occupiers",
  "road-users",
]);

export function overlayRelocationPlaybook(
  playbook: SepSectorPlaybook,
): SepSectorPlaybook {
  const classes = [
    ...RAP_CLASSES,
    ...playbook.stakeholderClasses.filter((row) => !DROP_WHEN_RAP.has(row.id)),
  ];
  const seenAct = new Set<string>();
  const activities: SepActivity[] = [];
  for (const row of [...RAP_ACTIVITIES, ...playbook.activities]) {
    if (seenAct.has(row.id)) continue;
    seenAct.add(row.id);
    activities.push(row);
  }
  const seenCom = new Set<string>();
  const commitments: SepDraftCommitment[] = [];
  for (const row of [...RAP_COMMITMENTS, ...playbook.commitments]) {
    if (seenCom.has(row.id)) continue;
    seenCom.add(row.id);
    commitments.push(row);
  }
  const instruments = playbook.instruments.some((row) => row.id === "ifc-ps5")
    ? playbook.instruments
    : [RAP_INSTRUMENT, ...playbook.instruments];

  return {
    ...playbook,
    summary:
      "Relocation and migration of project-affected households: lock the footprint and cut-off, run a census, consult on entitlements and host sites, move with a case desk, restore livelihoods, and hand over an evidence trail.",
    phases: RAP_PHASES,
    stakeholderClasses: classes,
    activities,
    commitments,
    instruments,
    grievancePath:
      "Census query, compensation, replacement site, treatment, and host-community amenity each get a TrustLedger case ID. Lodgment: Report issue / Capture / the meeting floor. Acknowledgment within 48 hours. Investigation and resolution on Incidents. Verify with the complainant or supervisor before close. Move-week helpdesk uses the same desk — not a parallel WhatsApp.",
    assumptions: [
      ...playbook.assumptions,
      "This overlay does not invent household counts, replacement sites, or package values. Census and entitlement figures are added after fieldwork.",
      "A Relocation and Migration Plan is not a substitute for a full RAP / livelihood restoration plan where the client or funder requires one. This SEP is the engagement and grievance operating plan for that move.",
      "Cut-off dates, eligibility, and compensation rules follow the briefing and applicable law — not this playbook.",
    ],
  };
}

/** Practice TOR — assignment shape, not a live workspace seed. */
export const SEP_RELOCATION_EXAMPLE_BRIEF = `Invitation to bid
Assignment: Relocation and Migration Plan
Client: Winnie Madikizela Mandela Local Municipality
Place: Winnie Madikizela Mandela Local Municipality
Contract period: 3 months
Scope of work: Prepare a Relocation and Migration Plan for project-affected households. Lock a cut-off date. Run a PAP census and asset inventory covering physically displaced households, economically displaced persons, informal occupiers and tenants. Consult on entitlement options, replacement sites, and move windows. Engage the host community before first arrivals. Support the physical move with a helpdesk. Follow livelihood restoration. Vulnerable PAPs require home visits, not only a hall meeting. One grievance path through the move. Terms of reference.`;
