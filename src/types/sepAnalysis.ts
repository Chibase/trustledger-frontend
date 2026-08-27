/**
 * SEP Analysis Data Model
 * Phase A: Internal objects for structured tender analysis and SEP generation
 * 
 * Specification: TrustLedger SRM — SEP Generation Specification v1.0, Section 21
 * 
 * This model defines the analytical objects that bridge tender requirements
 * to SEP output. Each object maintains provenance (fact/inference/proposal)
 * and supports automated quality assurance and compliance mapping.
 */

/**
 * Evidence provenance — distinguishes information types.
 * See Specification Section 17: Evidence & Traceability Architecture.
 */
export type EvidenceStatus =
  | "tender_fact"        // Explicitly stated in tender document
  | "client_supplied"    // Client-provided confirmation
  | "regulatory_reference" // Cited statute/standard (source verification may be needed)
  | "professional_inference" // Deduced from context (not directly stated)
  | "proposed_methodology" // Recommended approach
  | "field_confirmed"    // Validated through fieldwork
  | "to_be_confirmed";   // Awaiting client/field clarification

/**
 * TenderIntelligence — structured extraction from uploaded tender/RFP/brief.
 * Specification Section 5: Tender Requirements Extraction.
 */
export type TenderIntelligence = {
  id: string;
  
  // Document identity
  tenderNumber: string;
  tenderTitle: string;
  procuringEntity: string;        // The organisation issuing the tender
  issuingEntity?: string;          // May differ from procuring entity
  sourceUrl?: string;              // Link to tender if digital
  
  // Project identity
  projectName: string;
  projectSector: string;           // Will map to SepSectorId
  projectLocation: string;
  projectPhase?: string;           // e.g., "design", "feasibility", "implementation"
  
  // Scope & deliverables
  scope: {
    tasks: string[];               // Extracted tasks
    geographicCoverage: string[];   // Areas, wards, provinces
    stakeholderCoverage: string[];  // Named groups to engage
    activities: string[];           // Deliverable activities
    reports?: string[];             // Required outputs
  };
  
  // Duration & timeline
  contractPeriod: {
    startDate?: string;             // ISO date or TBC
    endDate?: string;
    durationMonths?: number;
    milestones?: Array<{
      name: string;
      targetDate?: string;
      description?: string;
    }>;
  };
  
  // Stakeholders mentioned in tender
  namedStakeholders: Array<{
    name: string;
    kind: "government" | "community" | "contractor" | "funder" | "ngo" | "other";
    description?: string;
    sourceQuote?: string;           // Direct tender quote
  }>;
  
  // Requirements extracted from tender
  requirements: Array<{
    id: string;
    category: "participation" | "consultation" | "local_content" | "livelihood" | 
              "resettlement" | "vulnerability" | "reporting" | "evaluation" | "other";
    text: string;
    sourceReference: string;        // Tender page or section
    mandatory: boolean;
    evaluationCriteria?: string;    // If part of bid scoring
  }>;
  
  // Regulatory references explicitly cited
  regulatoryReferences: Array<{
    instrument: string;             // e.g., "NEMA", "IFC PS1", "MPRDA"
    sourceQuote?: string;
    implication?: string;           // What it requires
  }>;
  
  // Reporting & evaluation specifics from tender
  reportingRequirements: {
    frequency?: string;             // e.g., "monthly", "quarterly"
    formats?: string[];             // e.g., "written report", "meeting minutes"
    recipients?: string[];          // Named recipients
    evaluationCriteria?: string[];  // Technical scoring elements
  };
  
  // Evidence requirements
  evidenceRequirements: string[];   // e.g., "photographs", "GIS maps", "signed minutes"
  
  // Metadata
  confidentialMarking?: string;     // e.g., "Confidential", "Internal only"
  extractedAt: string;              // ISO timestamp when extracted
  extractionNotes?: string;         // Extraction tool notes/confidence
  extractionSource: "manual" | "gemini" | "hybrid"; // How extracted
};

/**
 * ProjectProfile — sector and complexity classification.
 * Specification Section 6: Project Classification Engine.
 */
export type ProjectProfile = {
  id: string;
  tenderIntelligenceId: string;
  
  // Sector classification
  sector: "housing" | "infrastructure" | "transport" | "water" | "energy" | 
          "mining" | "education" | "health" | "municipal" | "research" | 
          "environmental" | "generic";
  
  // Social impact profile
  socialImpactProfile: "low" | "moderate" | "high" | "critical";
  socialImpactRationale: string;
  
  // Displacement type
  displacementType: "none" | "physical" | "economic" | "access_based" | "mixed";
  displacementDescription?: string;
  
  // Stakeholder complexity
  stakeholderComplexity: "low" | "medium" | "high" | "multi_level";
  complexityFactors: string[]; // e.g., "multiple authorities", "informal occupants"
  
  // Conflict sensitivity
  conflictSensitivity: "low" | "medium" | "high";
  conflictIndicators: string[]; // e.g., "previous disputed allocation", "resource competition"
  
  // Vulnerability intensity
  vulnerabilityIntensity: "low" | "medium" | "high";
  vulnerableGroups: string[]; // e.g., "elderly", "disabled", "female-headed households"
  
  // Participation intensity (minimum required)
  participationIntensity: "inform" | "consult" | "involve" | "collaborate" | "empower";
  
  // Research intensity
  researchIntensity: "none" | "diagnostic" | "participatory_research" | "longitudinal";
  
  // Implementation horizon
  implementationHorizon: "short_term" | "medium_term" | "long_term";
  
  // Professional classification notes
  classificationNotes?: string;
  classifiedAt: string; // ISO timestamp
  classifiedBy?: string; // Role/name
};

/**
 * SocialContextProfile — analysis of social conditions and systems.
 * Specification Section 7: Social Context & Impact Analysis.
 */
export type SocialContextProfile = {
  id: string;
  projectProfileId: string;
  
  // Affected people analysis
  affectedPeople: {
    description: string; // Who may experience benefits/disruption/displacement
    estimatedNumbers?: string; // e.g., "500–800 households" or "TBC"
    geographicLocation: string;
    livelihoodDependencies: string[]; // e.g., "access to water source", "casual labour"
  };
  
  // Social systems & institutions
  socialSystems: {
    formal: Array<{
      name: string;
      role: string;
      relevance: string; // Why it matters to the project
    }>;
    informal: Array<{
      name: string;
      role: string;
      relevance: string;
    }>;
  };
  
  // Governance structures that matter
  governanceStructures: Array<{
    name: string;
    type: "ward_committee" | "municipal" | "traditional_authority" | "community_based" | "other";
    relevance: string;
    relationship?: "legitimacy_gatekeeper" | "service_provider" | "authority" | "mediator";
  }>;
  
  // Livelihood impacts
  livelihoodImpacts: {
    sectors: string[]; // e.g., "agriculture", "retail", "labour"
    potentialEffects: string[]; // e.g., "access loss", "employment", "income disruption"
    seasonalityNote?: string; // e.g., "peak harvest July–September"
  };
  
  // Vulnerability analysis
  vulnerabilities: Array<{
    group: string;
    vulnerability: string; // e.g., "mobility-limited", "language barrier"
    disproportionateRisk: string; // How this group is affected differently
    participationBarriers: string[]; // e.g., "childcare responsibilities", "distance"
  }>;
  
  // Trust/history & conflict risk
  trustAndHistory: {
    previousProjects?: string; // Summary of prior engagement
    unfulfilledPromises?: string[];
    grievancesOrDisputes?: string[];
    conflictIndicators?: string[]; // e.g., "resource competition", "land disputes"
    trustLevel: "high" | "medium" | "low" | "unknown"; // Current baseline
  };
  
  // Opportunities
  opportunities: Array<{
    description: string;
    stakeholdersWhoWinIf: string[];
    requiredConditions: string[];
  }>;
  
  // Analysis metadata
  analysisDate: string; // ISO timestamp
  analysisSource: "tender_only" | "client_supplied" | "preliminary_field_review" | "participatory_workshop";
  confidenceLevel: "high" | "medium" | "low"; // Confidence in assertions
  notesAndAssumptions?: string;
};

/**
 * StakeholderProfile — individual stakeholder or stakeholder class intelligence.
 * Specification Section 8: Stakeholder Intelligence Specification.
 */
export type StakeholderProfile = {
  id: string;
  projectProfileId: string;
  
  // Identity
  nameOrCategory: string;
  organisationIfApplicable?: string;
  stakeholderType: "individual" | "household_group" | "community_group" | 
                   "traditional_authority" | "government" | "contractor" | 
                   "funder" | "ngo" | "union" | "other";
  geographicArea: string;
  
  // Interest & concerns
  interests: string[];
  concerns: string[];
  dependencies: string[]; // e.g., "reliant on water source"
  
  // Influence & capacity
  influence: "high" | "medium" | "low" | "unknown";
  influenceOver: string[]; // e.g., ["project decisions", "local legitimacy", "service delivery"]
  capacity: {
    literacy?: "high" | "medium" | "low";
    connectivity?: "high" | "medium" | "low";
    organisationalCapacity?: "high" | "medium" | "low";
    constraints?: string[];
  };
  
  // Impact & vulnerability
  projectImpact: string; // How project may affect them
  impactType: "benefit" | "disruption" | "displacement" | "exclusion" | "livelihood_change" | "mixed";
  
  vulnerability: {
    relevantVulnerabilities: string[];
    disproportionateImpactRisk: string;
    participationBarriers: string[];
    accessNeeds: string[]; // e.g., "transport", "language", "timing"
  };
  
  // Representation & legitimacy
  representation: {
    representativeIfApplicable?: string;
    representativeRole?: string;
    representationValidated: boolean;
    validationMethod?: string; // e.g., "community confirmation", "official appointment"
  };
  
  // Relationships
  relationshipWithClient: "neutral" | "positive" | "negative" | "unknown";
  relationshipWithProject: "neutral" | "positive" | "negative" | "unknown";
  relationshipsWithOtherStakeholders: Array<{
    otherStakeholder: string;
    nature: "collaborative" | "competitive" | "hierarchical" | "neutral" | "conflicted";
    implication?: string;
  }>;
  
  // Engagement & participation
  engagementObjective: string; // What engagement with this stakeholder must achieve
  participationLevel: "inform" | "consult" | "involve" | "collaborate" | "empower";
  whatTheyCanInfluence: string[]; // Explicit decision/design choices
  
  // Engagement method & frequency
  method: string; // e.g., "structured consultation", "walkabout", "focus group"
  frequency: string; // e.g., "monthly", "per milestone"
  
  // Risks & sensitivities
  stakeholderSpecificRisks: string[];
  sensitivities: string[]; // e.g., "cultural protocol", "previous negative experience"
  
  // Sentiment & commitment tracking
  sentiment: "positive" | "neutral" | "cautious" | "negative" | "unknown";
  sentimentTrend?: "improving" | "stable" | "declining" | "unknown";
  priorCommitments: Array<{
    commitment: string;
    status: "fulfilled" | "pending" | "broken" | "adapted";
  }>;
  
  // Evidence & records
  evidenceRecords: string[]; // e.g., "meeting minutes", "correspondence", "survey response"
  
  // Metadata
  profileCreatedAt: string; // ISO timestamp
  lastUpdatedAt: string;
  source: "tender_analysis" | "client_supplied" | "field_visit" | "community_input";
  confidenceLevel: "high" | "medium" | "low";
};

/**
 * SocialRisk — risk/impact identification and management.
 * Specification Section 7.1: Social Risk & Impact Matrix.
 */
export type SocialRisk = {
  id: string;
  projectProfileId: string;
  
  // Risk definition
  issue: string; // Potential social effect
  cause: string; // What creates the risk
  description?: string;
  
  // Who & where
  affectedStakeholders: string[]; // Specific groups, not "community"
  geographicArea: string;
  
  // Severity & likelihood
  likelihood: "low" | "medium" | "high";
  severity: "low" | "medium" | "high" | "critical";
  riskRating: "low" | "medium" | "high" | "critical"; // Calculated or assigned
  riskRatingRationale?: string;
  
  // Early warning & monitoring
  earlyWarningTrigger: string; // Observable sign that risk is increasing
  monitoringIndicator?: string; // How to track
  
  // Management & participation
  mitigation: string; // Practical management response
  participationResponse: string; // How stakeholders participate in managing it
  owner: string; // Responsible role/organisation
  
  // Evidence & tracking
  evidence: string; // How implementation/outcome is verified
  status: "identified" | "mitigating" | "monitored" | "escalated" | "resolved";
  
  // Related to grievances & commitments
  linkedGrievanceCategory?: string; // e.g., "livelihood loss", "allocation disputes"
  linkedCommitments?: string[]; // Commitment IDs that address this risk
  
  // Metadata
  identifiedAt: string; // ISO timestamp
  source: "tender_analysis" | "social_context_analysis" | "stakeholder_input" | "field_observation";
  confidenceLevel: "high" | "medium" | "low";
};

/**
 * ParticipationObjective — what participation with each stakeholder must achieve.
 * Specification Section 10: Participation Framework.
 * Mandatory rule: every major stakeholder must have explicit participation objective.
 */
export type ParticipationObjective = {
  id: string;
  stakeholderProfileId: string;
  
  // Participation definition
  stakeholderCategory: string;
  participationLevel: "inform" | "consult" | "involve" | "collaborate" | "empower";
  participationLevelRationale: string; // Why this level for this stakeholder
  
  // Decision linkage (critical)
  whatTheyCanInfluence: string[];  // Explicit list of decisions/designs
  decisionOrDesignArea: string;    // e.g., "site layout", "timing", "grievance process"
  howInputWillBeConsidered: string; // Decision logic
  feedbackMechanism: string;        // How they'll learn what happened to their input
  
  // Objectives for engagement
  objectives: Array<{
    objective: string; // e.g., "validate stakeholder map", "get approval on timeline"
    successCriterion: string;
    evidence: string; // How we know it happened
  }>;
  
  // Engagement design linked to this objective
  linkedActivities: string[]; // Activity IDs
  
  // Metadata
  createdAt: string; // ISO timestamp
};

/**
 * MethodSelection — methodology choice with rationale.
 * Specification Section 9: Participatory Methodology Library.
 */
export type MethodSelection = {
  id: string;
  engagementActivityId: string;
  
  // Method choice
  methodology: "pra" | "pla" | "cbpr" | "other";
  tool?: string; // e.g., "social mapping", "problem tree", "participatory budgeting"
  
  // Selection rationale
  selectedForObjective: string; // e.g., "understand local asset and livelihood knowledge"
  selectionRationale: string; // Why this method for this objective
  
  // Methodological details
  participantRequirements: string[]; // Who must be there
  estimatedDuration: string; // e.g., "4 hours", "3-day workshop"
  procedures: string[]; // Step-by-step
  expectedOutputs: string[]; // What it produces
  
  // Evidence & verification
  evidenceRequirements: string[]; // e.g., "photographs", "field notes", "group validation"
  
  // Limitations & notes
  limitations?: string[];
  contextualNotes?: string;
  
  // Reference
  methodologyReference?: string; // e.g., "Chambers 1994", "FAO PRA Manual"
  
  // Metadata
  createdAt: string; // ISO timestamp
};

/**
 * EngagementActivity — operational engagement design.
 * Specification Section 11: Engagement Programme Design.
 */
export type EngagementActivity = {
  id: string;
  projectProfileId: string;
  
  // Activity definition
  activityName: string;
  purpose: string; // Why it's necessary
  description?: string;
  
  // Trigger & timing
  trigger: string; // e.g., "after baseline survey", "on project milestone"
  milestone?: string;
  plannedDate?: string; // ISO date or TBC
  
  // Participants & stakeholders
  targetedStakeholders: string[]; // Stakeholder profile IDs
  participantEstimate?: string; // e.g., "30–50 people"
  
  // Method
  method: string; // e.g., "structured consultation", "focus group"
  methodSelectionId?: string; // Link to MethodSelection
  tools: string[]; // e.g., "mapping", "matrix ranking"
  
  // Input, facilitation, output
  informationNeeded: string[]; // Inputs required
  facilitationApproach: string; // How participation will be enabled
  expectedOutput: string; // Concrete product/finding
  
  // Decision linkage (critical)
  decisionLinkage: string; // How output influences action/decision
  
  // Responsibility
  owner: string; // Responsible role
  supportingRoles?: string[];
  
  // Evidence & indicators
  requiredRecords: string[]; // e.g., "attendance register", "field notes"
  performanceIndicator?: string; // How effectiveness is measured
  
  // Status & tracking
  status: "planned" | "scheduled" | "completed" | "adapted" | "cancelled";
  
  // Metadata
  createdAt: string; // ISO timestamp
  plannedEvidence: EvidenceStatus;
};

/**
 * CommunicationPlan — audience-specific communication strategy.
 * Specification Section 13: Communications Strategy.
 */
export type CommunicationPlan = {
  id: string;
  projectProfileId: string;
  
  // Audience
  audience: string; // e.g., "affected households", "municipal officials"
  audienceSize?: string;
  
  // Message
  messageCore: string; // Core message to convey
  messageKeyPoints: string[];
  
  // Channel & accessibility
  channel: "in_person_meeting" | "written_letter" | "radio" | "whatsapp" | 
           "email" | "notice_board" | "community_meeting" | "multilingual" | "other";
  channels: string[]; // Multiple channels allowed
  
  // Accessibility
  language: string;
  accessibilityRequirements?: string[]; // e.g., "large print", "sign language", "translated"
  
  // Frequency & timing
  frequency: string; // e.g., "before each milestone", "monthly"
  
  // Owner & verification
  owner: string; // Responsible role
  verificationOfReceipt?: string; // e.g., "attendance register", "acknowledgment form"
  
  // Metadata
  createdAt: string; // ISO timestamp
};

/**
 * GrievanceFramework — issue management workflow and service levels.
 * Specification Section 14: Grievance & Social Issue Management.
 */
export type GrievanceFramework = {
  id: string;
  projectProfileId: string;
  
  // Process stages
  stages: Array<{
    stage: "prevention" | "lodgement" | "acknowledgement" | "classification" | 
           "investigation" | "response" | "resolution" | "escalation" | "closure";
    function: string; // Required action
    responsibleRole: string;
    serviceLevel?: string; // e.g., "48 hours"
    evidence: string; // Record/documentation required
  }>;
  
  // Channels for lodging
  lodgementChannels: Array<{
    channel: string; // e.g., "walk-in", "WhatsApp", "meeting floor", "letter"
    accessibility: string;
    recordingMethod: string; // How it's documented
  }>;
  
  // Classification & routing
  issueCategories: Array<{
    category: string; // e.g., "livelihood loss", "allocation dispute", "safety"
    severity: "low" | "medium" | "high" | "critical";
    routingLogic: string; // Where/how it's handled
  }>;
  
  // Escalation path
  escalationRules: Array<{
    trigger: string; // e.g., "unresolved after 30 days"
    escalateTo: string;
    escalationOwner: string;
  }>;
  
  // Trend analysis
  trendMonitoring: {
    repeatedIssueThreshold: number; // e.g., 3 same issues = systemic problem
    systemicRiskResponse: string; // What happens when trend is detected
  };
  
  // Metadata
  createdAt: string; // ISO timestamp
  basedOnProjectRisks?: string[]; // Risk IDs this addresses
};

/**
 * Commitment — promise/action tracker with accountability.
 * Links engagement, stakeholder, and evidence architecture.
 */
export type Commitment = {
  id: string;
  projectProfileId: string;
  
  // Promise definition
  commitmentText: string; // Exact promise
  context?: string; // Why it was made
  madeToStakeholder: string; // Stakeholder profile ID
  madeByRole: string; // Who made it
  
  // Action & timing
  action: string; // What will be done
  owner: string; // Responsible for delivery
  dueDate?: string; // ISO date or TBC
  
  // Evidence & verification
  requiredEvidence: string[]; // How compliance is shown
  verificationMethod: string; // e.g., "community inspection", "photograph"
  
  // Status & tracking
  status: "open" | "in_progress" | "fulfilled" | "adapted" | "broken" | "closed";
  completionDate?: string; // ISO date when fulfilled
  notes?: string;
  
  // Linked to risk/activity
  linkedToRisk?: string; // Risk ID it mitigates
  linkedToActivity?: string; // Activity ID it came from
  
  // Metadata
  createdAt: string; // ISO timestamp
  lastUpdatedAt: string;
};

/**
 * Indicator — M&E measure with evidence source.
 * Specification Section 16: Monitoring, Evaluation & Learning.
 */
export type Indicator = {
  id: string;
  projectProfileId: string;
  
  // Indicator definition
  indicatorName: string;
  indicatorType: "input" | "process" | "output" | "outcome";
  indicatorTypeExplanation: string; // e.g., "were resources available?"
  
  // Measurement
  definition: string; // Clear definition
  measurementUnit: string; // e.g., "number of people", "percentage", "yes/no"
  
  // Baseline & target
  baseline?: string; // Starting point
  baselineSource?: string; // How baseline was established
  target?: string; // Goal
  targetRationale?: string; // Why this target
  
  // Collection
  frequency: string; // e.g., "monthly", "per activity"
  evidenceSource: string; // e.g., "attendance register", "survey", "observation"
  dataCollectionMethod: string; // Who collects and how
  owner: string; // Responsible role
  
  // Related objectives
  linkedToParticipationObjective?: string; // Participation objective ID
  linkedToEngagementActivity?: string; // Activity ID
  
  // Status & results
  currentValue?: string;
  lastMeasuredAt?: string; // ISO timestamp
  trend?: "improving" | "stable" | "declining";
  
  // Metadata
  createdAt: string; // ISO timestamp
};

/**
 * ComplianceItem — tender requirement → SEP response mapping.
 * Specification Section 18: Tender Compliance Matrix.
 * Critical for QA and tender evaluation.
 */
export type ComplianceItem = {
  id: string;
  projectProfileId: string;
  tenderIntelligenceId: string;
  
  // Requirement
  tenderRequirement: string; // The requirement text
  requirementCategory: "participation" | "consultation" | "local_content" | 
                       "livelihood" | "resettlement" | "vulnerability" | 
                       "reporting" | "evaluation" | "other";
  sourceReference: string; // Tender page/section
  mandatory: boolean;
  
  // Response & evidence
  sepResponse: string; // How SEP addresses it
  sepSections: string[]; // Section IDs in final document
  
  // Evidence & deliverables
  evidence: string[]; // Specific outputs/records
  linkedActivities?: string[]; // Activity IDs
  linkedIndicators?: string[]; // Indicator IDs
  
  // Status
  status: "covered" | "partial" | "missing";
  statusRationale?: string; // Why partial/missing if applicable
  
  // If partial or missing
  gap?: string; // What's missing
  mitigationPlan?: string; // How it will be addressed
  riskIfNotCovered?: string; // Consequence
  
  // Professional judgement items
  isProfessionalRecommendation: boolean; // True if added beyond tender requirement
  recommendationRationale?: string;
  
  // Metadata
  createdAt: string; // ISO timestamp
  reviewedBy?: string; // QA role
};

/**
 * QAResult — automated quality assurance finding.
 * Specification Section 20: Automated Quality Assurance.
 */
export type QAResult = {
  id: string;
  projectProfileId: string;
  
  // Test & result
  qaTest: "completeness" | "tender_alignment" | "fact_integrity" | "method_integrity" | 
          "stakeholder_completeness" | "participation_quality" | "risk_coherence" | 
          "grievance_coherence" | "me_coherence" | "schedule_realism" | "internal_consistency" | 
          "legal_restraint" | "evidence_traceability" | "professional_quality";
  
  result: "pass" | "fail" | "warning" | "info";
  severity?: "low" | "medium" | "high" | "critical";
  
  // Finding
  finding: string; // What was checked and what was found
  details?: string[]; // Specific issues
  
  // Remediation
  remediation?: string; // How to fix it
  linkedItems?: string[]; // Object IDs (compliance items, activities, risks, etc.)
  
  // Metadata
  testedAt: string; // ISO timestamp
  testVersion?: string; // QA rule version
};

/**
 * SEPDocument — final rendered document assembled from approved objects.
 * This is the output; the above objects are the analysis.
 */
export type SEPDocument = {
  id: string;
  projectProfileId: string;
  
  // Document identity
  title: string;
  status: "draft" | "reviewed" | "approved" | "published";
  version: string; // e.g., "1.0", "1.1 revised"
  
  // Content
  documentSections: Array<{
    sectionNumber: number;
    sectionTitle: string;
    sectionId: string; // Matches spec section ids
    body: string; // Rendered content
    linkedObjectIds?: string[]; // Analysis objects used
  }>;
  
  // Traceability
  complianceMatrix: ComplianceItem[];
  qaResults: QAResult[];
  
  // Document metadata
  generatedAt: string; // ISO timestamp
  generatedBy?: string; // Role/tool
  draftedWith: "template" | "gemini" | "hybrid"; // Synthesis method
  approvedBy?: string;
  approvalDate?: string;
  
  // Export formats
  formatsAvailable: ("markdown" | "docx" | "pdf")[];
};
