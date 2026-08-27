/**
 * SEP Document Renderer
 * Phase G: TrustLedger SRM — SEP Generation Specification v1.0
 *
 * Specification Section 19: Standard tender-grade SEP structure (25 sections + appendices).
 * Academic / reporting layout. Implementing organisation is the workspace entity, never a vendor brand.
 * Methodology may name TrustLedger and SL2B as tools (ADR-053). No product architecture.
 */

import { generateQAReport } from "@/lib/sepQualityAssurance";
import { renderAcademicAppendices, renderAcademicSections } from "@/lib/sepRenderSections";
import { complianceStatus } from "@/lib/sepComplianceMatrix";
import type {
  ComplianceItem,
  QAResult,
  SEPDocument,
  SepGenerationPlan,
  TenderIntelligence,
} from "@/types/sepAnalysis";

export const SEP_SECTION_SPECS = [
  { number: 1, id: "introduction", title: "Introduction" },
  { number: 2, id: "project-overview", title: "Project Overview" },
  { number: 3, id: "understanding", title: "Understanding of the Assignment" },
  { number: 4, id: "compliance-matrix", title: "Tender Requirements & Compliance Matrix" },
  { number: 5, id: "social-context", title: "Social Context and Impact Analysis" },
  { number: 6, id: "stakeholders", title: "Stakeholder Identification and Analysis" },
  { number: 7, id: "participation", title: "Stakeholder Participation Framework" },
  { number: 8, id: "risk-opportunity", title: "Social Risk and Opportunity Assessment" },
  { number: 9, id: "methodology", title: "Participatory Methodology — PRA, PLA and CBPR" },
  { number: 10, id: "engagement-strategy", title: "Engagement Strategy" },
  { number: 11, id: "community-programme", title: "Community Participation Programme" },
  { number: 12, id: "inclusion", title: "Inclusion and Vulnerability Strategy" },
  { number: 13, id: "communication", title: "Communication Strategy" },
  { number: 14, id: "grievance", title: "Grievance Redress Mechanism" },
  { number: 15, id: "early-warning", title: "Social Risk and Early Warning" },
  { number: 16, id: "led", title: "Local Economic / Empowerment Participation" },
  { number: 17, id: "mel", title: "Monitoring, Evaluation and Learning" },
  { number: 18, id: "reporting", title: "Reporting Framework" },
  { number: 19, id: "roles", title: "Roles and Responsibilities" },
  { number: 20, id: "schedule", title: "Implementation Schedule" },
  { number: 21, id: "resources", title: "Resources and Capacity" },
  { number: 22, id: "data", title: "Data Management and Evidence" },
  { number: 23, id: "qa", title: "Quality Assurance" },
  { number: 24, id: "assumptions", title: "Assumptions, Dependencies and Limitations" },
  { number: 25, id: "conclusion", title: "Conclusion" },
] as const;

export const SEP_APPENDIX_SPECS = [
  { id: "app-stakeholders", title: "Appendix A — Stakeholder Register" },
  { id: "app-engagement", title: "Appendix B — Engagement Matrix" },
  { id: "app-risks", title: "Appendix C — Risk Register" },
  { id: "app-grm", title: "Appendix D — Grievance Workflow" },
  { id: "app-tools", title: "Appendix E — Participation Tools" },
  { id: "app-indicators", title: "Appendix F — Indicators" },
  { id: "app-reporting", title: "Appendix G — Reporting Templates" },
  { id: "app-consultation", title: "Appendix H — Consultation Record" },
  { id: "app-commitments", title: "Appendix I — Commitment Register" },
  { id: "app-compliance", title: "Appendix J — Compliance Matrix" },
  { id: "app-qa", title: "Appendix K — QA Report" },
  { id: "app-references", title: "Appendix L — References" },
] as const;

export function renderSepDocument(
  plan: SepGenerationPlan,
  tender: TenderIntelligence,
): SEPDocument {
  const bodies = renderAcademicSections(plan, tender);
  const documentSections: SEPDocument["documentSections"] = SEP_SECTION_SPECS.map((spec, index) => {
    const rendered = bodies[index];
    return {
      sectionNumber: spec.number,
      sectionTitle: spec.title,
      sectionId: spec.id,
      body: rendered?.body || "",
      ...(rendered?.tables?.length ? { tables: rendered.tables } : {}),
      linkedObjectIds: [plan.id],
    };
  });

  const appendices = renderAcademicAppendices(plan);
  SEP_APPENDIX_SPECS.forEach((spec, index) => {
    const rendered = appendices[index];
    documentSections.push({
      sectionNumber: 25 + index + 1,
      sectionTitle: spec.title,
      sectionId: spec.id,
      body: rendered?.body || "",
      ...(rendered?.tables?.length ? { tables: rendered.tables } : {}),
    });
  });

  return {
    id: `SEPDOC-${plan.id}`,
    projectProfileId: plan.projectProfileId,
    title: `Stakeholder Engagement Plan — ${tender.projectName || tender.tenderTitle}`,
    status: "draft",
    version: "1.0",
    documentSections,
    complianceMatrix: plan.complianceMatrix,
    qaResults: plan.qaResults,
    generatedAt: new Date().toISOString(),
    generatedBy: "SEP generation engine",
    draftedWith: "template",
    formatsAvailable: ["markdown", "docx", "pdf"],
  };
}

export function assertSepStructure(doc: SEPDocument): { ok: boolean; missing: string[] } {
  const titles = new Set(doc.documentSections.map((row) => row.sectionTitle));
  const missing = [
    ...SEP_SECTION_SPECS.filter((spec) => !titles.has(spec.title)).map((spec) => spec.title),
    ...SEP_APPENDIX_SPECS.filter((spec) => !titles.has(spec.title)).map((spec) => spec.title),
  ];
  const empty = doc.documentSections.filter((row) => !row.body.trim()).map((row) => row.sectionTitle);
  return { ok: missing.length === 0 && empty.length === 0, missing: [...missing, ...empty.map((t) => `empty: ${t}`)] };
}

export function qaResultsReady(results: QAResult[]): boolean {
  return generateQAReport(results).readyForApproval;
}

export function complianceReady(matrix: ComplianceItem[]): boolean {
  return complianceStatus(matrix).missing === 0;
}
