/**
 * SEP Tender Parser — Structured Extraction Engine
 * Phase B: TrustLedger SRM — SEP Generation Specification v1.0
 * 
 * Transforms uploaded tender/RFP/briefing text into structured TenderIntelligence object
 * with evidence provenance and source attribution.
 * 
 * Specification Section 5: Tender Requirements Extraction
 * Specification Section 17: Evidence & Traceability Architecture
 */

import type { TenderIntelligence, EvidenceStatus } from "@/types/sepAnalysis";

/**
 * Extraction confidence levels based on pattern matching and context.
 */
export type ExtractionConfidence = "high" | "medium" | "low";

/**
 * Parser configuration for tuning extraction behavior.
 */
export type TenderParserConfig = {
  minConfidenceThreshold: ExtractionConfidence; // Only return findings above this
  verboseLogging: boolean;
  maxExtractionLength: number; // Character limit for extracted text
  allowProvisionalInference: boolean; // Allow "professional_inference" status
};

const DEFAULT_CONFIG: TenderParserConfig = {
  minConfidenceThreshold: "medium",
  verboseLogging: false,
  maxExtractionLength: 5000,
  allowProvisionalInference: true,
};

/**
 * Extraction finding — what was found with confidence and source.
 */
type ExtractionFinding<T> = {
  value: T;
  confidence: ExtractionConfidence;
  sourceLines: number[]; // Document line numbers
  sourceQuote?: string; // Direct excerpt
  evidence: EvidenceStatus;
  rationale?: string; // Why this extraction was made
};

/**
 * Pattern library for regex-based extraction.
 * Each pattern targets a specific data element.
 */
const EXTRACTION_PATTERNS = {
  // Tender identity
  tenderNumber: [
    /(?:tender\s+(?:number|no\.?|ref(?:erence)?)|rfp\s+(?:number|no\.?)|bid\s+(?:number|no\.?))\s*[:=]?\s*([A-Z0-9\-\/\.]+)/i,
    /\b([A-Z]{2,}\d{4,}[\/\-]?\d{2,})\b/, // e.g., "DW/2026/0234"
  ],
  
  tenderTitle: [
    /(?:tender\s+title|rfp\s+title|project\s+name|assignment)\s*[:=]?\s*([^\n]{10,150})/i,
  ],
  
  procuringEntity: [
    /(?:procuring\s+entity|client|employer|principal|employer's\s+representative)\s*[:=]?\s*([^\n]{5,100})/i,
    /(?:from|issued\s+by)\s*[:=]?\s*([A-Z][A-Za-z\s&\.,']+(?:Ltd|Limited|Municipality|Department|Agency|SOC))\b/i,
  ],
  
  // Project identity
  projectSector: [
    /(?:sector|industry|field|domain)\s*[:=]?\s*(housing|infrastructure|transport|water|energy|mining|education|health|municipal|agriculture|conservation|logistics|environmental|research)/i,
  ],
  
  projectLocation: [
    /(?:location|site|area|place|province|ward|district|municipality)\s*[:=]?\s*([^\n]{5,100})/i,
    /\b(Ward\s+\d{1,3})\b/i,
    /\b([A-Z][A-Za-z]+\s+(?:Local|Metropolitan)\s+Municipality)\b/,
    /\b([A-Z][A-Za-z]+\s+(?:District|Province))\b/i,
  ],
  
  // Duration
  contractPeriod: [
    /(?:contract\s+period|duration|timeframe|implementation\s+period)\s*[:=]?\s*([^\n]{5,80})/i,
    /(?:from|between)\s+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})\s+(?:to|–|-|through)\s+(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+20\d{2})/i,
    /(\d{1,2})\s+(?:month|year)s?/i,
  ],
  
  // Stakeholders
  stakeholderName: [
    /\b([A-Z][A-Za-z0-9&.'']+(?:\s+[A-Z][A-Za-z0-9&.'']+){0,6}\s+(?:Pty Ltd|Ltd|Limited|Municipality|Traditional Council|Royal Council|Trust|Forum|Association|Department|Agency|SOC))\b/g,
  ],
  
  // SEP-related requirements (keywords that signal SEP content)
  sepRequirementKeywords: [
    /(?:stakeholder|community|public)\s+(?:engagement|participation|consultation)/i,
    /(?:social\s+(?:impact|risk|performance|licence|assessment|responsibility)|safeguard)/i,
    /(?:grievance|complaint|redress|remedy)\s+(?:mechanism|process|procedure|handling)/i,
    /(?:livelihood|economic|local\s+content|preferential\s+procurement|local\s+labour)/i,
    /(?:resettlement|relocation|displacement|affected\s+(?:people|households|persons))/i,
    /(?:environmental|public|participation|community)\s+(?:participation|consultation|meetings|forums)/i,
    /(?:vulnerability|inclusion|gender|minority|disabled|accessibility)/i,
    /(?:monitoring|evaluation|learning|reporting|evaluation\s+criteria)/i,
  ],
  
  // Regulatory references
  regulatoryReferences: [
    /\b(NEMA|EIA|IFC\s+PS\d|Equator|MPRDA|SLP|WULA|PPPFA|SPLUMA|MSA|DBE|DOH|SAHRA)\b/gi,
    /(?:environmental\s+(?:impact|management|assessment))/i,
    /(?:social\s+and\s+labour\s+plan|slp)/i,
    /(?:water\s+use\s+(?:licence|license|authorisation|authorization))/i,
  ],
};

/**
 * Normalize extracted text: trim, collapse whitespace, truncate.
 */
function normalizeText(text: string, maxLength: number = 200): string {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

/**
 * Split tender text into lines for source tracking.
 */
function splitIntoLines(text: string): string[] {
  return text.split(/\r?\n/);
}

/**
 * Read the value on the next non-empty line after a heading such as "PROJECT TITLE".
 */
function extractLabeledBlock(lines: string[], labels: string[]): string | null {
  const wanted = labels.map((label) => label.replace(/:$/, "").trim().toLowerCase());
  for (let i = 0; i < lines.length - 1; i++) {
    const heading = lines[i].replace(/:$/, "").trim().toLowerCase();
    if (!wanted.includes(heading)) continue;
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j].trim();
      if (!next) continue;
      if (wanted.includes(next.replace(/:$/, "").toLowerCase())) continue;
      if (/^[A-Z][A-Z\s\/&]{8,}$/.test(next) && next.length < 40) continue;
      return normalizeText(next, 150);
    }
  }
  return null;
}

/**
 * Find line numbers where a pattern matches (for source attribution).
 */
function findSourceLines(
  lines: string[],
  searchText: string,
  maxLines: number = 3
): number[] {
  const lineNumbers: number[] = [];
  const lowerSearch = searchText.toLowerCase();
  
  for (let i = 0; i < lines.length && lineNumbers.length < maxLines; i++) {
    if (lines[i].toLowerCase().includes(lowerSearch)) {
      lineNumbers.push(i + 1); // 1-indexed
    }
  }
  
  return lineNumbers;
}

/**
 * Assess extraction confidence based on:
 * - Pattern strength (exact match > fuzzy)
 * - Repetition (appears multiple times)
 * - Context alignment
 */
function assessConfidence(
  value: string,
  lines: string[],
  patternStrength: "exact" | "fuzzy" = "exact"
): ExtractionConfidence {
  if (!value || value.length < 2) return "low";
  
  const occurrences = lines.filter((line) =>
    line.toLowerCase().includes(value.toLowerCase())
  ).length;
  
  if (patternStrength === "exact" && occurrences >= 2) return "high";
  if (patternStrength === "exact" && occurrences === 1) return "medium";
  if (patternStrength === "fuzzy" && occurrences >= 2) return "medium";
  return "low";
}

/**
 * Extract tender number with high confidence.
 */
function extractTenderNumber(
  text: string,
  lines: string[]
): ExtractionFinding<string> | null {
  for (const pattern of EXTRACTION_PATTERNS.tenderNumber) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = normalizeText(match[1], 40);
      const sourceLines = findSourceLines(lines, match[0]);
      return {
        value,
        confidence: "high",
        sourceLines,
        sourceQuote: match[0],
        evidence: "tender_fact",
      };
    }
  }
  return null;
}

/**
 * Extract tender title.
 */
function extractTenderTitle(
  text: string,
  lines: string[]
): ExtractionFinding<string> | null {
  for (const pattern of EXTRACTION_PATTERNS.tenderTitle) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = normalizeText(match[1], 150);
      const sourceLines = findSourceLines(lines, match[0]);
      return {
        value,
        confidence: "high",
        sourceLines,
        sourceQuote: match[0],
        evidence: "tender_fact",
      };
    }
  }
  return null;
}

/**
 * Extract procuring entity (client/organisation issuing tender).
 */
function extractProcuringEntity(
  text: string,
  lines: string[]
): ExtractionFinding<string> | null {
  for (const pattern of EXTRACTION_PATTERNS.procuringEntity) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = normalizeText(match[1], 100);
      const sourceLines = findSourceLines(lines, match[0]);
      return {
        value,
        confidence: "high",
        sourceLines,
        sourceQuote: match[0],
        evidence: "tender_fact",
      };
    }
  }
  return null;
}

/**
 * Extract project sector.
 */
function extractProjectSector(
  text: string,
  lines: string[]
): ExtractionFinding<string> | null {
  for (const pattern of EXTRACTION_PATTERNS.projectSector) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = normalizeText(match[1], 50);
      const sourceLines = findSourceLines(lines, match[0]);
      return {
        value,
        confidence: "high",
        sourceLines,
        sourceQuote: match[0],
        evidence: "tender_fact",
      };
    }
  }
  return null;
}

/**
 * Extract project location(s) — can be multiple.
 */
function extractProjectLocation(
  text: string,
  lines: string[]
): ExtractionFinding<string> | null {
  const locations: string[] = [];
  
  // Look for structured location field first
  for (const pattern of EXTRACTION_PATTERNS.projectLocation) {
    const matches = text.matchAll(new RegExp(pattern, "gi"));
    for (const match of matches) {
      if (match[1]) {
        locations.push(normalizeText(match[1], 80));
      }
    }
  }
  
  if (locations.length === 0) return null;
  
  const value = locations.slice(0, 3).join(" · "); // Combine top 3
  const sourceLines = findSourceLines(lines, locations[0]);
  
  return {
    value,
    confidence: locations.length > 1 ? "high" : "medium",
    sourceLines,
    evidence: "tender_fact",
  };
}

/**
 * Extract contract period/duration.
 */
function extractContractPeriod(
  text: string,
  lines: string[]
): ExtractionFinding<string> | null {
  for (const pattern of EXTRACTION_PATTERNS.contractPeriod) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const value = normalizeText(match[1], 100);
      const sourceLines = findSourceLines(lines, match[0]);
      return {
        value,
        confidence: "medium",
        sourceLines,
        sourceQuote: match[0],
        evidence: "tender_fact",
      };
    }
  }
  return null;
}

/**
 * Extract named stakeholders/organisations mentioned in tender.
 */
function extractNamedStakeholders(
  text: string,
  lines: string[]
): ExtractionFinding<Array<{ name: string; sourceQuote?: string }>> | null {
  const stakeholders = new Map<string, string>(); // name → sourceQuote
  
  for (const pattern of EXTRACTION_PATTERNS.stakeholderName) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[0]) {
        const normalised = normalizeText(match[0], 100);
        stakeholders.set(normalised, match[0]);
      }
    }
  }
  
  if (stakeholders.size === 0) return null;
  
  const value = Array.from(stakeholders.entries()).map(([name, quote]) => ({
    name,
    sourceQuote: quote,
  }));
  
  const sourceLines = findSourceLines(lines, value[0].name);
  
  return {
    value,
    confidence: stakeholders.size > 2 ? "high" : "medium",
    sourceLines,
    evidence: "tender_fact",
  };
}

/**
 * Detect SEP-related requirements by keyword presence.
 */
function extractSepRequirements(
  text: string,
  lines: string[]
): ExtractionFinding<Array<{ category: string; text: string }>> | null {
  const requirements: Array<{ category: string; text: string }> = [];
  
  const categoryMap: Record<string, string> = {
    "stakeholder|community|public": "participation",
    "social.*impact|social.*risk|social.*performance|social.*licence|safeguard": "participation",
    "grievance|complaint|redress": "grievance",
    "livelihood|economic|local.*content|local.*labour": "livelihood",
    "resettlement|relocation|displacement|affected.*people": "resettlement",
    "vulnerability|inclusion|gender|disabled": "vulnerability",
    "monitoring|evaluation|reporting|criteria": "evaluation",
  };
  
  for (const [keywords, category] of Object.entries(categoryMap)) {
    const keywordPattern = new RegExp(keywords, "i");
    const linesWithKeyword = lines.filter((line) => keywordPattern.test(line));
    
    for (const line of linesWithKeyword) {
      const trimmed = normalizeText(line, 200);
      if (trimmed.length > 10) {
        requirements.push({ category, text: trimmed });
      }
    }
  }
  
  if (requirements.length === 0) return null;
  
  return {
    value: requirements,
    confidence: requirements.length > 3 ? "high" : "medium",
    sourceLines: findSourceLines(lines, requirements[0].text),
    evidence: "tender_fact",
  };
}

/**
 * Detect regulatory references cited in tender.
 */
function extractRegulatoryReferences(
  text: string,
  lines: string[]
): ExtractionFinding<string[]> | null {
  const references = new Set<string>();
  
  for (const pattern of EXTRACTION_PATTERNS.regulatoryReferences) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[0]) {
        references.add(normalizeText(match[0], 50));
      }
    }
  }
  
  if (references.size === 0) return null;
  
  const value = Array.from(references);
  const sourceLines = findSourceLines(lines, value[0]);
  
  return {
    value,
    confidence: value.length > 2 ? "high" : "medium",
    sourceLines,
    evidence: "regulatory_reference",
  };
}

/**
 * Main parser function — transforms tender text to TenderIntelligence.
 */
export function parseTender(
  tenderText: string,
  config: Partial<TenderParserConfig> = {}
): TenderIntelligence {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const lines = splitIntoLines(tenderText);
  const tenderTextLower = tenderText.toLowerCase();

  const labeledTitle = extractLabeledBlock(lines, [
    "PROJECT TITLE",
    "TENDER TITLE",
    "RFP TITLE",
    "ASSIGNMENT",
  ]);
  const labeledSector = extractLabeledBlock(lines, ["PROJECT SECTOR", "SECTOR"]);
  const labeledLocation = extractLabeledBlock(lines, ["LOCATION", "PROJECT LOCATION", "SITE"]);
  const labeledProcuring = extractLabeledBlock(lines, [
    "PROCURING ENTITY",
    "CLIENT",
    "EMPLOYER",
  ]);
  
  // Extract each component
  const tenderNumber = extractTenderNumber(tenderTextLower, lines);
  const tenderTitle = extractTenderTitle(tenderTextLower, lines) ||
    (labeledTitle
      ? {
          value: labeledTitle,
          confidence: "high" as const,
          sourceLines: findSourceLines(lines, labeledTitle),
          evidence: "tender_fact" as const,
        }
      : null);
  const procuringEntity = extractProcuringEntity(tenderTextLower, lines) ||
    (labeledProcuring
      ? {
          value: labeledProcuring,
          confidence: "high" as const,
          sourceLines: findSourceLines(lines, labeledProcuring),
          evidence: "tender_fact" as const,
        }
      : null);
  const projectSector = extractProjectSector(tenderTextLower, lines) ||
    (labeledSector
      ? {
          value: labeledSector,
          confidence: "high" as const,
          sourceLines: findSourceLines(lines, labeledSector),
          evidence: "tender_fact" as const,
        }
      : null);
  const projectLocation = extractProjectLocation(tenderTextLower, lines) ||
    (labeledLocation
      ? {
          value: labeledLocation,
          confidence: "high" as const,
          sourceLines: findSourceLines(lines, labeledLocation),
          evidence: "tender_fact" as const,
        }
      : null);
  const contractPeriod = extractContractPeriod(tenderTextLower, lines);
  const namedStakeholders = extractNamedStakeholders(tenderText, lines);
  const sepRequirements = extractSepRequirements(tenderTextLower, lines);
  const regulatoryRefs = extractRegulatoryReferences(tenderText, lines);
  
  // Build TenderIntelligence object
  const intelligence: TenderIntelligence = {
    id: `TENDER-${Date.now().toString(36).toUpperCase()}`,
    
    tenderNumber: tenderNumber?.value || "TBC",
    tenderTitle: tenderTitle?.value || "Tender document",
    procuringEntity: procuringEntity?.value || "Not specified",
    issuingEntity: procuringEntity?.value, // Same for now; can differ
    
    projectName: tenderTitle?.value || "Project (to be confirmed at inception)",
    projectSector: projectSector?.value || "generic",
    projectLocation: projectLocation?.value || "Location TBC",
    
    scope: {
      tasks: sepRequirements?.value
        ?.filter((r) => r.category === "participation")
        .map((r) => r.text) || [],
      geographicCoverage: projectLocation?.value?.split(" · ") || [],
      stakeholderCoverage: namedStakeholders?.value?.map((s) => s.name) || [],
      activities: sepRequirements?.value?.map((r) => r.text) || [],
    },
    
    contractPeriod: {
      durationMonths: extractMonthsFromPeriod(contractPeriod?.value),
    },
    
    namedStakeholders:
      namedStakeholders?.value?.map((s) => ({
        name: s.name,
        kind: classifyStakeholderKind(s.name),
        sourceQuote: s.sourceQuote,
      })) || [],
    
    requirements:
      sepRequirements?.value?.map((r, i) => ({
        id: `REQ-${i}`,
        category: r.category as any,
        text: r.text,
        sourceReference: `Section extraction`,
        mandatory: true,
      })) || [],
    
    regulatoryReferences:
      regulatoryRefs?.value?.map((ref) => ({
        instrument: ref,
        implication: `Verify requirements in ${ref}`,
      })) || [],
    
    reportingRequirements: {
      formats: ["written report", "meeting minutes"],
    },
    
    evidenceRequirements: ["attendance register", "meeting minutes", "photographs"],
    
    extractedAt: new Date().toISOString(),
    extractionSource: "hybrid", // Regex + potential Gemini fallback
  };
  
  return intelligence;
}

/**
 * Helper: extract months from period string.
 */
function extractMonthsFromPeriod(periodStr?: string): number | undefined {
  if (!periodStr) return undefined;
  
  const monthMatch = periodStr.match(/(\d{1,2})\s+months?/i);
  if (monthMatch?.[1]) return parseInt(monthMatch[1], 10);
  
  const yearMatch = periodStr.match(/(\d{1,2})\s+years?/i);
  if (yearMatch?.[1]) return parseInt(yearMatch[1], 10) * 12;
  
  return undefined;
}

/**
 * Helper: classify stakeholder kind from name patterns.
 */
function classifyStakeholderKind(
  name: string
): "government" | "community" | "contractor" | "funder" | "ngo" | "other" {
  const nameLower = name.toLowerCase();
  
  if (/municipality|department|agency|soc|government|council/i.test(name)) {
    return "government";
  }
  if (/traditional|council|forum|association|group|committee/i.test(name)) {
    return "community";
  }
  if (/contractor|builder|engineer|construction/i.test(name)) {
    return "contractor";
  }
  if (/bank|fund|funder|foundation|trust|investor/i.test(name)) {
    return "funder";
  }
  if (/ngo|ngos|non-governmental|charity|trust|nonprofit/i.test(name)) {
    return "ngo";
  }
  
  return "other";
}

/**
 * Validate TenderIntelligence object — check for required fields.
 */
export function validateTenderIntelligence(
  intelligence: TenderIntelligence
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!intelligence.tenderNumber || intelligence.tenderNumber === "TBC") {
    errors.push("Tender number not extracted; will be flagged as TBC");
  }
  
  if (!intelligence.tenderTitle || intelligence.tenderTitle === "Tender document") {
    errors.push("Tender title not extracted; using placeholder");
  }
  
  if (intelligence.projectSector === "generic") {
    errors.push("Project sector not detected; defaulting to generic");
  }
  
  if (intelligence.requirements.length === 0) {
    errors.push("No SEP-related requirements extracted; verify tender content");
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
