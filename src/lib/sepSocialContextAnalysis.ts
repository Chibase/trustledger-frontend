/**
 * SEP Social Context Analysis Engine
 * Phase C: TrustLedger SRM — SEP Generation Specification v1.0
 * 
 * Transforms TenderIntelligence → SocialContextProfile by answering 7 critical questions.
 * Specification Section 7: Social Context & Impact Analysis
 * Specification Section 7.1: Social Risk & Impact Matrix
 */

import type {
  TenderIntelligence,
  ProjectProfile,
  SocialContextProfile,
  SocialRisk,
} from "@/types/sepAnalysis";

/**
 * Analyse affected people from tender context.
 * Question: Who may experience benefits, disruption, displacement, exclusion or livelihood effects?
 */
function analyseAffectedPeople(
  tender: TenderIntelligence,
  project: ProjectProfile
): SocialContextProfile["affectedPeople"] {
  const description: string[] = [];
  const dependencies: string[] = [];

  // Displacement context
  if (project.displacementType !== "none") {
    description.push(
      `Project involves ${project.displacementType} displacement of households/occupants.`
    );
    dependencies.push("access to land/housing");
    dependencies.push("livelihood restoration");
  }

  // Sector-specific affected populations
  switch (project.sector) {
    case "housing":
      description.push("Beneficiary households, current occupiers, informal residents.");
      dependencies.push("housing allocation fairness");
      dependencies.push("existing tenure security");
      break;

    case "water":
      description.push(
        "Water users, irrigation boards, households reliant on service, health facilities."
      );
      dependencies.push("water supply access");
      dependencies.push("tariff affordability");
      break;

    case "infrastructure":
      description.push(
        "Households and businesses along project footprint, commuters, transport users."
      );
      dependencies.push("access during construction");
      dependencies.push("property values");
      break;

    case "energy":
      description.push("Landowners on servitude, neighbours, host community.");
      dependencies.push("land access and compensation");
      dependencies.push("visual/noise impact");
      break;

    case "mining":
      description.push("Host community, affected households, informal occupants, workers.");
      dependencies.push("livelihoods");
      dependencies.push("social licence");
      break;

    case "health":
    case "education":
      description.push("Facility users, patients/learners, facility staff, neighbours.");
      dependencies.push("service access during works");
      dependencies.push("learning/health continuity");
      break;

    case "agriculture":
      description.push("Smallholders, farmers' associations, seasonal labourers.");
      dependencies.push("water rights");
      dependencies.push("planting/harvest cycles");
      break;

    case "municipal":
      description.push("Ward residents, informal traders, service users.");
      dependencies.push("municipal services");
      dependencies.push("public participation processes");
      break;

    default:
      description.push("Project-affected and beneficiary populations to be identified at inception.");
  }

  // Extract estimated numbers from tender
  const estimatedNumbers = extractEstimatedNumbers(tender);

  return {
    description: description.join(" "),
    estimatedNumbers,
    geographicLocation: tender.projectLocation,
    livelihoodDependencies: [...new Set(dependencies)],
  };
}

/**
 * Extract estimated numbers (households, people) from tender.
 */
function extractEstimatedNumbers(tender: TenderIntelligence): string | undefined {
  const text = [
    tender.tenderTitle,
    ...tender.scope.tasks,
    ...tender.requirements.map((r) => r.text),
  ]
    .join(" ")
    .toLowerCase();

  const numberMatch = text.match(/(\d+)\s*(?:–|-|to)?\s*(\d+)?\s*(?:households?|families|occupiers|beneficiaries|people|persons)/i);
  if (numberMatch) {
    if (numberMatch[2]) {
      return `${numberMatch[1]}–${numberMatch[2]} households`;
    }
    return `~${numberMatch[1]} households`;
  }

  return undefined;
}

/**
 * Analyse social systems & institutions from tender and sector.
 * Question: What formal and informal institutions influence the project?
 */
function analyseSocialSystems(
  tender: TenderIntelligence,
  project: ProjectProfile
): SocialContextProfile["socialSystems"] {
  const formal: Array<{ name: string; role: string; relevance: string }> = [];
  const informal: Array<{ name: string; role: string; relevance: string }> = [];

  // Formal institutions extracted from named stakeholders
  for (const stakeholder of tender.namedStakeholders) {
    if (stakeholder.kind === "government") {
      formal.push({
        name: stakeholder.name,
        role: "Statutory authority",
        relevance: "Regulatory authority and service provider",
      });
    } else if (stakeholder.kind === "funder") {
      formal.push({
        name: stakeholder.name,
        role: "Funder",
        relevance: "Sets social performance standards and approval gates",
      });
    }
  }

  // Sector-specific formal institutions
  switch (project.sector) {
    case "water":
      formal.push({
        name: "Water supply utility",
        role: "Service provider",
        relevance: "Tariff and service standards",
      });
      formal.push({
        name: "Water regulator (if applicable)",
        role: "Oversight",
        relevance: "Service standards and dispute resolution",
      });
      break;

    case "housing":
      formal.push({
        name: "Housing department/municipality",
        role: "Beneficiary allocation authority",
        relevance: "List management and allocation fairness",
      });
      break;

    case "health":
    case "education":
      formal.push({
        name: "Facility management committee",
        role: "Service governance",
        relevance: "Service continuity during works",
      });
      break;

    case "mining":
      formal.push({
        name: "Mining regulator",
        role: "Compliance authority",
        relevance: "Social performance certification",
      });
      break;
  }

  // Informal institutions (inferred from sector)
  switch (project.sector) {
    case "agriculture":
    case "mining":
    case "energy":
    case "conservation":
      informal.push({
        name: "Traditional authority / customary structure",
        role: "Legitimacy gatekeeper",
        relevance: "Social licence; land/resource governance",
      });
      break;

    case "housing":
    case "infrastructure":
      informal.push({
        name: "Community leadership",
        role: "Community representation",
        relevance: "Legitimacy and benefit-sharing discussions",
      });
      break;
  }

  // Named informal groups from tender
  for (const stakeholder of tender.namedStakeholders) {
    if (stakeholder.kind === "community" || stakeholder.kind === "ngo") {
      informal.push({
        name: stakeholder.name,
        role: "Community voice",
        relevance: "Asset mapping and problem identification",
      });
    }
  }

  return { formal, informal };
}

/**
 * Analyse governance structures that matter to the project.
 * Question: Which municipal, traditional, community or institutional structures matter?
 */
function analyseGovernanceStructures(
  tender: TenderIntelligence,
  project: ProjectProfile
): SocialContextProfile["governanceStructures"] {
  const structures: SocialContextProfile["governanceStructures"] = [];

  // Extract from named stakeholders
  for (const stakeholder of tender.namedStakeholders) {
    if (stakeholder.kind === "government") {
      if (stakeholder.name.toLowerCase().includes("ward")) {
        structures.push({
          name: stakeholder.name,
          type: "ward_committee",
          relevance: "Local decision-making and representation",
          relationship: "authority",
        });
      } else if (stakeholder.name.toLowerCase().includes("municipal")) {
        structures.push({
          name: stakeholder.name,
          type: "municipal",
          relevance: "Service delivery and spatial planning",
          relationship: "authority",
        });
      }
    }
  }

  // Infer from sector and project location
  if (project.sector !== "generic" && !structures.some((s) => s.type === "traditional_authority")) {
    // Most sectors in South Africa require traditional authority engagement
    if (["mining", "agriculture", "conservation", "energy"].includes(project.sector)) {
      structures.push({
        name: "Traditional Authority / Customary Leadership",
        type: "traditional_authority",
        relevance: "Land governance, social licence, cultural protocol",
        relationship: "legitimacy_gatekeeper",
      });
    }
  }

  // Community structures
  if (["housing", "municipal", "infrastructure"].includes(project.sector)) {
    structures.push({
      name: "Community structures / civics / resident associations",
      type: "community_based",
      relevance: "Benefit distribution, grievance escalation",
      relationship: "mediator",
    });
  }

  return structures;
}

/**
 * Analyse livelihood impacts.
 * Question: Could access, employment, trading, land or services be affected?
 */
function analyseLivelihoodImpacts(
  tender: TenderIntelligence,
  project: ProjectProfile
): SocialContextProfile["livelihoodImpacts"] {
  const sectors: string[] = [];
  const potentialEffects: string[] = [];
  let seasonalityNote: string | undefined;

  // Sector-specific livelihood analysis
  switch (project.sector) {
    case "water":
      sectors.push("agriculture", "domestic water use", "small business (water-dependent)");
      potentialEffects.push("water access loss during works");
      potentialEffects.push("tariff changes");
      potentialEffects.push("service interruption");
      seasonalityNote = "Agricultural calendar: planting/harvest windows critical for livelihood";
      break;

    case "agriculture":
      sectors.push("smallholder farming", "seasonal labour", "grazing");
      potentialEffects.push("access to irrigation schemes");
      potentialEffects.push("planting/harvest disruption");
      potentialEffects.push("water rights changes");
      seasonalityNote =
        "Project must align with agricultural calendar; peak seasons may not tolerate disruption";
      break;

    case "housing":
      sectors.push("informal trading", "rental income", "access to opportunity areas");
      potentialEffects.push("income loss during relocation");
      potentialEffects.push("livelihood restoration needed");
      potentialEffects.push("allocation fairness impacts sentiment");
      break;

    case "infrastructure":
      sectors.push("retail/commerce on route", "commuter transport", "informal sector");
      potentialEffects.push("access loss during construction");
      potentialEffects.push("property values");
      potentialEffects.push("business disruption");
      seasonalityNote = "Peak trading seasons may worsen impact";
      break;

    case "mining":
    case "energy":
      sectors.push("land-based livelihoods", "informal settlement", "casual labour");
      potentialEffects.push("displacement");
      potentialEffects.push("employment/training access");
      potentialEffects.push("host community benefit-sharing");
      break;

    case "health":
    case "education":
      sectors.push("health workers", "learners", "facility-dependent businesses");
      potentialEffects.push("service continuity");
      potentialEffects.push("learning disruption");
      potentialEffects.push("staff retention");
      break;

    case "municipal":
      sectors.push("informal traders", "service users", "small business");
      potentialEffects.push("market/facility access");
      potentialEffects.push("service quality");
      break;
  }

  // Check tender for employment/procurement requirements
  if (
    tender.requirements.some((r) =>
      /local.*content|preferential.*procurement|local.*labour|employment/i.test(r.text)
    )
  ) {
    potentialEffects.push("employment and skills development opportunity");
    sectors.push("construction/local employment");
  }

  return {
    sectors: [...new Set(sectors)],
    potentialEffects: [...new Set(potentialEffects)],
    seasonalityNote,
  };
}

/**
 * Analyse vulnerability.
 * Question: Which groups may face disproportionate impacts or participation barriers?
 */
function analyseVulnerability(
  tender: TenderIntelligence,
  project: ProjectProfile
): SocialContextProfile["vulnerabilities"] {
  const vulnerabilities: SocialContextProfile["vulnerabilities"] = [];

  // Universal vulnerability groups
  const universalGroups = [
    {
      group: "Elderly and disabled persons",
      vulnerability: "Physical mobility and access barriers",
      disproportionateRisk: "Cannot participate in physical meetings; transport-dependent",
      participationBarriers: ["mobility", "transport", "physical access", "hearing/sight barriers"],
    },
    {
      group: "Women (especially female-headed households)",
      vulnerability: "Time poverty, childcare, decision-making exclusion",
      disproportionateRisk:
        "Livelihood disruption hits household food security; skipped in community decisions",
      participationBarriers: ["childcare responsibilities", "timing (work/care overlap)", "safety"],
    },
    {
      group: "Youth",
      vulnerability: "Labour market precarity, information access",
      disproportionateRisk: "Employment opportunity claims not transparent; skills training access unclear",
      participationBarriers: ["language/literacy", "internet access", "time availability"],
    },
    {
      group: "Informal occupants / informal traders",
      vulnerability: "Tenure insecurity, income dependence",
      disproportionateRisk: "Displacement without compensation; no official notice path",
      participationBarriers: [
        "official process unfamiliarity",
        "language",
        "distrust of authorities",
      ],
    },
  ];

  vulnerabilities.push(...universalGroups);

  // Sector-specific vulnerability
  if (project.displacementType === "physical") {
    vulnerabilities.push({
      group: "Project-affected households (PAPs) without secure tenure",
      vulnerability: "Tenure insecurity, compensation vulnerability",
      disproportionateRisk:
        "May receive lower compensation or be overlooked in benefit schemes; no recourse",
      participationBarriers: [
        "distrust from past land loss",
        "legal documentation barriers",
        "language",
      ],
    });
  }

  if (["mining", "agriculture", "energy"].includes(project.sector)) {
    vulnerabilities.push({
      group: "Smallholders and subsistence users",
      vulnerability: "Low bargaining power, limited alternative livelihoods",
      disproportionateRisk: "Benefit-sharing agreements favour larger players; livelihood loss uncompensated",
      participationBarriers: ["time (harvest seasons)", "language/literacy", "isolation"],
    });
  }

  if (project.sector === "housing") {
    vulnerabilities.push({
      group: "Backyard dwellers and informal residents",
      vulnerability: "Precarious housing; not on official beneficiary lists",
      disproportionateRisk:
        "Excluded from allocation or relocation support; forced to relocate with no compensation",
      participationBarriers: ["official process exclusion", "distrust", "language"],
    });
  }

  return vulnerabilities;
}

/**
 * Analyse trust/history and past grievances.
 * Question: Are previous projects, promises, grievances or distrust indicated?
 */
function analyseTrustAndHistory(
  tender: TenderIntelligence,
  project: ProjectProfile
): SocialContextProfile["trustAndHistory"] {
  const trustLevel: "high" | "medium" | "low" | "unknown" = "unknown";
  const previousProjects: string[] = [];
  const unfulfilledPromises: string[] = [];
  const grievancesOrDisputes: string[] = [];
  const conflictIndicators: string[] = [];

  // Scan tender for trust indicators
  const tenderText = [
    tender.tenderTitle,
    ...tender.scope.tasks,
    ...tender.requirements.map((r) => r.text),
  ]
    .join(" ")
    .toLowerCase();

  if (
    /previous|prior|past|history|legacy|promise|commitment|grievance|dispute|complaint|conflict|distrust|tension/i.test(
      tenderText
    )
  ) {
    // Tender hints at complex history
    if (/promise|commitment|outstanding|unresolved|unfulfilled/i.test(tenderText)) {
      unfulfilledPromises.push("Tender mentions outstanding commitments or past promises");
      conflictIndicators.push("Prior commitments may overshadow new engagement");
    }

    if (/grievance|dispute|conflict|tension|distrust/i.test(tenderText)) {
      grievancesOrDisputes.push("Tender indicates prior grievances or disputes");
      conflictIndicators.push("Community may be wary; verification of promises needed");
    }
  }

  // Sector-specific trust patterns
  switch (project.sector) {
    case "mining":
    case "energy":
      conflictIndicators.push("Extractive sectors historically face social licence risk");
      conflictIndicators.push("Host community expectations around benefit-sharing often unmet");
      break;

    case "housing":
      conflictIndicators.push("Allocation disputes common if process lacks transparency");
      conflictIndicators.push("Previous informal settlements often experience distrust of officials");
      break;

    case "water":
      conflictIndicators.push("Water access disputes and tariff resistance common");
      break;
  }

  return {
    previousProjects:
      previousProjects.length > 0 ? previousProjects.join("; ") : undefined,
    unfulfilledPromises: unfulfilledPromises.length > 0 ? unfulfilledPromises : undefined,
    grievancesOrDisputes:
      grievancesOrDisputes.length > 0 ? grievancesOrDisputes : undefined,
    conflictIndicators,
    trustLevel,
  };
}

/**
 * Analyse opportunities.
 * Question: What opportunities exist for participation, local employment, enterprise, or capacity building?
 */
function analyseOpportunities(
  tender: TenderIntelligence,
  project: ProjectProfile
): SocialContextProfile["opportunities"] {
  const opportunities: SocialContextProfile["opportunities"] = [];

  // Check for explicit opportunity mentions in tender
  const opportunityKeywords = [
    "local.*content",
    "preferential.*procurement",
    "local.*labour",
    "employment",
    "skills.*development",
    "smme",
    "capacity.*building",
    "enterprise",
    "benefit.*sharing",
  ];

  const tenderText = tender.requirements.map((r) => r.text).join(" ");

  for (const keyword of opportunityKeywords) {
    if (new RegExp(keyword, "i").test(tenderText)) {
      const requirement = tender.requirements.find((r) =>
        new RegExp(keyword, "i").test(r.text)
      );
      if (requirement) {
        opportunities.push({
          description: requirement.text,
          stakeholdersWhoWinIf: ["Local contractors", "Community members", "SMMEs"],
          requiredConditions: [
            "Clear eligibility criteria",
            "Transparent procurement process",
            "Skills matching",
          ],
        });
      }
    }
  }

  // Sector-specific opportunities
  switch (project.sector) {
    case "infrastructure":
      opportunities.push({
        description: "Local labour and SMME participation in construction",
        stakeholdersWhoWinIf: [
          "Unemployed community members",
          "Local contractors",
          "Service providers",
        ],
        requiredConditions: ["Skills training if needed", "Fair wages", "Safety standards"],
      });
      break;

    case "water":
    case "agriculture":
      opportunities.push({
        description: "Water management and livelihood skills training",
        stakeholdersWhoWinIf: ["Smallholders", "Water users", "Youth"],
        requiredConditions: ["Practical training focus", "Links to markets/cooperatives"],
      });
      break;

    case "housing":
      opportunities.push({
        description: "Community-led allocation transparency and grievance process",
        stakeholdersWhoWinIf: ["Beneficiary representatives", "Community leaders"],
        requiredConditions: [
          "Beneficiary representatives in allocation",
          "Public list posting",
          "Accessible appeals",
        ],
      });
      break;

    case "mining":
    case "energy":
      opportunities.push({
        description: "Host community development plan co-design",
        stakeholdersWhoWinIf: ["Host community", "Local government"],
        requiredConditions: [
          "Community-led priority setting",
          "Accountability for delivery",
          "Monitoring involvement",
        ],
      });
      break;
  }

  return opportunities;
}

/**
 * Main function: Analyse social context from tender and project profile.
 */
export function analyseSocialContext(
  tender: TenderIntelligence,
  project: ProjectProfile
): SocialContextProfile {
  return {
    id: `SOCIALCTX-${Date.now().toString(36).toUpperCase()}`,
    projectProfileId: project.id,

    affectedPeople: analyseAffectedPeople(tender, project),
    socialSystems: analyseSocialSystems(tender, project),
    governanceStructures: analyseGovernanceStructures(tender, project),
    livelihoodImpacts: analyseLivelihoodImpacts(tender, project),
    vulnerabilities: analyseVulnerability(tender, project),
    trustAndHistory: analyseTrustAndHistory(tender, project),
    opportunities: analyseOpportunities(tender, project),

    analysisDate: new Date().toISOString(),
    analysisSource: "tender_only",
    confidenceLevel: "medium", // Tender analysis only; field verification needed
    notesAndAssumptions:
      "This analysis is based on tender document review only. Field-based participatory analysis will refine and validate these assessments.",
  };
}

/**
 * Generate social risk matrix from social context.
 * Specification Section 7.1: Social Risk & Impact Matrix
 */
export function generateSocialRisks(
  socialContext: SocialContextProfile,
  project: ProjectProfile
): SocialRisk[] {
  const risks: SocialRisk[] = [];

  // Risk 1: Displacement without adequate livelihood restoration
  if (project.displacementType !== "none") {
    risks.push({
      id: `RISK-DISP-${Date.now()}`,
      projectProfileId: project.id,
      issue: "Displacement without livelihood restoration",
      cause: `${project.displacementType} displacement from project footprint`,
      description:
        "Project-affected households lose livelihood assets or access without alternative income sources",
      affectedStakeholders: ["Project-affected households", "Informal occupants"],
      geographicArea: socialContext.affectedPeople.geographicLocation,
      likelihood: "high",
      severity: "critical",
      riskRating: "critical",
      earlyWarningTrigger:
        "Unresolved household complaints about income loss; absence of livelihood plan",
      monitoringIndicator:
        "Percentage of PAPs with confirmed livelihood restoration pathway",
      mitigation: "Co-design livelihood restoration plan with affected communities",
      participationResponse:
        "Affected communities lead identification of alternative livelihood options",
      owner: "Plan Owner / Social Performance Lead",
      evidence: "Signed livelihood agreements; income verification 12 months post-displacement",
      status: "identified",
      identifiedAt: new Date().toISOString(),
      source: "social_context_analysis",
      confidenceLevel: "high",
    });
  }

  // Risk 2: Allocation/benefit-sharing disputes
  if (project.sector === "housing" || project.sector === "mining" || project.sector === "energy") {
    risks.push({
      id: `RISK-ALLOC-${Date.now()}`,
      projectProfileId: project.id,
      issue: "Allocation disputes over benefits or resources",
      cause:
        "Lack of transparent, community-validated allocation process; unmet expectations",
      description:
        "Community members dispute fairness of beneficiary selection, compensation, or benefit distribution",
      affectedStakeholders: [
        "Beneficiary/PAP communities",
        "Excluded groups",
        "Local government",
      ],
      geographicArea: socialContext.affectedPeople.geographicLocation,
      likelihood: "high",
      severity: "high",
      riskRating: "high",
      earlyWarningTrigger:
        "Rumours of 'deals' or favouritism; parallel beneficiary lists; community leader complaints",
      monitoringIndicator: "Number of allocation disputes escalated to grievance desk",
      mitigation:
        "Public beneficiary list posting; community-led validation; accessible appeals process",
      participationResponse:
        "Beneficiary communities chair allocation committee; regular public reporting",
      owner: "Allocation Committee Chair / CLO",
      evidence: "Signed beneficiary list; meeting minutes; appeal resolutions",
      status: "identified",
      identifiedAt: new Date().toISOString(),
      source: "social_context_analysis",
      confidenceLevel: "high",
    });
  }

  // Risk 3: Inadequate participation of vulnerable groups
  if (socialContext.vulnerabilities.length > 0) {
    risks.push({
      id: `RISK-VULN-${Date.now()}`,
      projectProfileId: project.id,
      issue: "Vulnerable groups excluded from participation",
      cause:
        "Participation design does not account for access barriers (mobility, language, childcare, time)",
      description:
        "Women, disabled persons, elderly, informal occupants not reached by standard meetings",
      affectedStakeholders: socialContext.vulnerabilities
        .map((v) => v.group)
        .slice(0, 3),
      geographicArea: socialContext.affectedPeople.geographicLocation,
      likelihood: "high",
      severity: "high",
      riskRating: "high",
      earlyWarningTrigger:
        "Meeting attendance skewed towards men/elite; complaints from vulnerable groups",
      monitoringIndicator:
        "Percentage of vulnerable group members reached with tailored engagement",
      mitigation: "Alternative engagement methods: home visits, focus groups, accessible timing",
      participationResponse:
        "Vulnerable groups help design engagement approach; peer-to-peer mobilisation",
      owner: "Facilitation Lead / CLO",
      evidence: "Disaggregated attendance records; feedback from vulnerable groups",
      status: "identified",
      identifiedAt: new Date().toISOString(),
      source: "social_context_analysis",
      confidenceLevel: "medium",
    });
  }

  // Risk 4: Unmet expectations from prior grievances
  if (
    socialContext.trustAndHistory.grievancesOrDisputes &&
    socialContext.trustAndHistory.grievancesOrDisputes.length > 0
  ) {
    risks.push({
      id: `RISK-TRUST-${Date.now()}`,
      projectProfileId: project.id,
      issue: "Distrust from unresolved past grievances",
      cause:
        "Prior projects broke promises; communities perceive new engagement as repetition",
      description:
        "Community skepticism and low participation due to history of unmet commitments",
      affectedStakeholders: [
        "Affected communities",
        "Community leaders",
        "Local government",
      ],
      geographicArea: socialContext.affectedPeople.geographicLocation,
      likelihood: "medium",
      severity: "high",
      riskRating: "high",
      earlyWarningTrigger:
        "Community leader statements of distrust; low meeting attendance; dismissive sentiment",
      monitoringIndicator:
        "Community sentiment tracking (trust index); meeting attendance trends",
      mitigation:
        "Early transparency: acknowledge past failures; front-load commitment verification mechanism",
      participationResponse:
        "Community selects commitment monitoring committee; regular public reporting",
      owner: "Plan Owner / Facilitation Lead",
      evidence: "Trust baseline survey; sentiment tracking; commitment register",
      status: "identified",
      identifiedAt: new Date().toISOString(),
      source: "social_context_analysis",
      confidenceLevel: "medium",
    });
  }

  // Risk 5: Livelihood disruption during construction/implementation
  if (socialContext.livelihoodImpacts.potentialEffects.length > 0) {
    risks.push({
      id: `RISK-LIVE-${Date.now()}`,
      projectProfileId: project.id,
      issue: "Livelihood disruption during project implementation",
      cause: `Project activities (${socialContext.livelihoodImpacts.sectors.join(", ")}) disrupt income sources`,
      description:
        "Access loss, business disruption, or income dependency interrupted during construction/implementation",
      affectedStakeholders: ["Informal traders", "Transport operators", "Water users", "Farmers"],
      geographicArea: socialContext.affectedPeople.geographicLocation,
      likelihood: "medium",
      severity: "high",
      riskRating: "high",
      earlyWarningTrigger:
        "Complaints about loss of income; business closures; informal sector abandonment of area",
      monitoringIndicator: "Number of livelihood disruption complaints; income tracking",
      mitigation:
        "Advance notice of disruption; alternative access routes; temporary income support if applicable",
      participationResponse:
        "Affected traders help design disruption schedules; monitor implementation adherence",
      owner: "Contractor CLO / Project Manager",
      evidence: "Disruption schedule; notice distribution records; income verification",
      status: "identified",
      identifiedAt: new Date().toISOString(),
      source: "social_context_analysis",
      confidenceLevel: "medium",
    });
  }

  return risks;
}

const SECTOR_KEYWORDS: Array<{
  sector: ProjectProfile["sector"];
  re: RegExp;
}> = [
  { sector: "water", re: /\b(water|sanitation|wula|wastewater|reservoir|bulk water)\b/i },
  { sector: "housing", re: /\b(housing|human settlement|relocation|resettlement|rap|migration plan)\b/i },
  { sector: "mining", re: /\b(mining|mine|mprda|slp|extractive)\b/i },
  { sector: "energy", re: /\b(energy|solar|wind|ipp|substation|generation)\b/i },
  { sector: "infrastructure", re: /\b(road|highway|bridge|infrastructure|civil works)\b/i },
  { sector: "agriculture", re: /\b(agriculture|irrigation|smallholder|farming)\b/i },
  { sector: "health", re: /\b(health|clinic|hospital|phc)\b/i },
  { sector: "education", re: /\b(education|school|learner)\b/i },
  { sector: "municipal", re: /\b(municipal|idp|ward committee|mfma)\b/i },
  { sector: "conservation", re: /\b(conservation|heritage|protected area|biodiversity)\b/i },
];

/**
 * Classify a ProjectProfile from tender facts (Specification Section 6).
 * Does not invent counts, sites, or approvals.
 */
export function buildProjectProfileFromTender(
  tender: TenderIntelligence
): ProjectProfile {
  const blob = [
    tender.projectSector,
    tender.tenderTitle,
    tender.projectName,
    ...tender.requirements.map((r) => r.text),
    ...tender.scope.tasks,
  ].join(" ");

  const sectorMatch = SECTOR_KEYWORDS.find((row) => row.re.test(blob));
  const sector = sectorMatch?.sector || mapSectorString(tender.projectSector);

  const hasPhysical =
    /relocation|resettlement|displac|affected household|physical move/i.test(blob);
  const hasEconomic =
    /economic displacement|livelihood|income loss|access loss/i.test(blob);
  const displacementType: ProjectProfile["displacementType"] = hasPhysical && hasEconomic
    ? "mixed"
    : hasPhysical
      ? "physical"
      : hasEconomic
        ? "economic"
        : "none";

  const duration = tender.contractPeriod.durationMonths;
  const implementationHorizon: ProjectProfile["implementationHorizon"] =
    !duration ? "medium_term" : duration <= 9 ? "short_term" : duration <= 24 ? "medium_term" : "long_term";

  const socialImpactProfile: ProjectProfile["socialImpactProfile"] =
    displacementType === "physical" || displacementType === "mixed"
      ? "critical"
      : displacementType === "economic"
        ? "high"
        : "moderate";

  return {
    id: `PROJ-${tender.id.replace(/^TENDER-/, "")}`,
    tenderIntelligenceId: tender.id,
    sector,
    socialImpactProfile,
    socialImpactRationale:
      displacementType === "none"
        ? "No physical or economic displacement is stated in the tender; impact intensity remains to be confirmed in the field."
        : `Tender indicates ${displacementType} displacement. Participation and livelihood restoration are therefore material to assignment design.`,
    displacementType,
    displacementDescription:
      displacementType === "none"
        ? undefined
        : "As stated in the tender; household counts and sites remain TBC pending participatory census.",
    stakeholderComplexity:
      tender.namedStakeholders.length >= 4 ? "high" : "medium",
    complexityFactors: [
      ...(displacementType !== "none" ? ["displacement / relocation"] : []),
      ...(tender.namedStakeholders.some((s) => /traditional|authority/i.test(s.name))
        ? ["customary / traditional authority"]
        : []),
      ...(tender.namedStakeholders.some((s) => /municipal/i.test(s.name))
        ? ["municipal authority"]
        : []),
    ],
    conflictSensitivity: /grievance|dispute|conflict|distrust/i.test(blob) ? "medium" : "low",
    conflictIndicators: /grievance|dispute/i.test(blob)
      ? ["Tender requires a grievance pathway — prior or anticipated social tension cannot be ruled out"]
      : [],
    vulnerabilityIntensity: "high",
    vulnerableGroups: ["elderly", "disabled persons", "female-headed households", "informal occupants"],
    participationIntensity:
      displacementType !== "none" ? "collaborate" : "consult",
    researchIntensity:
      /census|participatory|research|baseline/i.test(blob)
        ? "participatory_research"
        : "diagnostic",
    implementationHorizon,
    classificationNotes:
      "Classification is a professional inference from tender text only. Field confirmation is required.",
    classifiedAt: new Date().toISOString(),
    classifiedBy: "SEP classification engine",
  };
}

function mapSectorString(value: string): ProjectProfile["sector"] {
  const lower = value.toLowerCase();
  if (lower.includes("water")) return "water";
  if (lower.includes("hous")) return "housing";
  if (lower.includes("min")) return "mining";
  if (lower.includes("energy")) return "energy";
  if (lower.includes("agric")) return "agriculture";
  if (lower.includes("health")) return "health";
  if (lower.includes("educ")) return "education";
  if (lower.includes("municipal")) return "municipal";
  if (lower.includes("infra") || lower.includes("transport")) return "infrastructure";
  if (lower.includes("conserv")) return "conservation";
  return "generic";
}
