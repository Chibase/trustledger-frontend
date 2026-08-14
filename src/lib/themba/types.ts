import type { FaqItem } from "@/lib/aeo/siteFacts";
import type { ThembaSourceId } from "@/lib/themba/sources/types";

export type ThembaLink = { href: string; label: string };

export type ThembaKnowledgeItem = FaqItem & {
  id: string;
  keywords: string[];
  links?: ThembaLink[];
  sourceId?: ThembaSourceId;
  sourceTitle?: string;
};
