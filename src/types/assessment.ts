export type AssessmentDimensionId =
  | "intake"
  | "ownership"
  | "field"
  | "engagement"
  | "reporting"
  | "assurance";

export type LikertValue = 1 | 2 | 3 | 4 | 5;

export type RiskBand = "critical" | "elevated" | "moderate" | "strong";

export type AssessmentQuestion = {
  id: string;
  dimensionId: AssessmentDimensionId;
  prompt: string;
  help?: string;
};

export type AssessmentDimension = {
  id: AssessmentDimensionId;
  label: string;
  shortLabel: string;
  issue: string;
  priorityTitle: string;
  prioritySummary: string;
  day30: string;
  day60: string;
  day90: string;
};

export type DimensionScore = {
  id: AssessmentDimensionId;
  label: string;
  shortLabel: string;
  score: number;
  averageLikert: number;
};

export type AssessmentResult = {
  overallScore: number;
  riskBand: RiskBand;
  riskLabel: string;
  riskSummary: string;
  dimensions: DimensionScore[];
  topPriorities: AssessmentDimensionId[];
  completedAt: string;
};

export type AssessmentAnswers = Record<string, LikertValue>;

export type AssessmentLeadPayload = {
  name: string;
  email: string;
  organization?: string;
  sector?: string;
  overallScore: number;
  riskBand: RiskBand;
  dimensionScores: Record<AssessmentDimensionId, number>;
  topPriorities: AssessmentDimensionId[];
  answers: AssessmentAnswers;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  landingPath: string;
  completedAt: string;
  /** Required visitor note / intent (anti-spam + sales context). */
  comment?: string;
};
