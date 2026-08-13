export {
  THEMBA_ESCALATE_REPLY,
  THEMBA_GREETING,
  thembaKnowledgeCorpus,
} from "@/lib/themba/knowledge";
export { composeThembaReply, maybePolishWithLlm } from "@/lib/themba/reply";
export type { ThembaChatMessage, ThembaReply } from "@/lib/themba/reply";
export { shouldEscalate } from "@/lib/themba/escalate";
export { retrieveKnowledge } from "@/lib/themba/retrieve";
export { sanitizeThembaText } from "@/lib/themba/sanitize";
