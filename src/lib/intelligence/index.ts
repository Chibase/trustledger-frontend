export {
  createIntelligenceProvenance,
  createIntelligenceRecommendation,
  intelligenceLifecycleIndex,
  isHumanDecisionRecord,
  isHumanDecisionStatus,
  isIntelligenceConfidenceLevel,
  isIntelligenceLifecycleStage,
  isRecommendationRecord,
  isSpineKind,
  isSuggestionGovernance,
  lifecycleStageOf,
  recordHumanDecision,
  recommendationIsNotADecision,
  stampSuggestion,
  suggestionGovernance,
  uniqueRecordRefs,
  SUGGESTION_GOVERNANCE,
} from "@/lib/intelligence/foundation";
export {
  commonRecommendationFromTrust,
  provenanceFromTrustTrace,
  recordRefsFromTrustTrace,
} from "@/lib/intelligence/fromTrust";
