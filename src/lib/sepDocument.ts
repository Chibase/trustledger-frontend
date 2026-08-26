/**
 * Client-presentable SEP — a bid / inception report.
 * Says what will be done, how, when, and by whom. Does not describe
 * product architecture, desks, or software features.
 */

import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
  vulnerabilityForClass,
} from "@/lib/sepMatrix";
import type { EngagementPlan, SepInstrument } from "@/types/engagementPlan";
import { SEP_PURPOSE_LABELS, SEP_SECTOR_LABELS } from "@/types/engagementPlan";

function namedLine(plan: Pick<EngagementPlan, "stakeholderClasses">): string {
  const named = plan.stakeholderClasses.flatMap((row) => row.namedFromBrief || []);
  return Array.from(new Set(named)).join("; ");
}

function assignment(plan: Omit<EngagementPlan, "documentSections">) {
  return {
    title: plan.projectNameHint || "this assignment",
    client: plan.clientFunderHint || "the procuring entity (to be named at inception)",
    place:
      plan.placeHint ||
      "the project area (municipality, ward, and customary structure to be locked at inception)",
    time: plan.timelineHint || "the contract period (to be confirmed at inception)",
    sector: SEP_SECTOR_LABELS[plan.sectorId],
    budget:
      plan.budgetHint?.trim() ||
      "not stated in the briefing — professional fees, field logistics, and disbursements will be confirmed in the financial proposal and must not be inferred from this plan",
    named: namedLine(plan),
  };
}

export function sepCoverBlurb(
  plan: Pick<EngagementPlan, "programmeKind">,
): string {
  if (plan.programmeKind === "relocation") {
    return "What will be done, how, when, and by whom to relocate and restore project-affected households: cut-off, census, entitlements, host consultation, the physical move, livelihood restoration, and grievance redress. Not legal advice.";
  }
  return "What will be done, how, when, and by whom to identify, consult, and keep faith with the people this assignment will affect. Not legal advice.";
}

export const SEP_ISSUER_LINE =
  "Prepared by Chibase Consulting. TrustLedger.";

function instrumentProcess(row: SepInstrument, rap: boolean): string {
  switch (row.id) {
    case "nema-eia":
    case "eia-ppp":
      return `**${row.label}.** Public participation for environmental authorisation is a statutory duty, not a courtesy. I&AP identification, notice, comment windows, and feedback of findings will be scheduled against the authorisation calendar in the briefing. Minutes and an I&AP register are the evidence that comments were received and answered. Where a relocation is also in scope, the same people are not asked to attend two parallel processes — RAP consultation and I&AP rounds share one register and one grievance path.`;
    case "ifc-ps5":
      return `**${row.label}.** Where this standard is cited, the assignment will announce a cut-off date, enumerate physically and economically displaced households, consult on eligibility and packages, treat the host community as a counterpart before first arrivals, and follow livelihood restoration after the move. The purpose is to avoid impoverishment and illegitimate displacement — not to produce an unread appendix. This plan does not assert that PS5 applies unless the briefing named it.`;
    case "ifc":
      return rap
        ? `**${row.label}.** Funder safeguards named in the briefing will be observed at the stage they apply: disclosure and consultation before irreversible decisions; a cut-off and census before packages; grievance redress that is known to affected people throughout. Only the standard the client or funder cited is claimed.`
        : `**${row.label}.** Funder environmental and social safeguards named in the briefing will be observed at the stage they apply: disclosure before irreversible decisions, consultation with affected people, and a grievance path that can be used without fear of reprisal. Only the standard the client or funder cited is claimed.`;
    case "spluma":
      return `**${row.label}.** Land-use, rezoning, or township-establishment meetings required by law will be convened through the competent authority’s process, with notice to adjacent owners and traditional authority where it exists. Receiving-site processes, if any, are part of the same calendar. The purpose is lawful land-use, not a substitute community meeting.`;
    case "pppfa":
    case "epwp":
      return `**${row.label}.** Local hire, preferential procurement, and local-content targets named in the briefing will be explained to the community at first contact, recorded as owned promises, and reported with evidence (who was engaged, on what terms). They will not be announced only at a sod-turning.`;
    case "mprda-slp":
      return `**${row.label}.** Social and Labour Plan lines cited in the briefing become time-bound promises with owners and evidence — housing, skills, local enterprise, or mine-community development as named. The community will hear the same numbers the regulator is shown.`;
    case "wula":
      return `**${row.label}.** Water-use licence consultation conditions will sit on the engagement calendar before works that affect access or quality. Interruptions are explained in advance, with a named contact during the outage.`;
    case "msa":
      return `**${row.label}.** Municipal public-participation and ward-committee calendars named in the briefing will be respected. Ward structures are counterparts, not a distribution list.`;
    default:
      return `**${row.label}.** This instrument is observed at the stage the briefing requires. Meetings, notices, and conditions will be minuted; promises that arise from it will have owners and dates. This section is not legal advice.`;
  }
}

function summaryBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const a = assignment(plan);
  const rap = plan.programmeKind === "relocation";
  const activityTitles = plan.activities
    .slice(0, 8)
    .map((row) => row.title.toLowerCase())
    .join("; ");

  const scope = rap
    ? [
        "The scope of work, should this bid be awarded, is a **relocation and migration assignment**, not a round of information sessions. The team will:",
        "",
        "• Lock sending and receiving sites and a **cut-off date** with the client counterpart in week 0–1.",
        "• Run a **participatory census and asset inventory** of physically displaced households, economically displaced persons, informal occupiers, and tenants — without inventing headcounts in this draft.",
        "• Consult on **eligibility, entitlement options, replacement sites, and move windows**, including **home visits to vulnerable households** who cannot be served by a hall meeting alone.",
        "• Treat the **host community** at the receiving site as a counterpart **before first arrivals**.",
        "• Convert accepted packages into **owned promises**, run a **move-week helpdesk**, and follow **livelihood restoration** on the same trail as the move.",
        "• Keep **one grievance path** (acknowledgement within 48 hours) for census queries, compensation, site, treatment, and host amenity.",
      ].join("\n")
    : [
        "The scope of work, should this bid be awarded, is to **identify who is affected, consult them in the right order, record what is promised, and redress harm** when it occurs. The team will:",
        "",
        "• Confirm purpose, footprint, and counterparts with the client in week 0.",
        "• Identify and map stakeholders (affected people, traditional authority where it exists, local government, labour, and the client) by influence, interest, and vulnerability.",
        "• Sequence first contact through customary and ward channels before any public notice.",
        "• Run structured consultation (imbizo, focus group, household visit, or walkabout as the method requires), always opening with the previous promise log.",
        "• Put standing promises and grievances on one trail, with acknowledgement within 48 hours.",
        "• Report to the client from the work as it is done — not from a month-end template with empty underlying records.",
      ].join("\n");

  return [
    `This Stakeholder Engagement Plan is submitted to **${a.client}** for **${a.title}**, in **${a.place}**, over **${a.time}**. It is prepared by **Chibase Consulting** so the client can see, before award, that the brief has been understood: what will be done, how it will be done, when, by whom, what is at stake, and how risk will be carried.`,
    "",
    plan.purposeStatement,
    "",
    `**Sector.** ${a.sector}.`,
    "",
    scope,
    "",
    `**How.** Community-Based Participatory Research (CBPR) is the spine of the method: affected people help define the problem, validate findings, and test options. Customary protocol and ward channels are used before public notice. Methods flex to the contract period; statutory dates in the briefing override typical durations.`,
    "",
    `**Who.** A facilitation lead owns the plan. A community liaison / field lead owns daily contact. ${rap ? "A census team enumerates households. A move captain owns loading week. " : ""}The client names a counterpart who can decide. Traditional authority and ward leadership, where they exist, are not optional addressees. Named organisations in the extract${a.named ? `: ${a.named}` : " will be added when the briefing or first fieldwork supplies them — this draft does not invent counterparts"}.`,
    "",
    `**When.** Work follows seven stages from inception to close-out (${plan.phases.map((p) => p.title.toLowerCase()).join(" → ")}). Typical durations in section 4 flex to **${a.time}**.`,
    "",
    `**Principal activities.** ${activityTitles}${plan.activities.length > 8 ? "; and further activities in section 4" : ""}.`,
    "",
    `**Budget.** ${a.budget}.`,
    "",
    rap
      ? "Success is a legitimate move: who was counted, who was consulted, what was promised, what was restored, and which grievances remain open — with owners. Failure is trucks without packages, a host site that was never asked, or a census that excluded informal occupiers."
      : "Success is a trail the client can audit: who was met, in what order, what was promised, what was redressed, and what remains open. Failure is a hall meeting that stands in for consent, promises that die in the minutes, or grievances that live only on informal channels.",
  ].join("\n");
}

function complianceBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  const intro = [
    "This section maps the laws, policies, and funder safeguards that the briefing named — or that a responsible team must assume until inception confirms otherwise — onto **when** they are observed, **how**, and **for what purpose**. It is not legal advice and does not invent a statute the extract did not support.",
    "",
    rap
      ? "Relocation adds a duty of care that ordinary consultation does not: people may lose a home, a stand, a trading site, or access. Cut-off, census, eligibility, and restoration are therefore compliance acts, not project-management extras."
      : "Compliance is scheduled into the engagement calendar so that a statutory meeting is still a real meeting: the right people, enough notice, a record, and an answer to what was asked.",
  ].join("\n");

  if (!plan.instruments.length) {
    return `${intro}\n\nNo statute or funder safeguard was confidently extracted from the briefing. Inception will confirm with the client which instruments apply. Until then this plan still observes: lawful notice; customary courtesy where it exists; a grievance path; and a prohibition on inventing household counts, package values, or legal conclusions.`;
  }

  return `${intro}\n\n${plan.instruments.map((row) => instrumentProcess(row, rap)).join("\n\n")}`;
}

function stakeholderBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  const process = rap
    ? [
        "**How stakeholders will be identified.** Identification is fieldwork, not a workshop list.",
        "",
        "1. **Desk and courtesy.** Client records, existing beneficiary or occupier lists, traditional authority, and the ward are asked who lives with the footprint — before any public relocation notice.",
        "2. **Participatory census.** Household visits enumerate physically displaced people, economically displaced PAPs (livelihood or access only), informal occupiers, tenants, and backyard residents. Local enumerators are used where they can be trained and supervised. People missing from a title deed are not missing from the register.",
        "3. **Snowball and transect.** Neighbours, stokvels, traders, and herders name others the list missed. A walk of the sending and receiving sites checks the paper against the ground.",
        "4. **Vulnerable overlay.** Elderly, disability, women- or child-headed, and language-minority households are flagged for home visits, not only an open invitation to the hall.",
        "5. **Host community.** The receiving site is mapped as its own constituency — services, graves, labour intake, and amenity — before arrivals are scheduled.",
        "6. **Validation.** Draft classes and counts (once known) are taken back to PAP representatives and authority for correction before they become decisions.",
      ].join("\n")
    : [
        "**How stakeholders will be identified.** Identification starts with the structures that already govern the place, then widens.",
        "",
        "1. **Desk review** of the briefing, existing studies, and any I&AP or ward lists the client already holds — without treating those lists as complete.",
        "2. **Courtesy introduction** to traditional authority (where it exists) and the ward, to ask who must be in the room and in what order.",
        "3. **Snowball and transect.** Affected households, users of the land or service, labour, and interest groups are named by those already met, then checked on a walk of the footprint.",
        "4. **Vulnerability overlay.** People who cannot travel, hear a hall meeting, or wait in a queue are flagged for a visit, not only an invitation.",
        "5. **Validation.** The working map is taken back to authority and community representatives for correction before public notice.",
      ].join("\n");

  const mapping = [
    "",
    "**How they will be mapped.** Each class is placed on a working power–interest grid (manage closely / keep satisfied / keep informed / monitor) and assigned a purpose: inform, consult, decide, or remediate. Influence is not a political judgement; it is a planning fact about who can stop, delay, or legitimise the work. Vulnerability is recorded so that a standard package does not exclude the people who will be harmed first.",
    "",
    "**Significance of the classes below.** These are planning categories until fieldwork names people. Names appear only when they are in the briefing. This draft does not invent households or office-holders.",
  ].join("\n");

  const matrix = plan.stakeholderClasses
    .map((row) => {
      const q = SEP_QUADRANT_LABELS[quadrantForClass(row)];
      const named = row.namedFromBrief?.length
        ? ` Named in the briefing: ${row.namedFromBrief.join(", ")}.`
        : "";
      return `**${row.label}.** Influence ${row.influence}, interest ${interestForClass(row)} — **${q}**. Purpose: ${SEP_PURPOSE_LABELS[row.purpose].toLowerCase()}. ${row.why} ${vulnerabilityForClass(row)}${named}`;
    })
    .join("\n\n");

  return `${process}\n${mapping}\n\n${matrix}`;
}

function fieldVoice(value: string): string {
  return value
    .replace(/\([^)]*Capture[^)]*\)/gi, "")
    .replace(/\bCapture(?:\s+minutes)?(?:\s+template)?s?\b/gi, "meeting records")
    .replace(/\bMinutes and attendance on meeting records\b/gi, "Minutes and attendance")
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

function methodsBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  const a = assignment(plan);

  const cbpr = [
    "**Community-Based Participatory Research (CBPR).** CBPR treats affected people as co-investigators, not as an audience for a finished plan. In practice on this assignment that means:",
    "",
    "• **Shared problem definition.** Inception asks the client, traditional authority, ward, and PAP or community representatives what success would look like and what has already failed. The team does not arrive with a closed package.",
    "• **Local knowledge first.** Enumerators, translators, and guides are drawn from the place where that can be done without creating patronage. Sacred sites, graves, grazing, and trading patterns are described by those who use them.",
    "• **Iterative validation.** Census figures, maps, and option tables are taken back to the people they describe before they are presented as decisions. A finding that cannot be recognised in the yard is not yet a finding.",
    "• **Shared analysis of options.** Entitlement choices, sites, and move windows (or, on a non-relocation brief, design and labour options) are tested in the room with trade-offs named in plain language.",
    "• **Return of results.** What was heard, what was promised, and what remains open is reported to the same people in accessible language — including home visits where a hall meeting will not reach.",
    "",
    "**Related methods.** CBPR sits with, and does not replace:",
    "",
    "• **Customary protocol** — courtesy to traditional authority before public notice; no meeting that skips the structure that will be asked to bless the outcome.",
    "• **Ward and municipal channels** — scheduled around the public-participation calendar the briefing cites.",
    "• **IAP2-style purpose.** Inform, consult, involve, collaborate, or empower is chosen per class (see section 3). A notice is not a consultation. A hall meeting is not a household decision.",
    "• **Household and vulnerable-person visits** — used wherever exclusion from the hall would distort the record.",
    rap
      ? "• **Participatory enumeration** — the census is a research act and a rights act: people help describe their own assets and households."
      : "• **Walkabouts and focus groups** — used to test the footprint and to hear groups who will not speak in a mixed imbizo.",
  ].join("\n");

  const glue = rap
    ? `**How the work is brought together.** Over **${a.time}**, stages compress but do not skip. Cut-off and census still precede entitlement workshops. Host consultation still precedes first arrivals. Grievance briefing happens at first public contact, census launch, and move week. Owners below are roles; the client will confirm names at kick-off.`
    : `**How the work is brought together.** Over **${a.time}**, inception locks purpose; mapping names people; first contact respects protocol; consultation produces options; promises and grievances are owned through close-out. Statutory dates in the briefing override the typical durations below. Owners are roles; the client will confirm names at kick-off.`;

  const phases = plan.phases
    .map((phase) => {
      const acts = plan.activities.filter((row) => row.phaseId === phase.id);
      const actLines = acts.length
        ? acts
            .map(
              (act) =>
                `— **${act.title}.** ${act.method}. **Who:** ${act.ownerHint}. **When:** ${act.timingHint}. **How we will know it happened:** ${fieldVoice(act.evidenceHint)}.`,
            )
            .join("\n")
        : "— No separate activity is scheduled in this stage; the exit criteria below still apply.";
      return [
        `**Stage ${phase.order} — ${phase.title}** (${phase.typicalDuration}).`,
        fieldVoice(phase.intent),
        `**Done when:** ${fieldVoice(phase.exitCriteria)}`,
        actLines,
      ].join("\n");
    })
    .join("\n\n");

  return `${cbpr}\n\n${glue}\n\n${phases}`;
}

function riskBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  const risks = rap
    ? [
        "**Census exclusion.** Informal occupiers, tenants, and livelihood-only PAPs omitted from the register appear later as protest. **Mitigation:** participatory census; snowball; validation workshop; grievance category for eligibility. **Who:** census lead. **When:** after cut-off, before entitlement workshops.",
        "**A moving cut-off.** A date that shifts with political pressure is not a register. **Mitigation:** publish the date through authority channels; honour it in the register; record late-arrival cases as grievances, not silent additions. **Who:** client counterpart + facilitation lead. **When:** first contact.",
        "**Packages without a recorded promise.** Trucks arrive before the household has an owned package. **Mitigation:** no loading day until the accepted option is on the promise log. **Who:** move captain. **When:** each household, before the move window.",
        "**Host site unconsulted.** Conflict relocates with the households. **Mitigation:** host imbizo and amenity discussion before first arrivals. **Who:** facilitation lead. **When:** before the first physical move.",
        "**Vulnerable PAPs only invited to the hall.** Elderly, disability, and women- or child-headed households are missed. **Mitigation:** flagged visits in parallel with workshops. **Who:** CLO / social worker as appointed. **When:** consultation stage.",
        "**Livelihood loss treated as a comment.** Trading, grazing, or access is not in the entitlement matrix. **Mitigation:** economic-displacement class in the census; restoration follow-up at 30 / 90 days or as the contract allows. **Who:** livelihood lead. **When:** census through close-out.",
        "**Dignity and treatment.** Queueing, language, gender of enumerators, or contractor conduct creates harm the package cannot buy off. **Mitigation:** grievance category for treatment; move-week helpdesk; verification with the complainant before close. **Who:** case owner. **When:** throughout, intensively in move week.",
      ]
    : [
        "**Skipped customary or ward channels.** A public meeting that bypasses traditional authority or the ward is remembered as disrespect, not efficiency. **Mitigation:** courtesy first; public notice second. **Who:** facilitation lead. **When:** before any public notice.",
        "**Promises that die in the minutes.** The room hears a commitment that nobody owns. **Mitigation:** every subsequent meeting opens with the promise log; unowned statements are not recorded as decisions. **Who:** facilitation lead. **When:** each engagement.",
        "**Grievances on informal channels only.** Complaints live on personal phones and cannot be closed. **Mitigation:** one path, 48-hour acknowledgement, named owner, verification before close. **Who:** case owner / CLO. **When:** from first public contact.",
        "**Labour and local content as theatre.** Targets are announced without a record of who was engaged. **Mitigation:** explain targets at first contact; record as owned promises with evidence. **Who:** client + facilitation lead. **When:** inception and first public round.",
        "**Exclusion of people who cannot attend the hall.** **Mitigation:** vulnerability overlay and household visits. **Who:** CLO. **When:** parallel with public rounds.",
        "**Reports with no underlying work.** A month-end narrative that cannot cite meetings, promises, or cases. **Mitigation:** report only from the record of what was done. **Who:** facilitation lead. **When:** each client note and close-out.",
      ];

  const grm = [
    "**Grievance redress mechanism (GRM).** The GRM is how this assignment remains legitimate when something goes wrong. It is explained at first public contact and repeated whenever a new group is met.",
    "",
    "**How a concern is lodged.** In the meeting; in writing to the named community liaison; by phone to the number given at first contact; or at the move-week / site helpdesk. Informal messages are not ignored — they are written into the same register. There is one identity for each concern so it cannot be lost between people.",
    "",
    "**What happens next.**",
    "",
    "1. **Acknowledge** within 48 hours, with a unique reference and the name of the person responsible.",
    "2. **Assess and deploy** — who must look, and by when.",
    "3. **Investigate** with the complainant’s account on the record.",
    "4. **Resolve** (or explain why not, with an option to escalate).",
    "5. **Verify** with the complainant or a supervisor before the matter is treated as closed.",
    "6. **Close** on the register. Unresolved items remain visible to the client.",
    "",
    rap
      ? "**Categories used on this assignment:** census / eligibility; compensation or package; replacement site or services; treatment or dignity; host-community amenity; contractor conduct."
      : "**Categories used on this assignment:** access and livelihood; notice and process; treatment or dignity; labour and local content; contractor conduct; other.",
    "",
    "No parallel private channel replaces this path. The GRM does not claim a public SMS portal or a staffed 24-hour call centre unless the client separately funds one.",
  ].join("\n");

  const commitments = plan.commitments.length
    ? [
        "",
        "**Standing promises this plan already owns** (dates confirmed at inception where they are still hints):",
        "",
        ...plan.commitments.map(
          (row) =>
            `• **${row.title}** — ${row.ownerHint}; ${row.dueHint}. ${row.why}`,
        ),
      ].join("\n")
    : "";

  return [
    "This section is the bid’s answer to “what if it goes wrong?” The client should be able to see that the team has named the failure modes of *this* assignment, not of engagement in the abstract, and has put an owner and a moment on each one.",
    "",
    risks.join("\n\n"),
    "",
    grm,
    commitments,
  ].join("\n");
}

function monitoringBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const a = assignment(plan);
  const rap = plan.programmeKind === "relocation";

  const indicators = rap
    ? [
        "• Households enumerated vs. the footprint once an estimate exists (no invented count in this draft).",
        "• Vulnerable households visited vs. flagged.",
        "• Entitlement workshops held, with attendance.",
        "• Host-community engagements completed before first arrival.",
        "• Accepted packages vs. households scheduled to move.",
        "• Grievances acknowledged within 48 hours; open vs. closed by category.",
        "• Restoration follow-ups at 30 / 90 days, or as the contract allows.",
      ]
    : [
        "• Engagements held vs. planned, with minutes or attendance.",
        "• Promises opened vs. closed.",
        "• Grievances acknowledged within 48 hours; open vs. closed by category.",
        "• Local hire / local-content facts the briefing required, with evidence.",
      ];

  return [
    `Monitoring is how **${a.client}** will see whether this plan is being executed — not a separate public-relations workstream.`,
    "",
    "**Periods.**",
    "",
    "• **Weekly** internal during intensive fieldwork" +
      (rap ? " (census and move week)." : " (first contact and public rounds)."),
    `• **After each public round** — a one-page note to ${a.client}: who was met, what was promised, what was lodged, what remains open.`,
    `• **Monthly** (or as the contract allows) — a progress note against the stages in section 4.`,
    "• **Close-out** — a completion report: what was done, what remains, and the evidence trail.",
    "",
    "**Indicators** (to be populated from fieldwork; this draft does not invent numbers):",
    "",
    ...indicators,
    "",
    "**Formats.** Minutes; attendance registers; field notes from household visits; a stakeholder map that is updated after each round; a promise log; a grievance register with acknowledgement times; and the one-page client notes above. Board or funder packs, if required, will cite those records rather than a free-standing narrative.",
    "",
    `**Audience.** ${a.client} as procuring entity; traditional authority and ward as counterparts who asked to see what was done in their name; affected people as the first audience for feedback of results.`,
  ].join("\n");
}

function assumptionsBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap = plan.programmeKind === "relocation";
  const rows = [
    "This plan is a professional proposal based on the briefing extract (or facts supplied without a file) and the assignment type. It is not legal advice and not a substitute for statutory processes the competent authority must still run.",
    "Names of people and organisations appear only when they are in the briefing. Household counts, replacement sites, package values, and office-holders are not invented.",
    "Typical durations flex to the contract period. Dates in the briefing and in law override the stages sketched here.",
    "Cut-off dates, eligibility rules, and compensation — where relevant — follow the client’s policy and applicable law, confirmed at inception.",
    rap
      ? "A relocation and migration engagement plan is not a full Resettlement Action Plan or livelihood-restoration plan where the client or funder still requires one. It is the operating plan for consultation, census, host consent, the move, restoration follow-up, and grievance on that move."
      : "This plan does not claim a public SMS or WhatsApp community portal, a geographic information-system editing service, or a staffed 24-hour call centre unless the client separately specifies and funds it.",
    "Professional fees, field logistics, and disbursements are as in the financial proposal. This document does not invent a budget line.",
    "The team will edit this plan with the client at inception before it is treated as the working instruction.",
    ...plan.assumptions
      .filter(
        (row) =>
          !/TrustLedger|Themba|Composer|Social Licence to Build|shipped module|execution protocol/i.test(
            row,
          ),
      )
      .map(fieldVoice),
  ];
  return Array.from(new Set(rows)).map((row) => `• ${row}`).join("\n");
}

function conclusionBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const a = assignment(plan);
  const rap = plan.programmeKind === "relocation";
  return [
    `**${a.client}** asked, in substance, for a team that understands **${a.title}** in **${a.place}** over **${a.time}**. This plan is the answer to that brief.`,
    "",
    rap
      ? "What is at stake is not a consultation statistic. It is whether households leave a place they know under rules they can recognise, arrive at a host site that was asked, and can still make a living afterwards — and whether a person who is missed, underpaid, or badly treated has a path that answers in 48 hours and does not close until they say it did."
      : "What is at stake is whether the people who live with this project will recognise the process as fair: the right order of courtesy, a hearing that can change an option, promises that outlive the meeting, and a grievance path that works when something goes wrong.",
    "",
    "The method is CBPR inside a seven-stage sequence, with named roles, typical timing, statutory instruments observed at the stage they apply, risks owned, and reporting that cites the record of work. That is the basis on which Chibase Consulting asks to be trusted with the assignment.",
    "",
    "Should this bid be awarded, inception in week 0 will lock remaining facts (sites, counterparts, calendar, and any budget still open) and this document will become the working instruction — still subject to law and to what the census and the room then show.",
  ].join("\n");
}

export function buildSepDocument(
  plan: Omit<EngagementPlan, "documentSections">,
): EngagementPlan["documentSections"] {
  return [
    {
      id: "summary",
      heading: "1. Executive summary",
      body: summaryBody(plan),
    },
    {
      id: "compliance",
      heading: "2. Regulatory and compliance mapping",
      body: complianceBody(plan),
    },
    {
      id: "stakeholders",
      heading: "3. Stakeholder identification",
      body: stakeholderBody(plan),
    },
    {
      id: "methods",
      heading: "4. Operational methodology",
      body: methodsBody(plan),
    },
    {
      id: "grievance",
      heading: "5. Risk mitigation and grievance redress",
      body: riskBody(plan),
    },
    {
      id: "monitoring",
      heading: "6. Monitoring, evaluation and reporting",
      body: monitoringBody(plan),
    },
    {
      id: "assumptions",
      heading: "7. Assumptions and limits",
      body: assumptionsBody(plan),
    },
    {
      id: "conclusion",
      heading: "8. Conclusion",
      body: conclusionBody(plan),
    },
  ];
}
