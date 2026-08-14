import type { ThembaKnowledgeItem } from "@/lib/themba/types";
import { IKS_PRACTICE_ITEMS } from "@/lib/themba/sources/iksPractice";
import { OPERATING_PROCEDURE_ITEMS } from "@/lib/themba/sources/operatingProcedures";
import { SRM_BLUEPRINT_ITEMS } from "@/lib/themba/sources/srmBlueprint";

/** Document-grounded corpus merged into Themba retrieval (ADR-045). */
export function thembaDocumentSources(): ThembaKnowledgeItem[] {
  return [
    ...OPERATING_PROCEDURE_ITEMS,
    ...SRM_BLUEPRINT_ITEMS,
    ...IKS_PRACTICE_ITEMS,
  ];
}
