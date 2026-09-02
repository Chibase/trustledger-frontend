/**
 * Apply the VIP NCGR-B showcase pack into the active org / local desks.
 * Own-data sources only (trial / minutes) so customer-mode filters keep the rows.
 */

import { VIP_SHOWCASE_PACK } from "@/data/vipShowcase";
import { saveCaptureRecord } from "@/lib/captureStore";
import { saveCapturedEmail } from "@/lib/emailGate";
import { completeOnboardingWizard } from "@/lib/onboardingGuide";
import {
  saveOrgEvidence,
  saveOrgIncident,
  saveOrgProject,
  saveOrgStakeholder,
} from "@/lib/orgDataSpace";
import { saveAuthoredReport } from "@/lib/reportStore";
import type { Commitment } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type { Stakeholder } from "@/types/stakeholder";

function upsertById<T extends { id: string }>(key: string, rows: T[]) {
  if (typeof window === "undefined") return;
  let existing: T[] = [];
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (Array.isArray(parsed)) existing = parsed;
    }
  } catch {
    existing = [];
  }
  const byId = new Map<string, T>();
  for (const row of existing) byId.set(row.id, row);
  for (const row of rows) byId.set(row.id, row);
  try {
    window.localStorage.setItem(key, JSON.stringify([...byId.values()]));
  } catch {
    // Quota / private mode — org desks still persist via saveOrg*.
  }
}

export function applyVipShowcaseSeed(input: {
  orgId: string;
  email: string;
}): { projectId: string; incidents: number; stakeholders: number } {
  const pack = VIP_SHOWCASE_PACK;
  saveOrgProject(pack.project, input.orgId);
  for (const incident of pack.incidents) {
    saveOrgIncident(incident, input.orgId);
  }
  for (const evidence of pack.evidence) {
    saveOrgEvidence(evidence, input.orgId);
  }
  for (const stakeholder of pack.stakeholders) {
    saveOrgStakeholder(stakeholder, input.orgId);
  }

  upsertById<Stakeholder>("tl-crm-stakeholders", pack.stakeholders);
  upsertById<Engagement>("tl-engagements", pack.engagements);
  upsertById<Commitment>("tl-commitments", pack.commitments);

  for (const capture of pack.captures) {
    saveCaptureRecord(capture);
  }
  saveAuthoredReport(pack.report);

  completeOnboardingWizard();
  if (input.email.includes("@")) {
    saveCapturedEmail(input.email, "save");
  }

  return {
    projectId: pack.project.id,
    incidents: pack.incidents.length,
    stakeholders: pack.stakeholders.length,
  };
}
