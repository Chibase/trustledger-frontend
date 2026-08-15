export {
  THEMBA_AVATAR_ALT,
  THEMBA_AVATAR_SRC,
} from "@/lib/themba/assets";
export {
  conversionActionsFor,
  followUpChipsFor,
  THEMBA_CONVERSION_ACTIONS,
  THEMBA_PROFILE_CHIPS,
  THEMBA_STARTER_CHIPS,
} from "@/lib/themba/actions";
export type { ThembaAction, ThembaChip } from "@/lib/themba/actions";
export { mentionsBugKeyword, isProductDefectReport } from "@/lib/themba/bugDetect";
export {
  THEMBA_BUBBLE_GREETING,
  THEMBA_ESCALATE_REPLY,
  THEMBA_GREETING,
  thembaKnowledgeCorpus,
} from "@/lib/themba/knowledge";
export { magnetForQuestion, wantsLeadMagnet } from "@/lib/themba/magnet";
export {
  detectThembaProfile,
  isThembaProfile,
  THEMBA_PROFILE_LABELS,
  THEMBA_PROFILES,
} from "@/lib/themba/profile";
export type { ThembaProfile } from "@/lib/themba/profile";
export { composeThembaReply, maybePolishWithLlm } from "@/lib/themba/reply";
export type {
  ThembaChatMessage,
  ThembaReply,
  ThembaReplyMode,
} from "@/lib/themba/reply";
export { shouldEscalate } from "@/lib/themba/escalate";
export { retrieveKnowledge } from "@/lib/themba/retrieve";
export { sanitizeThembaText } from "@/lib/themba/sanitize";
