/**
 * Sector playbooks for Stakeholder Engagement Plans.
 * Practice frames for Global South programmes — not legal advice,
 * not a claimed IFC/NEMA certificate.
 */

import type {
  SepActivity,
  SepDraftCommitment,
  SepInstrument,
  SepPhase,
  SepSectorId,
  SepStakeholderClass,
} from "@/types/engagementPlan";

export type SepSectorPlaybook = {
  id: SepSectorId;
  summary: string;
  phases: SepPhase[];
  stakeholderClasses: SepStakeholderClass[];
  activities: SepActivity[];
  commitments: SepDraftCommitment[];
  instruments: SepInstrument[];
  grievancePath: string;
  assumptions: string[];
};

const PHASES: SepPhase[] = [
  {
    id: "inception",
    order: 1,
    title: "Inception & briefing",
    intent:
      "Confirm the assignment, place, and what ‘success’ means for the client, affected people, and the authorising environment.",
    exitCriteria:
      "Written purpose, named client counterpart, place sketch, and a decision on whether this is inform / consult / decide / remediate.",
    typicalDuration: "Week 0–1",
    module: "projects",
  },
  {
    id: "mapping",
    order: 2,
    title: "Stakeholder identification",
    intent:
      "Name the people and institutions who can grant, withhold, or repair social licence — including those who are affected but not invited.",
    exitCriteria:
      "Registry classes with influence, interests, and place. Traditional authorities and local government are not optional where they exist.",
    typicalDuration: "Week 1–2",
    module: "stakeholders",
  },
  {
    id: "scoping",
    order: 3,
    title: "Method & cadence design",
    intent:
      "Choose methods that match purpose and literacy/connectivity, and set a cadence that can be kept.",
    exitCriteria:
      "Activity list with owners, evidence type, and Capture templates. Geo / ward attached if the site is known.",
    typicalDuration: "Week 2",
    module: "geo",
  },
  {
    id: "first_contact",
    order: 4,
    title: "First contact & legitimacy",
    intent:
      "Introduce the work through legitimate channels before any ‘consultation’ event is advertised.",
    exitCriteria:
      "Courtesy calls / letters logged. Community and authority counterparts know who to call.",
    typicalDuration: "Week 2–3",
    module: "engagements",
  },
  {
    id: "consultation",
    order: 5,
    title: "Structured consultation",
    intent:
      "Run the engagements in the plan. Always open with previous commitments before new concerns.",
    exitCriteria:
      "Minutes or attendance on Capture; engagements linked to named stakeholders; issues that are cases are on the grievance desk.",
    typicalDuration: "Weeks 3–8 (programme-specific)",
    module: "capture",
  },
  {
    id: "commitments",
    order: 6,
    title: "Commitments, grievance & adapt",
    intent:
      "Turn promises into owned dates. Route complaints to one case ID. Adjust the plan when the field disagrees with the briefing.",
    exitCriteria:
      "Open commitments on the board; grievance path briefed; SLA owners named.",
    typicalDuration: "Ongoing from first promise",
    module: "commitments",
  },
  {
    id: "closeout",
    order: 7,
    title: "Close-out, handover & assurance",
    intent:
      "Show what was done, what remains, and the evidence trail for client, board, or funder packs.",
    exitCriteria:
      "SEP status applied; report pack cites engagements and commitments; unresolved items have owners.",
    typicalDuration: "Final 2 weeks of the assignment / gate",
    module: "reports",
  },
];

function cls(
  partial: SepStakeholderClass,
): SepStakeholderClass {
  return partial;
}

function act(partial: SepActivity): SepActivity {
  return partial;
}

function sharedClasses(extra: SepStakeholderClass[]): SepStakeholderClass[] {
  return [
    cls({
      id: "affected-households",
      label: "Affected households / land users",
      kind: "community_group",
      influence: "high",
      purpose: "consult",
      why: "People who live with the impact decide whether social licence holds between visits.",
      module: "stakeholders",
    }),
    cls({
      id: "traditional-authority",
      label: "Traditional authority / customary structure",
      kind: "traditional_authority",
      influence: "high",
      purpose: "consult",
      why: "Where customary governance exists, skipping it is a legitimacy failure — not a shortcut.",
      module: "stakeholders",
    }),
    cls({
      id: "local-government",
      label: "Local government (ward / municipality)",
      kind: "government",
      influence: "high",
      purpose: "inform",
      why: "Ward committees and municipal desks are both counterparts and escalation paths.",
      module: "stakeholders",
    }),
    cls({
      id: "client-funder",
      label: "Client / funder / sponsor",
      kind: "funder",
      influence: "high",
      purpose: "inform",
      why: "The briefing owner must see cadence, risks, and what was promised in their name.",
      module: "projects",
    }),
    cls({
      id: "contractor",
      label: "Delivery contractor / operator",
      kind: "contractor",
      influence: "medium",
      purpose: "inform",
      why: "Site teams create or destroy trust daily; they need the same commitment log.",
      module: "stakeholders",
    }),
    cls({
      id: "civil-society",
      label: "Civil society / NGO / faith / labour",
      kind: "ngo",
      influence: "medium",
      purpose: "consult",
      why: "Organised voices often hold memory of previous projects. Map them before the first public meeting.",
      module: "stakeholders",
    }),
    ...extra,
  ];
}

function sharedActivities(extra: SepActivity[]): SepActivity[] {
  return [
    act({
      id: "kickoff",
      phaseId: "inception",
      title: "Client kick-off and purpose lock",
      method: "Briefing meeting",
      purpose: "decide",
      engagementKind: "briefing",
      ownerHint: "Plan Owner / facilitation lead",
      timingHint: "Week 0",
      evidenceHint: "Minutes (Capture minutes template)",
      module: "capture",
      captureTemplate: "minutes",
    }),
    act({
      id: "place-sketch",
      phaseId: "mapping",
      title: "Place and authority sketch",
      method: "Desk + local informant",
      purpose: "inform",
      engagementKind: "other",
      ownerHint: "CLO / social facilitator",
      timingHint: "Week 1",
      evidenceHint: "Geo fields on the project dossier",
      module: "geo",
    }),
    act({
      id: "courtesy",
      phaseId: "first_contact",
      title: "Courtesy introduction to local authority",
      method: "Letter + short meeting",
      purpose: "inform",
      engagementKind: "meeting",
      ownerHint: "Facilitation lead",
      timingHint: "Before any public notice",
      evidenceHint: "Attendance + letter on Capture",
      module: "engagements",
      captureTemplate: "attendance",
    }),
    act({
      id: "open-meeting",
      phaseId: "consultation",
      title: "First structured community meeting",
      method: "Consultation with commitment review",
      purpose: "consult",
      engagementKind: "consultation",
      ownerHint: "Facilitation lead + CLO",
      timingHint: "After courtesy contact",
      evidenceHint: "Minutes + attendance register",
      module: "capture",
      captureTemplate: "minutes",
    }),
    act({
      id: "walkabout",
      phaseId: "consultation",
      title: "Site walkabout with affected users",
      method: "Walkabout",
      purpose: "consult",
      engagementKind: "walkabout",
      ownerHint: "CLO + contractor",
      timingHint: "Once the footprint is known",
      evidenceHint: "Field note + photos in media library",
      module: "capture",
      captureTemplate: "field_note",
    }),
    act({
      id: "grievance-brief",
      phaseId: "commitments",
      title: "Brief the grievance path",
      method: "Scripted acknowledgment + desk path",
      purpose: "inform",
      engagementKind: "briefing",
      ownerHint: "Case owner",
      timingHint: "First public meeting and site induction",
      evidenceHint: "Issue intake live; one case ID rule",
      module: "incidents",
    }),
    ...extra,
  ];
}

function sharedCommitments(
  extra: SepDraftCommitment[],
): SepDraftCommitment[] {
  return [
    {
      id: "ack-48h",
      title: "Acknowledge every recorded concern within 48 hours",
      ownerHint: "Case owner / CLO",
      dueHint: "Standing SLA from first intake",
      why: "Silence after a meeting is how trust is lost even when the technical work is sound.",
    },
    {
      id: "commitment-review",
      title: "Open every subsequent meeting with the commitment log",
      ownerHint: "Facilitation lead",
      dueHint: "Each engagement",
      why: "New concerns without old promises is theatre.",
    },
    ...extra,
  ];
}

export const SEP_SECTOR_PLAYBOOKS: Record<SepSectorId, SepSectorPlaybook> = {
  infrastructure: {
    id: "infrastructure",
    summary:
      "Linear works (roads, bulk services, public buildings) where access, dust, labour intake, and temporary disruption dominate trust — not only the ribbon-cutting.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "road-users",
        label: "Transport / taxi / commuter groups",
        kind: "community_group",
        influence: "medium",
        purpose: "consult",
        why: "Diversions and stop/go are felt daily. Name the organised voices before the first closure.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "labour-desk",
        phaseId: "consultation",
        title: "Local labour and SMME briefing",
        method: "Targeted briefing",
        purpose: "inform",
        engagementKind: "briefing",
        ownerHint: "Contractor CLO + client",
        timingHint: "Before site establishment",
        evidenceHint: "Attendance + employment pack fields",
        module: "intelligence",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "access-notice",
        title: "Give 48-hour notice of closures that cut household access",
        ownerHint: "Contractor CLO",
        dueHint: "Each planned closure",
        why: "Unannounced access loss is a grievance factory.",
      },
    ]),
    instruments: [
      {
        id: "eia-ppp",
        label: "Environmental public participation (where listed)",
        note: "If the briefing cites EIA / BAR / S&EIR, treat I&AP rounds as engagements with minutes — not a separate unofficial notebook.",
      },
      {
        id: "epwp",
        label: "Local labour / preferential procurement",
        note: "Capture labour and procurement as project-impact intel, not only as a speech at the sod turning.",
      },
    ],
    grievancePath:
      "Site CLO → TrustLedger case (one ID) → contractor site agent → client social performance. Walk-in, WhatsApp, and the meeting floor all map to the same desk.",
    assumptions: [
      "This plan is a practice frame. Statutory timeframes in the briefing override typical durations.",
      "Not legal advice on NEMA, occupational health, or traffic management.",
    ],
  },
  housing: {
    id: "housing",
    summary:
      "Housing and human-settlements work where beneficiary lists, allocation fairness, and existing occupants are the trust core.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "beneficiaries",
        label: "Intended beneficiaries / waiting-list households",
        kind: "community_group",
        influence: "high",
        purpose: "consult",
        why: "Allocation rumours move faster than official lists. Named beneficiary reps reduce parallel politics.",
        module: "stakeholders",
      }),
      cls({
        id: "occupiers",
        label: "Current occupiers / backyard / informal residents",
        kind: "community_group",
        influence: "high",
        purpose: "consult",
        why: "People already on the land are not a footnote to a future housing product.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "list-transparency",
        phaseId: "consultation",
        title: "Allocation / list transparency session",
        method: "Facilitated consultation",
        purpose: "consult",
        engagementKind: "consultation",
        ownerHint: "Municipality housing + facilitator",
        timingHint: "Before site hand-over",
        evidenceHint: "Minutes; issues that are disputes go to Incidents",
        module: "incidents",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "list-channel",
        title: "Publish the official channel for list queries (not a private WhatsApp)",
        ownerHint: "Housing official / CLO",
        dueHint: "Before first public meeting",
        why: "Private lists destroy legitimacy.",
      },
    ]),
    instruments: [
      {
        id: "housing-code",
        label: "Human settlements allocation rules (as cited in the brief)",
        note: "Use the client’s stated policy. Do not invent a national housing code citation.",
      },
    ],
    grievancePath:
      "Allocation and construction complaints are cases, not ‘comments’. One ID, named owner, update cadence even when the list has not changed.",
    assumptions: [
      "Beneficiary data is personal information — treat Capture notes as field evidence, not a public roll.",
    ],
  },
  mining: {
    id: "mining",
    summary:
      "Extractives where Social & Labour Plan, host-community development, and cumulative impact sit beside the mine plan.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "host-community",
        label: "Host community structures",
        kind: "community_group",
        influence: "high",
        purpose: "consult",
        why: "Host-community forums often pre-exist this RFP. Map them; do not create a parallel committee.",
        module: "stakeholders",
      }),
      cls({
        id: "labour-union",
        label: "Organised labour",
        kind: "union",
        influence: "high",
        purpose: "consult",
        why: "Workforce and community grievances mix at the gate. Separate desks, shared facts.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "slp-review",
        phaseId: "consultation",
        title: "SLP / community development review session",
        method: "Structured consultation",
        purpose: "consult",
        engagementKind: "consultation",
        ownerHint: "Social performance lead",
        timingHint: "Per SLP / licence cadence in the brief",
        evidenceHint: "Minutes + commitment log",
        module: "commitments",
        captureTemplate: "minutes",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "slp-evidence",
        title: "Attach evidence to each community-development promise",
        ownerHint: "Social performance",
        dueHint: "Each SLP milestone in the brief",
        why: "Un-evidenced SLP lines are the first thing a later audit or protest will test.",
      },
    ]),
    instruments: [
      {
        id: "mprda",
        label: "Mining social performance instruments (as cited)",
        note: "If the brief names MPRDA, Mining Charter, or SLP, log those as instruments — do not add uncited statutes.",
      },
      {
        id: "ifc-ps",
        label: "Funder safeguard (IFC / Equator-style, if cited)",
        note: "Only claim the standard named in the RFP. Map PS1-style stakeholder engagement onto TrustLedger modules.",
      },
    ],
    grievancePath:
      "Community and contractor-community issues on the TrustLedger desk; workforce issues stay on the employer’s IR path but can be cross-referenced in the case if they spill into the host community.",
    assumptions: [
      "Resettlement / RAP, if in the brief, needs a dedicated workstream — this SEP seeds it, it does not replace a RAP.",
    ],
  },
  energy: {
    id: "energy",
    summary:
      "Generation, grid, or IPP-style projects where land, visual impact, benefit-sharing, and construction traffic drive engagement.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "landowners",
        label: "Landowners / occupiers on the servitude",
        kind: "individual",
        influence: "high",
        purpose: "consult",
        why: "Servitude and construction access are household negotiations, not only cadastral facts.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "benefit-share",
        phaseId: "consultation",
        title: "Local benefit / community trust briefing",
        method: "Briefing + Q&A",
        purpose: "inform",
        engagementKind: "briefing",
        ownerHint: "IPP community lead / client",
        timingHint: "Once the benefit vehicle in the brief is known",
        evidenceHint: "Minutes; promises → Commitments",
        module: "commitments",
        captureTemplate: "minutes",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "traffic-notice",
        title: "Notify communities of abnormal-load / construction traffic windows",
        ownerHint: "Contractor CLO",
        dueHint: "Before each campaign",
        why: "Unannounced convoys become grievances even when the EIA is approved.",
      },
    ]),
    instruments: [
      {
        id: "reipppp",
        label: "Procurement / bid community criteria (if cited)",
        note: "SED, ED, and local content lines in an IPP bid become commitments with owners — not appendix poetry.",
      },
    ],
    grievancePath:
      "Construction and operations complaints on one desk. Distinguish landowner commercial issues from community-wide impacts in the case category.",
    assumptions: [
      "Grid connection and generation may have different counterparts — split the registry if the brief has two footprints.",
    ],
  },
  water: {
    id: "water",
    summary:
      "Water and sanitation where service interruption, tariff fear, and source protection meet household dignity.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "water-users",
        label: "Water user groups / irrigation boards",
        kind: "community_group",
        influence: "high",
        purpose: "consult",
        why: "Abstraction and interruption are livelihood issues. Named user groups prevent ‘the community’ as a blur.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "outage-protocol",
        phaseId: "scoping",
        title: "Agree interruption / tanker protocol",
        method: "Working session",
        purpose: "decide",
        engagementKind: "meeting",
        ownerHint: "Utility + CLO",
        timingHint: "Before construction that cuts supply",
        evidenceHint: "Minutes; protocol stored on project dossier",
        module: "projects",
        captureTemplate: "minutes",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "outage-notice",
        title: "Notice of supply interruption with restoration target",
        ownerHint: "Utility operations / CLO",
        dueHint: "Each planned outage",
        why: "Water is not a ‘stakeholder issue’ after the tap is dry — it is a case.",
      },
    ]),
    instruments: [
      {
        id: "wula",
        label: "Water-use authorisation (if cited)",
        note: "Licence conditions that mention consultation belong on the engagement calendar.",
      },
    ],
    grievancePath:
      "Service failures are incidents with SLA. Participation comments that are not service failures stay on Engagements with a link if they escalate.",
    assumptions: [
      "Health-sensitive interruptions (clinics, schools) get a named informed list in first-contact.",
    ],
  },
  education: {
    id: "education",
    summary:
      "Schools and skills infrastructure where SGB, learners’ caregivers, and neighbouring households share the site.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "sgb",
        label: "School governing body / education district",
        kind: "government",
        influence: "high",
        purpose: "consult",
        why: "Construction on a school site without the SGB is a legitimacy failure.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "safeguarding",
        phaseId: "first_contact",
        title: "Site conduct and safeguarding briefing",
        method: "Briefing",
        purpose: "inform",
        engagementKind: "briefing",
        ownerHint: "Contractor + principal",
        timingHint: "Before site establishment",
        evidenceHint: "Attendance register",
        module: "capture",
        captureTemplate: "attendance",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "hours",
        title: "Keep noisy works outside exam / teaching windows agreed with the school",
        ownerHint: "Contractor",
        dueHint: "Standing for the construction period",
        why: "A school is not a vacant site.",
      },
    ]),
    instruments: [
      {
        id: "dbe",
        label: "Education department conditions (as cited)",
        note: "Use only instruments named in the briefing.",
      },
    ],
    grievancePath:
      "Safeguarding concerns escalate immediately — do not wait for the weekly CLO meeting. Ordinary construction noise/dust still gets a case ID.",
    assumptions: [
      "Minors are not registered as stakeholders. Caregivers and the SGB are the counterparts.",
    ],
  },
  health: {
    id: "health",
    summary:
      "Clinics and hospitals where access, infection control, and staff/community interface cannot pause for a ‘consultation week’.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "facility-board",
        label: "Clinic / hospital committee",
        kind: "community_group",
        influence: "high",
        purpose: "consult",
        why: "Facility committees already hold community trust. Work with them.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "access-plan",
        phaseId: "scoping",
        title: "Patient access plan during works",
        method: "Working session",
        purpose: "decide",
        engagementKind: "meeting",
        ownerHint: "Facility manager + contractor",
        timingHint: "Before hoarding goes up",
        evidenceHint: "Minutes on Capture",
        module: "capture",
        captureTemplate: "minutes",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "emergency-access",
        title: "Keep emergency access unobstructed; name a 24h site contact",
        ownerHint: "Contractor site agent",
        dueHint: "From site establishment",
        why: "A blocked ambulance bay is not a ‘comment’.",
      },
    ]),
    instruments: [
      {
        id: "doh",
        label: "Health facility rules (as cited)",
        note: "IPC and after-hours access belong in first-contact, not only OHS files.",
      },
    ],
    grievancePath:
      "Clinical complaints stay on the facility path. Construction and access complaints on TrustLedger, with the facility manager informed.",
    assumptions: [
      "No patient names in Capture notes.",
    ],
  },
  agriculture: {
    id: "agriculture",
    summary:
      "Irrigation, agri-parks, and land-linked livelihoods where seasonality and water rights set the calendar — not the consultant’s Gantt.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "farmers",
        label: "Smallholders / farmers’ associations",
        kind: "community_group",
        influence: "high",
        purpose: "consult",
        why: "Planting calendars beat workshop calendars. Map associations before announcing dates.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "season-calendar",
        phaseId: "scoping",
        title: "Agree engagement around the agricultural calendar",
        method: "Working session",
        purpose: "decide",
        engagementKind: "meeting",
        ownerHint: "Facilitator + association chair",
        timingHint: "Week 2",
        evidenceHint: "Minutes; activity dates adjusted",
        module: "engagements",
        captureTemplate: "minutes",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "no-peak-disruption",
        title: "Avoid peak harvest / planting disruption unless agreed",
        ownerHint: "Contractor / project manager",
        dueHint: "Season windows named in the plan",
        why: "A technically perfect trench in planting week is a social failure.",
      },
    ]),
    instruments: [
      {
        id: "water-rights",
        label: "Water / grazing rights (as cited)",
        note: "Do not invent communal property associations — only map those named or verified in inception.",
      },
    ],
    grievancePath:
      "Livelihood loss claims are cases with evidence. Ordinary meeting comments stay on Engagements until they become a promise or a case.",
    assumptions: [
      "Seasonal labour (including women and youth) may not sit on the farmers’ association — add a class if the brief mentions them.",
    ],
  },
  municipal: {
    id: "municipal",
    summary:
      "Municipal / LED programmes where IDP, ward committees, and existing public-participation calendars already exist.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "ward-committee",
        label: "Ward committee / PR councillor",
        kind: "government",
        influence: "high",
        purpose: "consult",
        why: "Do not invent a parallel participation structure. Use the ward that already meets.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "idp-align",
        phaseId: "inception",
        title: "Align with municipal public-participation / IDP calendar",
        method: "Desk + municipal liaison",
        purpose: "inform",
        engagementKind: "briefing",
        ownerHint: "Client / facilitator",
        timingHint: "Week 0–1",
        evidenceHint: "Project dossier notes",
        module: "projects",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "ward-feedback",
        title: "Return a one-page feedback note to the ward committee after each public round",
        ownerHint: "Facilitator",
        dueHint: "10 working days after each round",
        why: "Municipal counterparts are blamed when consultants disappear.",
      },
    ]),
    instruments: [
      {
        id: "msa",
        label: "Municipal public participation (as cited)",
        note: "If the brief cites MSA / IDP / ward committee, schedule around that calendar.",
      },
    ],
    grievancePath:
      "Service-delivery protests and project-specific issues both need a case ID. Distinguish municipal baseline complaints from this project’s footprint in the category.",
    assumptions: [
      "This SEP does not replace the municipality’s statutory public-participation process; it makes a durable trail beside it.",
    ],
  },
  conservation: {
    id: "conservation",
    summary:
      "Protected areas, heritage, and stewardship where access, living heritage, and neighbouring livelihoods overlap.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "heritage",
        label: "Heritage / living-culture counterparts",
        kind: "faith_based",
        influence: "high",
        purpose: "consult",
        why: "Grave sites, initiation schools, and sacred pools are not ‘sensitivities’ on a map — they have owners.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "heritage-walk",
        phaseId: "consultation",
        title: "Accompanied heritage / access walk",
        method: "Walkabout with knowledge holders",
        purpose: "consult",
        engagementKind: "walkabout",
        ownerHint: "Facilitator + knowledge holder",
        timingHint: "Before layout freeze",
        evidenceHint: "Field note (no sacred detail that counterparts forbid publishing)",
        module: "capture",
        captureTemplate: "field_note",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "no-publish",
        title: "Do not publish locational detail of sacred sites without counterpart consent",
        ownerHint: "Plan Owner",
        dueHint: "Standing",
        why: "A beautiful map can be a harm.",
      },
    ]),
    instruments: [
      {
        id: "sahra",
        label: "Heritage process (if cited)",
        note: "If SAHRA / provincial heritage is named, those meetings are engagements with minutes.",
      },
    ],
    grievancePath:
      "Access and livelihood complaints on the desk. Heritage disputes may need a parallel statutory path — still log the case so the project does not lose the thread.",
    assumptions: [
      "IKS is practice in the field, not a paper citation unless the brief supplies one.",
    ],
  },
  logistics: {
    id: "logistics",
    summary:
      "Ports, rail, and freight yards where labour, adjacent neighbourhoods, and 24-hour operations collide.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([
      cls({
        id: "neighbours",
        label: "Adjacent neighbourhood / ratepayers",
        kind: "community_group",
        influence: "high",
        purpose: "consult",
        why: "Night noise and truck staging are household issues. Map street committees, not only the chamber of commerce.",
        module: "stakeholders",
      }),
    ]),
    activities: sharedActivities([
      act({
        id: "ops-hours",
        phaseId: "scoping",
        title: "Agree construction vs operations hours with neighbours",
        method: "Working session",
        purpose: "decide",
        engagementKind: "meeting",
        ownerHint: "Operator + CLO",
        timingHint: "Before night works",
        evidenceHint: "Minutes; commitment on hours",
        module: "commitments",
        captureTemplate: "minutes",
      }),
    ]),
    commitments: sharedCommitments([
      {
        id: "hotline",
        title: "24-hour noise/traffic contact that creates a TrustLedger case",
        ownerHint: "Operator CLO",
        dueHint: "From first night work",
        why: "A voicemail box is not a grievance path.",
      },
    ]),
    instruments: [
      {
        id: "port-rules",
        label: "Port / rail operator rules (as cited)",
        note: "Security and landside access rules belong in first-contact for neighbours and labour brokers.",
      },
    ],
    grievancePath:
      "Neighbourhood amenity on TrustLedger. Workforce IR on the employer path. Overlap (e.g. contractor violence off-site) is a case with both informed.",
    assumptions: [
      "Customs / security zones may limit walkabouts — plan methods that still reach neighbours.",
    ],
  },
  generic: {
    id: "generic",
    summary:
      "Use when the briefing spans sectors or the sector is not yet clear. Same seven-phase spine; tighten after inception.",
    phases: PHASES,
    stakeholderClasses: sharedClasses([]),
    activities: sharedActivities([]),
    commitments: sharedCommitments([]),
    instruments: [
      {
        id: "brief-only",
        label: "Instruments named in the briefing only",
        note: "Do not add a statute the RFP did not name. Inception can add verified instruments later.",
      },
    ],
    grievancePath:
      "One intake, one case ID, named owner, update even when unresolved. Engagements hold the meeting memory; Commitments hold promises.",
    assumptions: [
      "Replace this generic pack with a sector pack once inception confirms the footprint.",
    ],
  },
};

export const SEP_SECTOR_IDS = Object.keys(
  SEP_SECTOR_PLAYBOOKS,
) as SepSectorId[];

/** Practice extracts — labeled examples, not a customer workspace seed. */
export const SEP_EXAMPLE_BRIEFS: Record<SepSectorId, string> = {
  infrastructure:
    "Request for Proposal\nProject: Regional road upgrade and stormwater\nClient: Example Public Works Department\nWard 7, Eastern Cape\nScope of work: consult affected households, taxi associations, and the Traditional Council before bulk earthworks. NEMA BAR public participation is cited. Local content under PPPFA. Terms of reference.",
  housing:
    "Request for Proposal\nProject: Ntabeni Housing and Bulk Services\nClient: Example Local Municipality\nWard 12, Eastern Cape\nThe assignment is to consult affected households and the Traditional Council on township establishment, beneficiary lists, and bulk water connections. Public participation under NEMA / BAR is required. Terms of reference.",
  mining:
    "Invitation to bid\nProject: Opencast pit expansion — social performance support\nClient: Example Mining Pty Ltd\nWard 4, Limpopo\nConsult host communities and the Traditional Council. Social and Labour Plan (MPRDA / SLP) commitments must be evidenced, not appendix claims. Grievance path required. Request for Proposal.",
  energy:
    "Request for Proposal\nProject: Solar PV plant grid connection\nClient: Example IPP Pty Ltd\nWard 9, Northern Cape\nI&AP rounds for environmental authorisation. Consult landowners, municipality, and traditional authority. REIPPPP local-content reporting. Terms of reference.",
  water:
    "Tender document\nProject: Bulk water and sanitation upgrade\nClient: Example District Municipality\nWard 3, KwaZulu-Natal\nWULA consultation conditions apply. Engage households on interruptions and the Traditional Council on access. Terms of reference.",
  education:
    "Briefing\nProject: Classroom block and sanitation\nClient: Example Provincial Education Department\nWard 2, Mpumalanga\nConsult the SGB, learners’ caregivers, and traditional authority before site establishment. Terms of reference.",
  health:
    "Request for Proposal\nProject: Clinic upgrade and access road\nClient: Example Department of Health\nWard 8, Free State\nConsult clinic committee, traditional authority, and municipality. Construction hours next to a maternity ward. Terms of reference.",
  agriculture:
    "Terms of reference\nProject: Irrigation scheme rehabilitation\nClient: Example Department of Agriculture\nWard 5, North West\nEngage the farmers’ association, grazing committees, and traditional authority. Water-use licence consultation as cited.",
  municipal:
    "Briefing\nAssignment: IDP / LED public participation support\nClient: Example Local Municipality\nWard committees 1–4, Gauteng\nConsult ward committees, informal traders, and traditional authority where it applies. MFMA-aligned minutes. Terms of reference.",
  conservation:
    "Request for Proposal\nProject: Protected-area stewardship expansion\nClient: Example conservation agency\nAdjacent to a heritage site, Western Cape\nWalkabouts with knowledge holders. SAHRA process if cited. Do not publish sacred-site coordinates. Terms of reference.",
  logistics:
    "Tender\nProject: Port truck staging and night works\nClient: Example port operator SOC\nAdjacent neighbourhood, KwaZulu-Natal\nAgree construction vs operations hours with neighbours and labour. 24-hour amenity contact must create a case. Terms of reference.",
  generic:
    "Scope of work\nProject: Community-trust programme (sector to confirm at inception)\nClient: Example implementing agent\nPlace: municipality and ward to be locked in week 0\nConsult affected people, traditional authority where it exists, and local government. One grievance path. Terms of reference.",
};
