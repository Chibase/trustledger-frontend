/**
 * End-to-end SEP generation pipeline (Phases B–G).
 * Tender text → parse → classify → social context → participation →
 * compliance → QA → 25-section document.
 */

import { buildComplianceMatrix } from "@/lib/sepComplianceMatrix";
import { renderSepDocument } from "@/lib/sepDocumentRenderer";
import { planParticipation } from "@/lib/sepParticipationPlanner";
import { runQualityAssurance } from "@/lib/sepQualityAssurance";
import {
  analyseSocialContext,
  buildProjectProfileFromTender,
  generateSocialRisks,
} from "@/lib/sepSocialContextAnalysis";
import { parseTender } from "@/lib/sepTenderParser";
import type {
  SEPDocument,
  SepGenerationPlan,
  TenderIntelligence,
} from "@/types/sepAnalysis";

export function generateSepFromTender(tenderText: string): {
  tender: TenderIntelligence;
  plan: SepGenerationPlan;
  document: SEPDocument;
} {
  const tender = parseTender(tenderText);
  const project = buildProjectProfileFromTender(tender);
  const socialContext = analyseSocialContext(tender, project);
  const risks = generateSocialRisks(socialContext, project);
  const participation = planParticipation({
    tender,
    project,
    socialContext,
    risks,
    constraints: { durationMonths: tender.contractPeriod.durationMonths || 6 },
  });

  const draft: SepGenerationPlan = {
    id: `PLAN-${project.id}`,
    projectProfileId: project.id,
    tenderIntelligenceId: tender.id,
    project,
    socialContext,
    risks,
    ...participation,
    complianceMatrix: [],
    qaResults: [],
    createdAt: new Date().toISOString(),
  };

  draft.complianceMatrix = buildComplianceMatrix(tender, draft);
  draft.qaResults = runQualityAssurance(draft, tender, draft.complianceMatrix);
  const document = renderSepDocument(draft, tender);
  return { tender, plan: draft, document };
}
