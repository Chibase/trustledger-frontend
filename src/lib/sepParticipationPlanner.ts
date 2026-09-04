/**
 * SEP Participation Planner
 * Phase E: TrustLedger SRM — SEP Generation Specification v1.0
 *
 * Specification Section 10: Participation Framework
 * Specification Section 11: Engagement Programme Design
 * Specification Section 12: Inclusion & Representation
 * Specification Section 13: Communications Strategy
 * Specification Section 14: Grievance & Social Issue Management
 * Specification Section 16: Monitoring, Evaluation & Learning
 */

import { selectMethodsForObjective } from "@/lib/sepMethodLibrary";
import type {
  Commitment,
  CommunicationPlan,
  EngagementActivity,
  GrievanceFramework,
  Indicator,
  MethodSelection,
  ParticipationObjective,
  ProjectProfile,
  SepGenerationPlan,
  SocialContextProfile,
  SocialRisk,
  StakeholderProfile,
  TenderIntelligence,
} from "@/types/sepAnalysis";

export type PlannerConstraints = {
  durationMonths: number;
  budget?: string;
};

function isoNow(): string {
  return new Date().toISOString();
}

function seq(prefix: string, index: number): string {
  return `${prefix}-${String(index).padStart(3, "0")}`;
}

type StakeholderKind = StakeholderProfile["stakeholderType"];
type ParticipationLevel = StakeholderProfile["participationLevel"];

function kindFromTender(
  kind: TenderIntelligence["namedStakeholders"][number]["kind"],
): StakeholderKind {
  if (kind === "government") return "government";
  if (kind === "community") return "community_group";
  if (kind === "contractor") return "contractor";
  if (kind === "funder") return "funder";
  if (kind === "ngo") return "ngo";
  return "other";
}

function participationFor(args: {
  name: string;
  kind: StakeholderKind;
  displacement: ProjectProfile["displacementType"];
}): { level: ParticipationLevel; influence: string[]; method: string; frequency: string } {
  const n = args.name.toLowerCase();
  if (/household|affected|pap|displac/.test(n) || args.kind === "household_group") {
    if (args.displacement === "none") {
      return {
        level: "involve",
        influence: [
          "how construction or service disruption is timed and explained",
          "grievance channels and helpdesk hours",
        ],
        method: "meetings, mapping, ranking",
        frequency: "at each decision gate and monthly thereafter",
      };
    }
    return {
      level: "collaborate",
      influence: [
        "relocation / design options that remain negotiable",
        "livelihood restoration pathways",
        "grievance channels and helpdesk hours",
      ],
      method: "household visits, mapping, option ranking",
      frequency: "at each decision gate and monthly thereafter",
    };
  }
  if (/host/.test(n)) {
    return {
      level: "collaborate",
      influence: ["host-community consent conditions", "shared services and timing of arrival"],
      method: "PLA consent workshops",
      frequency: "before any physical move is scheduled",
    };
  }
  if (/traditional|customary|royal/.test(n) || args.kind === "traditional_authority") {
    return {
      level: "involve",
      influence: ["protocol, venue, and sequence of community meetings", "customary land/access sensitivities"],
      method: "protocol meeting then joint sessions",
      frequency: "inception and before each public gathering",
    };
  }
  if (/municipal|ward|department|authority|sanitation/.test(n) || args.kind === "government") {
    return {
      level: "involve",
      influence: ["statutory process windows", "reporting format", "alignment with municipal consultation calendars"],
      method: "structured briefing and written comment",
      frequency: "inception, monthly, and at close-out",
    };
  }
  if (args.kind === "ngo") {
    return {
      level: "consult",
      influence: ["vulnerability methods", "independent observation of census conduct"],
      method: "technical consultation",
      frequency: "at method design and mid-term",
    };
  }
  return {
    level: "consult",
    influence: ["information needs and meeting timing"],
    method: "briefing and written update",
    frequency: "monthly",
  };
}

/**
 * Build stakeholder profiles from tender names plus affected-people / governance classes.
 * Does not invent personal names.
 */
export function generateStakeholderProfiles(
  tender: TenderIntelligence,
  project: ProjectProfile,
  socialContext: SocialContextProfile,
): StakeholderProfile[] {
  const now = isoNow();
  const profiles: StakeholderProfile[] = [];
  let n = 1;

  const push = (
    name: string,
    stakeholderType: StakeholderKind,
    extra?: Partial<StakeholderProfile>,
  ) => {
    const part = participationFor({
      name,
      kind: stakeholderType,
      displacement: project.displacementType,
    });
    profiles.push({
      id: seq("SH", n),
      projectProfileId: project.id,
      nameOrCategory: name,
      organisationIfApplicable: extra?.organisationIfApplicable,
      stakeholderType,
      geographicArea: extra?.geographicArea || tender.projectLocation,
      interests: extra?.interests || ["timely, accurate information", "fair process"],
      concerns: extra?.concerns || ["exclusion from decisions that affect them"],
      dependencies: extra?.dependencies || socialContext.affectedPeople.livelihoodDependencies.slice(0, 3),
      influence: extra?.influence || (stakeholderType === "government" ? "high" : "medium"),
      influenceOver: extra?.influenceOver || part.influence,
      capacity: extra?.capacity || { organisationalCapacity: "medium", constraints: ["to be confirmed in the field"] },
      projectImpact: extra?.projectImpact || socialContext.affectedPeople.description,
      impactType: extra?.impactType || (project.displacementType === "none" ? "mixed" : "displacement"),
      vulnerability: extra?.vulnerability || {
        relevantVulnerabilities: socialContext.vulnerabilities.slice(0, 2).map((row) => row.group),
        disproportionateImpactRisk: "Standard meetings may miss mobility-, language-, or time-poor groups",
        participationBarriers: ["timing", "transport", "language TBC"],
        accessNeeds: ["local language", "daylight timing", "accessible venue"],
      },
      representation: extra?.representation || {
        representationValidated: false,
        validationMethod: "To be confirmed with the group at first contact — not assumed from office-bearers",
      },
      relationshipWithClient: extra?.relationshipWithClient || "unknown",
      relationshipWithProject: extra?.relationshipWithProject || "unknown",
      relationshipsWithOtherStakeholders: extra?.relationshipsWithOtherStakeholders || [],
      engagementObjective: extra?.engagementObjective || `Secure informed participation of ${name} in decisions they can influence.`,
      participationLevel: extra?.participationLevel || part.level,
      whatTheyCanInfluence: extra?.whatTheyCanInfluence || part.influence,
      method: extra?.method || part.method,
      frequency: extra?.frequency || part.frequency,
      stakeholderSpecificRisks: extra?.stakeholderSpecificRisks || [],
      sensitivities: extra?.sensitivities || [],
      sentiment: extra?.sentiment || "unknown",
      priorCommitments: extra?.priorCommitments || [],
      evidenceRecords: extra?.evidenceRecords || [],
      profileCreatedAt: now,
      lastUpdatedAt: now,
      source: extra?.source || "tender_analysis",
      confidenceLevel: extra?.confidenceLevel || "medium",
    });
    n += 1;
  };

  const seen = new Set<string>();
  for (const named of tender.namedStakeholders) {
    const key = named.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const type = /traditional/i.test(named.name)
      ? "traditional_authority"
      : kindFromTender(named.kind);
    push(named.name, type, {
      organisationIfApplicable: named.name,
      ...(named.description ? { interests: [named.description] } : {}),
    });
  }

  if (![...seen].some((name) => /household|affected|pap/.test(name))) {
    push("Project-affected households", "household_group", {
      interests: ["relocation options", "entitlements", "livelihood restoration"],
      concerns: ["loss of access or income without a restoration pathway"],
      impactType: project.displacementType === "none" ? "mixed" : "displacement",
    });
  }

  if (
    project.displacementType !== "none" &&
    ![...seen].some((name) => /host/.test(name))
  ) {
    push("Host community structures", "community_group", {
      interests: ["service load", "consent conditions", "timing of arrival"],
      concerns: ["unconsulted in-migration of households"],
      impactType: "mixed",
    });
  }

  for (const gov of socialContext.governanceStructures) {
    const key = gov.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const type: StakeholderKind =
      gov.type === "traditional_authority"
        ? "traditional_authority"
        : gov.type === "municipal" || gov.type === "ward_committee"
          ? "government"
          : "community_group";
    push(gov.name, type, {
      interests: [gov.relevance],
      influence: gov.relationship === "authority" ? "high" : "medium",
    });
  }

  return profiles;
}

/**
 * Mandatory rule: every major stakeholder has an explicit participation objective
 * with decision linkage — not a generic “will be consulted”.
 */
export function generateParticipationObjectives(
  stakeholders: StakeholderProfile[],
  socialContext: SocialContextProfile,
  tender: TenderIntelligence,
): ParticipationObjective[] {
  const now = isoNow();
  const displacement = /relocation|resettlement|displac/i.test(
    [tender.tenderTitle, ...tender.requirements.map((r) => r.text)].join(" "),
  );

  return stakeholders.map((stakeholder, index) => {
    const level = stakeholder.participationLevel;
    const influence = stakeholder.whatTheyCanInfluence.length
      ? stakeholder.whatTheyCanInfluence
      : ["information needs and meeting timing"];
    const decisionArea = /household|affected/i.test(stakeholder.nameOrCategory)
      ? displacement
        ? "relocation options, entitlements, and livelihood pathways"
        : "disruption timing, information design, and grievance channels"
      : /host/i.test(stakeholder.nameOrCategory)
        ? "host-community consent and service-load conditions"
        : /municipal|department|authority/i.test(stakeholder.nameOrCategory)
          ? "statutory windows, reporting, and municipal alignment"
          : "engagement methods and information design";

    return {
      id: seq("PO", index + 1),
      stakeholderProfileId: stakeholder.id,
      stakeholderCategory: stakeholder.nameOrCategory,
      participationLevel: level,
      participationLevelRationale: `“${level}” is assigned because ${stakeholder.nameOrCategory} ${
        level === "inform"
          ? "must receive accurate information but does not own design choices"
          : level === "consult"
            ? "must be able to comment on methods or impacts before they are locked"
            : level === "involve"
              ? "must work with the team on process design (timing, protocol, statutory fit)"
              : "must share in decisions that change their land, livelihood, or consent"
      }. Generic “consultation” is not used as a blanket label.${
        displacement ? " Displacement makes decision linkage non-optional for affected and host groups." : ""
      }`,
      whatTheyCanInfluence: influence,
      decisionOrDesignArea: decisionArea,
      howInputWillBeConsidered:
        "Input is logged against the decision it was meant to influence. Where the client cannot adopt it, the reason is returned in writing or in the next meeting — silence is not a response.",
      feedbackMechanism:
        "Decision log + verbal feedback at the next scheduled contact with this group.",
      objectives: [
        {
          objective: `Enable ${stakeholder.nameOrCategory} to influence ${decisionArea}`,
          successCriterion: `At least one documented decision (or a documented refusal with reasons) linked to this group’s input`,
          evidence: "Decision log; minutes; returned-feedback note",
        },
        {
          objective: "Confirm representation is legitimate",
          successCriterion: "The group has confirmed who speaks for it, or the gap is logged as TBC",
          evidence: "Representation validation note",
        },
      ],
      linkedActivities: [],
      createdAt: now,
    };
  });
}

function monthHint(index: number, durationMonths: number): string {
  const month = Math.min(durationMonths, Math.max(1, index));
  return `Month ${month} of ${durationMonths} (calendar dates TBC at inception)`;
}

type ActivityTarget = "authorities" | "affected" | "host" | "all" | "vulnerable" | "traditional";

type ActivityDraft = {
  name: string;
  purpose: string;
  trigger: string;
  month: number;
  methodHint: "pra" | "pla" | "cbpr" | "other";
  tools: string[];
  output: string;
  decision: string;
  owner: string;
  records: string[];
  target: ActivityTarget;
};

/**
 * Sequence is selected from the assignment (Framework s.1; Specification s.9.1, s.11).
 * Census / host-consent / restoration steps are included only when displacement is stated.
 */
export function selectActivityTemplates(
  project: ProjectProfile,
  durationMonths: number,
): ActivityDraft[] {
  const duration = Math.max(1, durationMonths);
  const displaced = project.displacementType !== "none";
  const physical = project.displacementType === "physical" || project.displacementType === "mixed";
  const economic =
    project.displacementType === "economic" ||
    project.displacementType === "access_based" ||
    project.displacementType === "mixed";
  const short = duration <= 3;
  const research =
    project.researchIntensity === "participatory_research" ||
    project.researchIntensity === "longitudinal";
  const traditionalFirst =
    project.sector === "mining" ||
    project.sector === "conservation" ||
    project.complexityFactors.some((row) => /traditional|customary/i.test(row));
  const drafts: ActivityDraft[] = [];

  drafts.push({
    name: "Inception briefing with procuring and municipal authorities",
    purpose: "Lock what is negotiable, reporting format, and statutory windows before community work starts",
    trigger: "Contract start",
    month: 1,
    methodHint: "other",
    tools: ["briefing note"],
    output: "Inception note: negotiable items, TBC list, reporting calendar",
    decision: "Community activities do not start until negotiable items are stated in writing",
    owner: "Plan Owner",
    records: ["inception minutes", "negotiable-items list"],
    target: "authorities",
  });

  if (traditionalFirst) {
    drafts.push({
      name: "Courtesy meeting with traditional / customary authority",
      purpose: "Confirm protocol, venue and sequence before any public notice",
      trigger: "After inception",
      month: 1,
      methodHint: "other",
      tools: ["protocol note"],
      output: "Agreed protocol for public contact (or a documented TBC)",
      decision: "Public notice is not issued until protocol is recorded",
      owner: "Facilitation Lead",
      records: ["protocol minutes"],
      target: "traditional",
    });
  }

  if (project.sector === "conservation" || project.sector === "agriculture") {
    drafts.push({
      name: "Participatory transect and resource mapping",
      purpose: "Walk the landscape with resource users so land, water and seasonal use are described by those who use them",
      trigger: "After protocol / inception",
      month: short ? 1 : 2,
      methodHint: "pra",
      tools: ["transects", "mapping"],
      output: "Validated resource map and transect notes",
      decision: "Design options that affect access are not locked before the transect is validated",
      owner: "Facilitation Lead",
      records: ["transect notes", "signed map", "attendance register"],
      target: "all",
    });
  } else {
    drafts.push({
      name: displaced
        ? "Stakeholder map validation workshop"
        : "Institutional and interest mapping workshop",
      purpose: displaced
        ? "Understand local conditions and validate who is affected, who influences, and who is missing"
        : "Map the structures that already govern the place and who must be reached before public notice",
      trigger: traditionalFirst ? "After protocol meeting" : "After inception",
      month: 1,
      methodHint: "pra",
      tools: ["social mapping", "institutional mapping"],
      output: "Validated stakeholder map with influence/interest notes",
      decision: "Map used to tailor engagement methods per group",
      owner: "Facilitation Lead",
      records: ["signed map", "attendance register"],
      target: "all",
    });
  }

  drafts.push({
    name: "Grievance mechanism co-design workshop",
    purpose: "Establish one grievance mechanism for all project-related complaints, with usable channels",
    trigger: short ? "Month 1, before first public activity" : "Month 1–2, before first material impact",
    month: Math.min(2, duration),
    methodHint: "pla",
    tools: ["action planning"],
    output: "Agreed grievance workflow, channels, and 48-hour acknowledgement standard",
    decision: "The mechanism is not declared operational until users confirm channels they can actually use",
    owner: "Community liaison",
    records: ["grievance SOP", "channel map", "attendance register"],
    target: "all",
  });

  if (project.vulnerabilityIntensity !== "low") {
    drafts.push({
      name: "Vulnerable-group focus groups and home visits",
      purpose: "Identify participation barriers and alternative mechanisms for groups standard meetings will miss",
      trigger: "In parallel with mapping",
      month: Math.min(2, duration),
      methodHint: "pra",
      tools: ["ranking", "social mapping"],
      output: "Vulnerability matrix and access adjustments",
      decision: "Public calendar is not issued until access adjustments are listed",
      owner: "Facilitation Lead",
      records: ["disaggregated attendance", "home-visit log"],
      target: "vulnerable",
    });
  }

  if (physical) {
    drafts.push({
      name: "Participatory household census",
      purpose: "Co-produce household knowledge that entitlements and restoration will rely on",
      trigger: "After map validation",
      month: Math.min(2, duration),
      methodHint: "cbpr",
      tools: ["participatory census"],
      output: "Validated household census; tender estimates remain estimates until this is done",
      decision: "Census is the only basis for targeting entitlements and livelihood support",
      owner: "Social Performance Lead",
      records: ["consent records", "census forms", "joint analysis minutes"],
      target: "affected",
    });
  }

  if (economic || project.sector === "agriculture") {
    drafts.push({
      name: "Livelihood and seasonal calendar sessions",
      purpose: "Diagnose livelihood systems and critical periods before options are ranked",
      trigger: physical ? "During census analysis" : "After mapping",
      month: Math.min(physical ? 3 : 2, duration),
      methodHint: "pra",
      tools: ["seasonal calendars", "ranking"],
      output: "Livelihood analysis and seasonal constraints",
      decision: "Disruption windows must respect validated critical periods",
      owner: "Livelihood Lead",
      records: ["seasonal calendars", "ranking sheets"],
      target: "affected",
    });
  }

  if (physical) {
    drafts.push({
      name: "Relocation options and entitlements consultation",
      purpose: "Consult affected households on relocation options, entitlements, and what remains fixed",
      trigger: "After draft census",
      month: Math.min(3, duration),
      methodHint: "pla",
      tools: ["option ranking", "priority matrix"],
      output: "Ranked options and decision log (no invented package values)",
      decision: "Client cannot lock a relocation option households have not ranked",
      owner: "Plan Owner",
      records: ["decision log", "ranking sheets", "attendance register"],
      target: "affected",
    });
    drafts.push({
      name: "Host-community consent process",
      purpose: "Obtain and record host-community conditions before any physical move is scheduled",
      trigger: "After options shortlist",
      month: Math.min(3, duration),
      methodHint: "pla",
      tools: ["action planning"],
      output: "Host consent conditions (or a documented refusal / TBC)",
      decision: "Move-week is not scheduled without a recorded host position",
      owner: "Community liaison",
      records: ["consent record", "minutes"],
      target: "host",
    });
  } else if (economic) {
    drafts.push({
      name: "Access and livelihood restoration ranking",
      purpose: "Rank restoration pathways with the people who lose access or income",
      trigger: "After livelihood analysis",
      month: Math.min(3, duration),
      methodHint: "pla",
      tools: ["option ranking", "priority matrix"],
      output: "Ranked restoration pathways (no invented package values)",
      decision: "Restoration packages are not locked until ranking is on the decision log",
      owner: "Livelihood Lead",
      records: ["decision log", "ranking sheets"],
      target: "affected",
    });
  } else {
    drafts.push({
      name:
        project.sector === "municipal"
          ? "Ward and municipal calendar alignment"
          : "Public-notice and comment-window design",
      purpose:
        project.sector === "municipal"
          ? "Place this assignment on the municipal public-participation calendar named in the briefing"
          : "Design notice, comment windows and feedback so a statutory meeting is still a real meeting",
      trigger: "After mapping and grievance design",
      month: Math.min(2, duration),
      methodHint: "pla",
      tools: ["action planning"],
      output: "Notice pack contents, comment window, and feedback duty",
      decision: "Public notice is not treated as consultation until the feedback duty is stated",
      owner: "Facilitation Lead",
      records: ["notice pack", "calendar extract"],
      target: "authorities",
    });
  }

  if (research) {
    drafts.push({
      name: "Community-defined impact research",
      purpose: "Co-produce evidence on impacts using questions the affected people help set",
      trigger: "After mapping",
      month: Math.min(Math.max(3, Math.floor(duration / 2)), duration),
      methodHint: "cbpr",
      tools: ["participatory research", "community-defined indicators"],
      output: "Jointly analysed impact findings; baselines remain TBC until collected",
      decision: "Impact claims in reports must cite this research or be marked TBC",
      owner: "Social Performance Lead",
      records: ["research protocol", "consent records", "joint analysis minutes"],
      target: "affected",
    });
  }

  if (project.sector === "mining") {
    drafts.push({
      name: "Social and Labour Plan promise review",
      purpose: "Read SLP commitments that the briefing named against what communities can recognise as evidence",
      trigger: "After mapping",
      month: Math.min(3, duration),
      methodHint: "pla",
      tools: ["commitment register"],
      output: "SLP promises that are in the briefing, with evidence fields — none invented",
      decision: "Only briefing-named SLP items enter the commitment register",
      owner: "Plan Owner",
      records: ["commitment register extract"],
      target: "all",
    });
  }

  if (!short) {
    drafts.push({
      name: "Progress and commitment review",
      purpose: "Document engagements; maintain the commitment register; produce progress reports from records",
      trigger: duration >= 8 ? "Quarterly" : "Monthly",
      month: Math.min(4, duration),
      methodHint: "other",
      tools: ["commitment register"],
      output: "Progress report from records (no invented counts)",
      decision: "Unfulfilled commitments are escalated rather than restated as plans",
      owner: "Plan Owner",
      records: ["progress report", "meeting minutes", "register extract"],
      target: "authorities",
    });
  }

  drafts.push({
    name: "Close-out learning session",
    purpose: "After-action review of what participation changed, what remains TBC, and handover of records",
    trigger: "Final month",
    month: duration,
    methodHint: "pla",
    tools: ["after-action review", "community scorecards"],
    output: "Learning note and handover pack",
    decision: "Outstanding commitments and grievances are handed over, not closed on paper",
    owner: "Plan Owner",
    records: ["learning note", "handover inventory"],
    target: "all",
  });

  return drafts;
}

export function generateEngagementActivities(
  participationObjectives: ParticipationObjective[],
  methodSelections: MethodSelection[],
  socialContext: SocialContextProfile,
  constraints: PlannerConstraints,
  project: ProjectProfile,
  stakeholders: StakeholderProfile[],
): EngagementActivity[] {
  const now = isoNow();
  const duration = Math.max(1, constraints.durationMonths || 6);
  const byId = new Map(stakeholders.map((row) => [row.id, row]));
  const affected = stakeholders.filter(
    (row) =>
      row.stakeholderType === "household_group" ||
      /affected|household|host/i.test(row.nameOrCategory),
  );
  const authorities = stakeholders.filter(
    (row) =>
      row.stakeholderType === "government" ||
      row.stakeholderType === "traditional_authority",
  );
  const traditional = stakeholders.filter((row) => row.stakeholderType === "traditional_authority");
  const host = stakeholders.filter((row) => /host/i.test(row.nameOrCategory));
  const vulnerable = stakeholders.filter((row) =>
    /women|elder|disabled|informal|vulnerab/i.test(row.nameOrCategory),
  );

  const resolveTargets = (kind: ActivityTarget): StakeholderProfile[] => {
    if (kind === "authorities") return authorities.length ? authorities : stakeholders;
    if (kind === "affected") return affected.length ? affected : stakeholders;
    if (kind === "host") return host.length ? host : traditional.length ? traditional : affected;
    if (kind === "traditional") return traditional.length ? traditional : authorities;
    if (kind === "vulnerable") return vulnerable.length ? vulnerable : affected.length ? affected : stakeholders;
    return stakeholders;
  };

  const methodByHint = (hint: "pra" | "pla" | "cbpr") =>
    methodSelections.find((row) => row.methodology === hint);

  const templates = selectActivityTemplates(project, duration);

  const activities: EngagementActivity[] = templates.map((template, index) => {
    const method = template.methodHint === "other" ? undefined : methodByHint(template.methodHint);
    const targetIds = resolveTargets(template.target).map((row) => row.id);
    return {
      id: seq("ACT", index + 1),
      projectProfileId: project.id,
      activityName: template.name,
      purpose: template.purpose,
      trigger: template.trigger,
      plannedDate: monthHint(template.month, duration),
      targetedStakeholders: targetIds,
      method:
        template.methodHint === "other"
          ? template.tools[0] || "structured meeting"
          : `${template.methodHint.toUpperCase()} — ${method?.tool || template.tools[0]}`,
      methodSelectionId: method?.id,
      tools: template.tools,
      informationNeeded: [
        "tender requirements",
        "prior activity outputs",
        "TBC items log",
        socialContext.affectedPeople.geographicLocation,
      ],
      facilitationApproach:
        "Separate or sequential sessions where mixed groups would silence vulnerable participants. Languages of the project area TBC at inception.",
      expectedOutput: template.output,
      decisionLinkage: template.decision,
      owner: template.owner,
      requiredRecords: template.records,
      performanceIndicator: `Completion of ${template.name} with required records`,
      status: "planned",
      createdAt: now,
      plannedEvidence: "proposed_methodology",
    };
  });

  for (const objective of participationObjectives) {
    const stakeholder = byId.get(objective.stakeholderProfileId);
    if (!stakeholder) continue;
    objective.linkedActivities = activities
      .filter((activity) => activity.targetedStakeholders.includes(stakeholder.id))
      .map((activity) => activity.id);
  }

  return activities;
}

export function generateCommunicationPlan(
  stakeholders: StakeholderProfile[],
  socialContext: SocialContextProfile,
  project?: ProjectProfile,
): CommunicationPlan[] {
  const now = isoNow();
  const language = "Languages of the project area, to be confirmed at inception — not assumed";
  const access = [
    "Daylight timing",
    "Accessible venue or home visit",
    "Plain language; oral briefing where literacy is a barrier",
    ...socialContext.vulnerabilities.slice(0, 3).flatMap((row) =>
      row.participationBarriers.map((barrier) => `${row.group}: ${barrier}`),
    ),
  ].slice(0, 8);

  const displaced = project ? project.displacementType !== "none" : true;
  const physical =
    project?.displacementType === "physical" || project?.displacementType === "mixed";

  const groups: Array<{
    audience: string;
    message: string;
    points: string[];
    channel: CommunicationPlan["channel"];
    channels: string[];
    frequency: string;
  }> = [
    {
      audience: displaced ? "Project-affected households" : "People who live with the project",
      message: displaced
        ? "No option that changes your home, stand or livelihood will be locked without your ranking of the options that actually exist."
        : "You will be told what is already decided and what you can still influence before public notice is treated as consultation.",
      points: displaced
        ? [
            "Enumeration first — tender household figures remain estimates",
            "What you can influence (options, pathways, grievance channels)",
            "How to lodge a complaint within 48-hour acknowledgement",
          ]
        : [
            "What is negotiable vs already decided",
            "How to use the grievance path (48-hour acknowledgement)",
            "How comments are returned on the decision log",
          ],
      channel: "community_meeting",
      channels: ["in-person meeting", "home visit", "notice board"],
      frequency: "before each decision gate",
    },
    {
      audience: "Municipal and procuring authorities",
      message: "This assignment will report from records, not from invented counts.",
      points: ["Progress report from records", "Commitment register extract", "Grievance trend note"],
      channel: "email",
      channels: ["email", "written letter", "in-person briefing"],
      frequency: project && project.implementationHorizon === "short_term" ? "at each gate" : "monthly",
    },
  ];

  if (physical) {
    groups.splice(1, 0, {
      audience: "Host community structures",
      message: "A physical move is not scheduled until host conditions are recorded.",
      points: ["Service-load concerns", "Consent conditions", "The grievance path is the same mechanism"],
      channel: "in_person_meeting",
      channels: ["in-person meeting", "letter to validated representatives"],
      frequency: "before options are shortlisted and before move-week",
    });
  }

  for (const stakeholder of stakeholders) {
    if (groups.some((row) => row.audience.toLowerCase() === stakeholder.nameOrCategory.toLowerCase())) {
      continue;
    }
    if (stakeholder.stakeholderType === "ngo") {
      groups.push({
        audience: stakeholder.nameOrCategory,
        message: "Independent observation of census and vulnerability methods is invited; it does not replace household validation.",
        points: ["Method design window", "No household data shared beyond agreed fields"],
        channel: "email",
        channels: ["email", "technical meeting"],
        frequency: "at method design and mid-term",
      });
    }
  }

  return groups.map((row, index) => ({
    id: seq("COMMS", index + 1),
    projectProfileId: stakeholders[0]?.projectProfileId || "PROJ",
    audience: row.audience,
    messageCore: row.message,
    messageKeyPoints: row.points,
    channel: row.channel,
    channels: row.channels,
    language,
    accessibilityRequirements: access,
    frequency: row.frequency,
    owner: "CLO",
    verificationOfReceipt: "Attendance register or written acknowledgement",
    createdAt: now,
  }));
}

export function generateGrievanceFramework(
  socialContext: SocialContextProfile,
  socialRisks: SocialRisk[],
): GrievanceFramework {
  const now = isoNow();
  const projectId = socialRisks[0]?.projectProfileId || socialContext.projectProfileId;

  const stages: GrievanceFramework["stages"] = [
    {
      stage: "prevention",
      function: "Publish negotiable items, contacts, and what has already been decided — most complaints start as information failure",
      responsibleRole: "CLO",
      evidence: "Notice pack; briefing minutes",
    },
    {
      stage: "lodgement",
      function: "Accept complaints through more than one channel, including routes that do not require a public meeting",
      responsibleRole: "CLO / helpdesk",
      evidence: "Issue log entry",
    },
    {
      stage: "acknowledgement",
      function: "Confirm receipt to the complainant in a form they can use",
      responsibleRole: "CLO",
      serviceLevel: "48 hours",
      evidence: "Acknowledgement record",
    },
    {
      stage: "classification",
      function: "Classify by category and severity; flag reprisal or GBV-related matters for restricted handling",
      responsibleRole: "CLO",
      serviceLevel: "5 working days",
      evidence: "Classification on the issue log",
    },
    {
      stage: "investigation",
      function: "Establish facts with the people affected; do not close from a contractor assertion alone",
      responsibleRole: "Issue owner",
      serviceLevel: "15 working days (or a documented extension)",
      evidence: "Investigation note",
    },
    {
      stage: "response",
      function: "State what will be done, by whom, by when — or why a requested remedy cannot be given",
      responsibleRole: "Issue owner",
      evidence: "Written or minuted response",
    },
    {
      stage: "resolution",
      function: "Carry out the agreed action and record evidence",
      responsibleRole: "Issue owner",
      evidence: "Action evidence (photo, signature, payment record as applicable)",
    },
    {
      stage: "escalation",
      function: "Escalate when the service level is missed, the complainant rejects the response, or the issue is systemic",
      responsibleRole: "Plan Owner",
      evidence: "Escalation note",
    },
    {
      stage: "closure",
      function: "Close only when the complainant is informed and required evidence is on file — not when the team is tired of the item",
      responsibleRole: "CLO",
      evidence: "Closure record with complainant notification",
    },
  ];

  const issueCategories: GrievanceFramework["issueCategories"] = [
    {
      category: "livelihood loss / access disruption",
      severity: "high",
      routingLogic: "Livelihood Lead; link to restoration pathway",
    },
    {
      category: "relocation / entitlement dispute",
      severity: "critical",
      routingLogic: "Plan Owner; no move-week while the dispute is open unless the household agrees",
    },
    {
      category: "participation / exclusion",
      severity: "medium",
      routingLogic: "Facilitation Lead; adjust method before the next gate",
    },
    {
      category: "safety / reprisal",
      severity: "critical",
      routingLogic: "Plan Owner immediately; restricted file",
    },
  ];

  for (const risk of socialRisks) {
    if (risk.linkedGrievanceCategory && !issueCategories.some((row) => row.category === risk.linkedGrievanceCategory)) {
      issueCategories.push({
        category: risk.linkedGrievanceCategory,
        severity: risk.severity,
        routingLogic: `Owner: ${risk.owner}`,
      });
    }
  }

  return {
    id: seq("GRM", 1),
    projectProfileId: projectId,
    stages,
    lodgementChannels: [
      {
        channel: "walk-in helpdesk",
        accessibility: "Daylight hours at a venue agreed with affected people; mobility alternatives via home visit",
        recordingMethod: "Issue log, same day",
      },
      {
        channel: "meeting floor",
        accessibility: "Any public engagement; complaints are recorded, not debated away",
        recordingMethod: "Minutes + issue log",
      },
      {
        channel: "written letter / note",
        accessibility: "No literacy test; oral complaints are written by the CLO and read back",
        recordingMethod: "Issue log with read-back confirmation",
      },
      {
        channel: "WhatsApp or phone (if a number is issued)",
        accessibility: "Number TBC at inception — not invented here",
        recordingMethod: "Screenshot or call log attached to the issue",
      },
    ],
    issueCategories,
    escalationRules: [
      {
        trigger: "Unacknowledged after 48 hours",
        escalateTo: "Plan Owner",
        escalationOwner: "CLO",
      },
      {
        trigger: "Unresolved after 30 days",
        escalateTo: "Procuring entity / client project manager",
        escalationOwner: "Plan Owner",
      },
      {
        trigger: "Repeated issue threshold reached (systemic)",
        escalateTo: "Programme risk register",
        escalationOwner: "Plan Owner",
      },
    ],
    trendMonitoring: {
      repeatedIssueThreshold: 3,
      systemicRiskResponse:
        "Three similar complaints are treated as a programme risk: pause the related activity if it is causing harm, brief the client, and redesign the method.",
    },
    createdAt: now,
    basedOnProjectRisks: socialRisks.map((row) => row.id),
  };
}

export function generateIndicators(
  engagementActivities: EngagementActivity[],
  participationObjectives: ParticipationObjective[],
  socialRisks: SocialRisk[],
): Indicator[] {
  const now = isoNow();
  const projectId =
    engagementActivities[0]?.projectProfileId ||
    participationObjectives[0]?.id ||
    "PROJ";
  const rows: Indicator[] = [];
  let n = 1;

  rows.push({
    id: seq("IND", n++),
    projectProfileId: projectId,
    indicatorName: "Facilitation capacity in place",
    indicatorType: "input",
    indicatorTypeExplanation: "Were resources available?",
    definition: "Named facilitator, CLO, and recorder assigned before first community activity",
    measurementUnit: "yes/no",
    baseline: "Not assigned at tender stage",
    target: "Assigned before first public activity",
    frequency: "once at inception, reviewed monthly",
    evidenceSource: "Appointment / to-do record (no invented staff names)",
    dataCollectionMethod: "Plan Owner confirms named roles",
    owner: "Plan Owner",
    createdAt: now,
  });

  for (const activity of engagementActivities) {
    rows.push({
      id: seq("IND", n++),
      projectProfileId: projectId,
      indicatorName: `Process — ${activity.activityName}`,
      indicatorType: "process",
      indicatorTypeExplanation: "Did engagement occur?",
      definition: `${activity.activityName} held as planned, or a documented adaptation`,
      measurementUnit: "completed / adapted / missed",
      baseline: "Not started",
      target: "Completed with required records",
      frequency: "per activity",
      evidenceSource: activity.requiredRecords.join("; ") || "attendance register",
      dataCollectionMethod: "CLO files records within five working days",
      owner: activity.owner,
      linkedToEngagementActivity: activity.id,
      createdAt: now,
    });
    rows.push({
      id: seq("IND", n++),
      projectProfileId: projectId,
      indicatorName: `Output — ${activity.expectedOutput}`,
      indicatorType: "output",
      indicatorTypeExplanation: "What did participation produce?",
      definition: activity.expectedOutput,
      measurementUnit: "artefact present / absent",
      baseline: "Not produced",
      target: "Artefact filed and, where required, validated with participants",
      frequency: "per activity",
      evidenceSource: activity.requiredRecords[0] || "output file",
      dataCollectionMethod: "Facilitation Lead files the artefact",
      owner: activity.owner,
      linkedToEngagementActivity: activity.id,
      createdAt: now,
    });
  }

  for (const objective of participationObjectives.slice(0, 8)) {
    rows.push({
      id: seq("IND", n++),
      projectProfileId: projectId,
      indicatorName: `Outcome — ${objective.stakeholderCategory} influenced ${objective.decisionOrDesignArea}`,
      indicatorType: "outcome",
      indicatorTypeExplanation: "Did it change something?",
      definition: `A recorded decision (or recorded refusal with reasons) linked to ${objective.stakeholderCategory}`,
      measurementUnit: "decision-log entries",
      baseline: "No participation record yet",
      target: "At least one evidenced decision linkage per major group",
      frequency: "at each decision gate",
      evidenceSource: "Decision log; returned-feedback note",
      dataCollectionMethod: "Plan Owner reviews the decision log monthly",
      owner: "Plan Owner",
      linkedToParticipationObjective: objective.id,
      createdAt: now,
    });
  }

  for (const risk of socialRisks) {
    if (!risk.monitoringIndicator) continue;
    rows.push({
      id: seq("IND", n++),
      projectProfileId: projectId,
      indicatorName: `Risk monitor — ${risk.issue}`,
      indicatorType: "outcome",
      indicatorTypeExplanation: "Did it change something?",
      definition: risk.monitoringIndicator,
      measurementUnit: "as defined in the risk register",
      baseline: "Unknown until first measurement",
      target: "Early-warning trigger not breached, or trigger leads to a documented response",
      frequency: "monthly",
      evidenceSource: risk.evidence,
      dataCollectionMethod: risk.owner,
      owner: risk.owner,
      createdAt: now,
    });
  }

  return rows;
}

export function generateCommitments(
  tender: TenderIntelligence,
  project: ProjectProfile,
  stakeholders: StakeholderProfile[],
  activities: EngagementActivity[],
): Commitment[] {
  const now = isoNow();
  const client = stakeholders.find((row) => row.stakeholderType === "government") || stakeholders[0];
  const pah = stakeholders.find((row) => row.stakeholderType === "household_group") || stakeholders[0];
  const rows: Commitment[] = [
    {
      id: seq("CM", 1),
      projectProfileId: project.id,
      commitmentText: "Document all engagements and maintain a commitment register with evidence tracking",
      context: "Stated tender requirement",
      madeToStakeholder: client?.id || "client",
      madeByRole: "Plan Owner",
      action: "Operate a live register of promises, owners, due dates, and evidence",
      owner: "Plan Owner",
      requiredEvidence: ["commitment register", "monthly extract"],
      verificationMethod: "Monthly progress report",
      status: "open",
      linkedToActivity: activities.find((row) => /monthly progress/i.test(row.activityName))?.id,
      createdAt: now,
      lastUpdatedAt: now,
    },
    {
      id: seq("CM", 2),
      projectProfileId: project.id,
      commitmentText: "Establish one grievance mechanism for all project-related complaints, with 48-hour acknowledgement",
      context: "Stated tender requirement",
      madeToStakeholder: pah?.id || "affected households",
      madeByRole: "Plan Owner",
      action: "Co-design and operate a single GRM before first material impact",
      owner: "CLO",
      requiredEvidence: ["GRM SOP", "acknowledgement records"],
      verificationMethod: "Issue log sample in monthly report",
      status: "open",
      linkedToActivity: activities.find((row) => /grievance/i.test(row.activityName))?.id,
      createdAt: now,
      lastUpdatedAt: now,
    },
  ];

  if (tender.requirements.some((row) => /livelihood/i.test(row.text))) {
    rows.push({
      id: seq("CM", 3),
      projectProfileId: project.id,
      commitmentText: "No livelihood restoration package will be issued until affected households have ranked pathways against a validated census",
      context: "Professional inference from the livelihood and census requirements — not a tender-stated package value",
      madeToStakeholder: pah?.id || "affected households",
      madeByRole: "Plan Owner",
      action: "Hold restoration ranking after census; mark packages TBC until then",
      owner: "Livelihood Lead",
      requiredEvidence: ["census validation", "ranking sheets"],
      verificationMethod: "Community inspection of the ranking record",
      status: "open",
      createdAt: now,
      lastUpdatedAt: now,
    });
  }

  return rows;
}

export function validateInclusionDesign(
  plan: Pick<SepGenerationPlan, "activities" | "communications" | "stakeholders">,
  vulnerabilities: SocialContextProfile["vulnerabilities"],
): { compliant: boolean; gaps: string[] } {
  const gaps: string[] = [];
  const activityText = plan.activities.map((row) => `${row.activityName} ${row.facilitationApproach} ${row.purpose}`).join(" ");
  const commsText = plan.communications.map((row) => `${row.audience} ${(row.accessibilityRequirements || []).join(" ")}`).join(" ");
  const blob = `${activityText} ${commsText}`.toLowerCase();

  const hasAlternative =
    /home visit|focus group|walkabout|separate session|peer-to-peer/i.test(blob);
  if (!hasAlternative) {
    gaps.push("No alternative to standard meetings is designed for groups who cannot attend public gatherings.");
  }

  for (const row of vulnerabilities) {
    const tokens = [row.group, ...row.participationBarriers]
      .join(" ")
      .toLowerCase()
      .split(/\W+/)
      .filter((token) => token.length > 4);
    const mentioned = tokens.some((token) => blob.includes(token));
    if (!mentioned) {
      gaps.push(`Vulnerability group “${row.group}” has no explicit alternative engagement or accessibility measure.`);
    }
  }

  const unvalidated = plan.stakeholders.filter((row) => !row.representation.representationValidated);
  if (unvalidated.length === plan.stakeholders.length) {
    // Expected at tender stage — not a hard fail, but record the duty.
    gaps.push(
      "Representation is not yet validated for any group. First-contact activities must confirm who speaks for whom before treating office-bearers as legitimate.",
    );
  }

  const hard = gaps.filter((row) => /no alternative|has no explicit/i.test(row));
  return { compliant: hard.length === 0, gaps };
}

export function bindMethodsToActivities(
  methods: MethodSelection[],
  activities: EngagementActivity[],
): MethodSelection[] {
  return methods.map((method) => {
    const activity = activities.find((row) => row.methodSelectionId === method.id);
    return activity ? { ...method, engagementActivityId: activity.id } : method;
  });
}

/**
 * Assemble participation architecture from tender analysis objects.
 */
export function planParticipation(args: {
  tender: TenderIntelligence;
  project: ProjectProfile;
  socialContext: SocialContextProfile;
  risks: SocialRisk[];
  constraints?: PlannerConstraints;
}): Pick<
  SepGenerationPlan,
  | "stakeholders"
  | "participationObjectives"
  | "methods"
  | "activities"
  | "communications"
  | "grievanceFramework"
  | "commitments"
  | "indicators"
> {
  const duration = args.constraints?.durationMonths || args.tender.contractPeriod.durationMonths || 6;
  const stakeholders = generateStakeholderProfiles(args.tender, args.project, args.socialContext);
  const participationObjectives = generateParticipationObjectives(
    stakeholders,
    args.socialContext,
    args.tender,
  );

  const seedMethods: MethodSelection[] = [];
  const seen = new Set<string>();
  const methodObjectives: string[] = [
    "Understand local conditions and validate the stakeholder map",
    "Co-design a grievance mechanism",
  ];
  if (args.project.displacementType === "physical" || args.project.displacementType === "mixed") {
    methodObjectives.push("Co-produce a participatory census of affected households");
    methodObjectives.push("Plan relocation options, entitlements, and host-community consent");
  } else if (args.project.displacementType !== "none") {
    methodObjectives.push("Diagnose livelihood systems and seasonal constraints");
    methodObjectives.push("Plan restoration pathways with affected people");
  } else {
    methodObjectives.push("Identify community priorities before design choices are locked");
  }
  if (
    args.project.researchIntensity === "participatory_research" ||
    args.project.researchIntensity === "longitudinal"
  ) {
    methodObjectives.push(
      "Conduct participatory research on impacts with community-defined indicators",
    );
  }
  for (const objective of methodObjectives) {
    const ranked = selectMethodsForObjective(objective, stakeholders, { durationMonths: duration });
    const top = ranked[0];
    if (top && !seen.has(top.methodology)) {
      seen.add(top.methodology);
      seedMethods.push({ ...top, id: `MS-${top.methodology}` });
    }
  }

  const activities = generateEngagementActivities(
    participationObjectives,
    seedMethods,
    args.socialContext,
    { durationMonths: duration, budget: args.constraints?.budget },
    args.project,
    stakeholders,
  );
  const methods = bindMethodsToActivities(seedMethods, activities);
  const communications = generateCommunicationPlan(
    stakeholders,
    args.socialContext,
    args.project,
  );
  const grievanceFramework = generateGrievanceFramework(args.socialContext, args.risks);
  const commitments = generateCommitments(args.tender, args.project, stakeholders, activities);
  const indicators = generateIndicators(activities, participationObjectives, args.risks);

  return {
    stakeholders,
    participationObjectives,
    methods,
    activities,
    communications,
    grievanceFramework,
    commitments,
    indicators,
  };
}
