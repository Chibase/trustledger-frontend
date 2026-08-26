/**
 * Presentable SEP body — assignment-first, not a product architecture essay.
 * Protocols are short operating notes for the desk that will execute the plan.
 */

import {
  interestForClass,
  quadrantForClass,
  SEP_QUADRANT_LABELS,
  vulnerabilityForClass,
} from "@/lib/sepMatrix";
import { SEP_SLB_LANES } from "@/lib/sepExecution";
import type { EngagementPlan } from "@/types/engagementPlan";
import { SEP_SECTOR_LABELS } from "@/types/engagementPlan";

function lane(id: (typeof SEP_SLB_LANES)[number]["id"]) {
  return SEP_SLB_LANES.find((row) => row.id === id)!;
}

function namedLine(plan: Pick<EngagementPlan, "stakeholderClasses">): string {
  const named = plan.stakeholderClasses.flatMap((row) => row.namedFromBrief || []);
  const unique = Array.from(new Set(named));
  return unique.length ? unique.join("; ") : "";
}

function instrumentBody(
  plan: Pick<EngagementPlan, "instruments" | "programmeKind">,
): string {
  if (!plan.instruments.length) {
    return "No statute or funder safeguard was confidently extracted. Add only instruments the client or briefing confirms. This section is not legal advice.";
  }
  const rap = plan.programmeKind === "relocation";
  return plan.instruments
    .map((row) => {
      if (row.id === "ifc-ps5" || (rap && row.id === "ifc")) {
        return `**${row.label}.** For this assignment: announce a cut-off; run a census and asset inventory; consult on eligibility and packages; treat host-community consent as a logged engagement; put livelihood restoration on the commitment board. ${row.note}`;
      }
      if (row.id === "spluma") {
        return `**${row.label}.** Statutory land-use and township meetings are Engagements with minutes — including any receiving-site processes. ${row.note}`;
      }
      if (row.id === "pppfa" || row.id === "epwp") {
        return `**${row.label}.** Local hire and local-content targets named in the briefing are Intelligence + Commitments (labour desk, SMME rotation). They are not a speech at the sod turning. ${row.note}`;
      }
      if (row.id === "nema-eia" || row.id === "eia-ppp") {
        return `**${row.label}.** I&AP rounds are the same trail as RAP consultation where both apply: one register, one grievance desk. ${row.note}`;
      }
      return `**${row.label}.** ${row.note}`;
    })
    .join("\n\n");
}

function summaryBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const sector = SEP_SECTOR_LABELS[plan.sectorId];
  const title = plan.projectNameHint || "this assignment";
  const client = plan.clientFunderHint || "the procuring entity (to be named in inception)";
  const place = plan.placeHint || "a place still to be locked (municipality, ward, customary structure)";
  const time = plan.timelineHint || "a period still to be confirmed";
  const named = namedLine(plan);

  if (plan.programmeKind === "relocation") {
    return [
      `This Stakeholder Engagement Plan is the **operating plan for relocation and migration** on **${title}**, prepared for **${client}**, in **${place}**, over **${time}**.`,
      "",
      plan.purposeStatement,
      "",
      "The work this document commits to is a move, not a round of information sessions:",
      "",
      "• Lock the sending and receiving footprint and a **cut-off date**.",
      "• Run a **PAP census and asset inventory** (physically displaced households, economically displaced PAPs, informal occupiers and tenants). Do not invent headcounts in this draft.",
      "• Consult on **eligibility, entitlement options, replacement sites, and move windows**, including **home visits to vulnerable PAPs**.",
      "• Treat the **host community** at the receiving site as a counterpart before first arrivals.",
      "• Convert accepted packages into **owned commitments**, run **move-week intake** as cases, and follow **livelihood restoration** on the same trail.",
      "• Keep **one grievance path** (48-hour acknowledgement) for census queries, compensation, site, treatment, and host amenity.",
      "",
      named
        ? `Organisations named in the extract: ${named}.`
        : "Named PAP organisations will be added when the census or briefing supplies them. This draft does not invent households.",
      "",
      `Sector lens: **${sector}**. Source: ${plan.sourceKind === "manual" ? "facts pack (no tender file)" : `${plan.sourceKind} extract`}.`,
      "",
      "Social Licence to Build™ here means the move can be shown: who was counted, who was consulted, what was promised, what was restored, and which cases remain open. After award that trail is kept on TrustLedger (registry, engagements, commitments, incidents). Themba on public pages does not write the live desk.",
    ].join("\n");
  }

  return [
    `This Stakeholder Engagement Plan is prepared for **${title}** (${sector.toLowerCase()}), for **${client}**, in **${place}**, over **${time}**.`,
    "",
    plan.purposeStatement,
    "",
    "The plan does four operational things a tender evaluator can test:",
    "",
    "1. **Name who matters** — affected people, traditional authority where it exists, local government, the client, and the contractor — with power, interest, and vulnerability.",
    "2. **Sequence the work** from inception to close-out, with owners, evidence, and Capture templates.",
    "3. **Put promises and grievances on one trail** (48-hour acknowledgement; one case ID).",
    "4. **Report from saved work**, not from a month-end template.",
    "",
    named ? `Organisations named in the extract: ${named}.` : null,
    "",
    `Source: ${plan.sourceKind === "manual" ? "facts pack (no tender file)" : `${plan.sourceKind} extract`}.`,
    "",
    "Social Licence to Build™ is executed after award on TrustLedger: registry, engagements, commitments, and incidents. This document is the plan of work — not a description of the software.",
  ]
    .filter((row) => row !== null)
    .join("\n");
}

function stakeholderBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const matrix = plan.stakeholderClasses
    .map((row) => {
      const q = SEP_QUADRANT_LABELS[quadrantForClass(row)];
      const named = row.namedFromBrief?.length
        ? ` Named in brief: ${row.namedFromBrief.join(", ")}.`
        : "";
      return `**${row.label}** — influence ${row.influence}, interest ${interestForClass(row)} → **${q}**. ${row.why} ${vulnerabilityForClass(row)}${named}`;
    })
    .join("\n\n");

  const rapNote =
    plan.programmeKind === "relocation"
      ? "PAP classes above are planning categories until a census names households. Informal occupiers and livelihood-only PAPs are in the register even when they are not on a title deed. Host-community consent is a gate before first arrivals."
      : "PAP / I&AP names appear only when they are in the extract. Land-rights and historical grievances belong on Incidents once a case exists.";

  return `${matrix}\n\nPower–interest is a working segmentation for the desk, not a political judgement. ${rapNote}`;
}

function methodsBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const intro =
    plan.programmeKind === "relocation"
      ? "Engagement follows the relocation sequence. Typical durations flex to the contract period (including a 3-month assignment: compress census and options, do not skip host consultation or the grievance brief)."
      : "Engagement follows inception → mapping → methods → first contact → consultation → commitments → close-out. Statutory dates in the briefing override typical durations.";

  const phases = plan.phases
    .map(
      (phase) =>
        `**Phase ${phase.order} — ${phase.title}** (${phase.typicalDuration}). ${phase.intent} **Exit:** ${phase.exitCriteria}`,
    )
    .join("\n\n");

  const acts = plan.activities
    .map(
      (act) =>
        `**${act.title}** — ${act.method}. Owner: ${act.ownerHint}. Timing: ${act.timingHint}. Evidence: ${act.evidenceHint}.`,
    )
    .join("\n\n");

  return `${intro}\n\n${phases}\n\n**Planned engagements (draft until applied)**\n\n${acts}`;
}

function grievanceBody(plan: Omit<EngagementPlan, "documentSections">): string {
  const rap =
    plan.programmeKind === "relocation"
      ? [
          "**Risks this plan is built to catch:** census exclusion; a cut-off that moves; packages announced without a commitment row; trucks before sign-off; a receiving site the host community has not seen; vulnerable PAPs only invited to the hall; livelihood loss treated as a comment.",
          "",
          "**Case categories on intake:** census / eligibility; compensation or package; replacement site or services; treatment or dignity; host-community amenity; contractor conduct.",
        ].join("\n")
      : "**Risks this plan is built to catch:** skipped traditional or ward channels; promises that die in the minutes; grievances that live on WhatsApp; labour intake that looks like favouritism; reports with no underlying desk work.";

  const commitments = plan.commitments.length
    ? plan.commitments
        .map((row) => `**${row.title}** — ${row.ownerHint}; ${row.dueHint}. ${row.why}`)
        .join("\n\n")
    : "Standing commitments will be named at first contact — do not invent dates.";

  return [
    `**Grievance path.** ${plan.grievancePath}`,
    "",
    rap,
    "",
    "**Lifecycle on the desk:** reported → resource deployed → investigated → resolved → verified → closed. Acknowledgement SLA (48 hours) and escalation sit on the case. Lodgment is Report issue, Capture, or the meeting floor — one ID.",
    "",
    commitments,
  ].join("\n");
}

function monitoringBody(plan: Omit<EngagementPlan, "documentSections">): string {
  if (plan.programmeKind === "relocation") {
    return [
      "Monitoring is a count of saved work, not a narrative about the software.",
      "",
      "**Leading indicators (fill after census — do not invent numbers here):**",
      "",
      "• Households in the census register vs. footprint estimate (once estimated).",
      "• Vulnerable PAPs visited vs. flagged.",
      "• Entitlement workshops held; attendance on Capture.",
      "• Host-community engagements completed before first arrival.",
      "• Packages on the commitment board vs. households scheduled to move.",
      "• Open incidents by category (census, compensation, site, treatment, host).",
      "• Restoration follow-ups at 30 / 90 days (or as the contract allows).",
      "",
      `Cadence: weekly internal during census and move week; a one-page note to ${plan.clientFunderHint || "the client"} after each public round. Activity reports and compliance briefs compose from engagements, commitments, and incidents on TrustLedger — empty desks produce empty packs.`,
    ].join("\n");
  }

  return [
    "Monitoring is a count of saved work.",
    "",
    "• Engagements held vs. planned (with minutes or attendance).",
    "• Open vs. closed commitments.",
    "• Incidents acknowledged within 48 hours; open vs. closed by category.",
    "• Intelligence facts the briefing required (labour / local content) with evidence.",
    "",
    `Cadence: a one-page note to ${plan.clientFunderHint || "the client"} after each public round. Reports compose from the desk. Empty desks produce empty packs.`,
  ].join("\n");
}

export function buildSepDocument(
  plan: Omit<EngagementPlan, "documentSections">,
): EngagementPlan["documentSections"] {
  const map = lane("map");
  const grievance = lane("grievance");
  const engage = lane("engage");
  const rap = plan.programmeKind === "relocation";

  return [
    {
      id: "summary",
      heading: rap
        ? "1. Executive summary — relocation & migration"
        : "1. Executive summary & Social Licence to Build™",
      body: summaryBody(plan),
      protocol: rap
        ? "After approval, Apply seeds PAP classes as prospect registry rows, draft engagements for census / host imbizo / entitlement workshops, and open commitments for cut-off, 48-hour acknowledgement, and no-move-without-package. Humans still name households. Themba does not write the live desk."
        : `${map.protocol} ${engage.protocol}`,
    },
    {
      id: "compliance",
      heading: "2. Regulatory & compliance mapping",
      body: instrumentBody(plan),
      protocol:
        "Each cited instrument becomes logged engagements and owned commitments on the assignment — not an appendix. Place / geo attaches the ward the instrument is exercised in.",
    },
    {
      id: "stakeholders",
      heading: "3. Stakeholder identification & vulnerability analysis",
      body: stakeholderBody(plan),
      protocol: rap
        ? "Physically and economically displaced PAPs, informal occupiers, host community, and vulnerable PAPs become registry classes on Apply. Influence and interest stay on the row. Historical grievances join Incidents only when a case exists."
        : map.protocol,
    },
    {
      id: "methods",
      heading: rap
        ? "4. Operational engagement methodology — census to restoration"
        : "4. Operational engagement methodology",
      body: methodsBody(plan),
      protocol:
        "Each activity becomes a draft Engagement with a Capture template (minutes, attendance, or field note). Commitments made in the room promote to the promise board.",
    },
    {
      id: "grievance",
      heading: rap
        ? "5. Risk mitigation & grievance mechanism — through the move"
        : "5. Risk mitigation & grievance mechanism architecture",
      body: grievanceBody(plan),
      protocol: grievance.protocol,
    },
    {
      id: "monitoring",
      heading: "6. Monitoring, evaluation & reporting",
      body: monitoringBody(plan),
      protocol:
        "Board and funder packs cite saved engagements, commitments, and incidents. Apply writes the draft rows; humans keep them current. Empty reports mean empty desk work.",
    },
    {
      id: "assumptions",
      heading: "7. Assumptions and limits",
      body: plan.assumptions.map((row) => `• ${row}`).join("\n"),
      protocol:
        "Limits stay on the exported plan. Apply does not invent household counts, replacement sites, or grievance cases.",
    },
  ];
}
