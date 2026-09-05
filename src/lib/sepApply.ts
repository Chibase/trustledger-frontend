/**
 * Apply an approved SEP onto SRM modules (suggest → human apply → save).
 */

import { createCommitmentId, commitmentService } from "@/services/commitmentService";
import { createEngagementId, engagementService } from "@/services/engagementService";
import {
  createStakeholderId,
  stakeholderService,
} from "@/services/stakeholderService";
import type { Commitment } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type { EngagementPlan } from "@/types/engagementPlan";
import type { Stakeholder } from "@/types/stakeholder";
import { saveEngagementPlanLive } from "@/lib/sepPersist";

function isoDateOffset(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function phaseOffset(phaseId: EngagementPlan["phases"][number]["id"]): number {
  switch (phaseId) {
    case "inception":
      return 3;
    case "mapping":
      return 10;
    case "scoping":
      return 14;
    case "first_contact":
      return 18;
    case "consultation":
      return 28;
    case "commitments":
      return 35;
    case "closeout":
      return 60;
    default:
      return 21;
  }
}

export type SepApplyCounts = {
  stakeholders: number;
  engagements: number;
  commitments: number;
};

export type SepApplyResult = SepApplyCounts & {
  plan: EngagementPlan;
};

/** Counts that Apply will attempt (duplicates skipped at write time). */
export function previewSepApply(plan: EngagementPlan): SepApplyCounts {
  let stakeholders = 0;
  for (const cls of plan.stakeholderClasses) {
    const named = cls.namedFromBrief?.length ? cls.namedFromBrief : [cls.label];
    stakeholders += named.filter((name) => name.trim().length >= 2).length;
  }
  return {
    stakeholders,
    engagements: plan.activities.length,
    commitments: plan.commitments.length,
  };
}

export async function applyEngagementPlanToSrm(
  plan: EngagementPlan,
): Promise<SepApplyResult> {
  const now = new Date().toISOString();
  const created: SepApplyCounts = {
    stakeholders: 0,
    engagements: 0,
    commitments: 0,
  };
  const stakeholderIds: string[] = [...(plan.applied?.stakeholderIds || [])];
  const engagementIds: string[] = [...(plan.applied?.engagementIds || [])];
  const commitmentIds: string[] = [...(plan.applied?.commitmentIds || [])];

  const existingNames = new Set(
    (await stakeholderService.list()).map((row) => row.name.toLowerCase()),
  );

  for (const cls of plan.stakeholderClasses) {
    const named = cls.namedFromBrief?.length ? cls.namedFromBrief : [cls.label];
    for (const name of named) {
      const label = name.trim();
      if (label.length < 2) continue;
      if (existingNames.has(label.toLowerCase())) continue;
      const row: Stakeholder = {
        id: createStakeholderId(),
        name: label,
        kind: cls.kind,
        status: "prospect",
        influence: cls.influence,
        interests: [cls.purpose, cls.label],
        tags: ["sep", plan.sectorId, cls.id],
        summary: cls.why,
        engagementRole: cls.label,
        projectIds: plan.projectId ? [plan.projectId] : [],
        nextAction: `First contact for SEP ${plan.id}`,
        source: "trial",
        createdAt: now,
        updatedAt: now,
      };
      const saved = await stakeholderService.save(row);
      stakeholderIds.push(saved.id);
      created.stakeholders += 1;
      existingNames.add(label.toLowerCase());
    }
  }

  const existingEngagements = await engagementService.list({
    projectId: plan.projectId || undefined,
  });
  const existingTitles = new Set(
    existingEngagements.map((row) => row.title.toLowerCase()),
  );

  for (const activity of plan.activities) {
    if (existingTitles.has(activity.title.toLowerCase())) continue;
    const row: Engagement = {
      id: createEngagementId(),
      title: activity.title,
      kind: activity.engagementKind,
      status: "draft",
      heldOn: isoDateOffset(phaseOffset(activity.phaseId)),
      ward: plan.placeHint || "",
      placeLabel: plan.placeHint || undefined,
      projectId: plan.projectId,
      summary: `${activity.method}. ${activity.evidenceHint}. ${activity.timingHint}.`,
      attendeesLabel: activity.ownerHint,
      actionItems: [
        `Owner: ${activity.ownerHint}`,
        activity.captureTemplate
          ? `Capture with ${activity.captureTemplate} template`
          : "Log evidence on Capture after the event",
      ],
      stakeholderIds,
      source: "pasted_report",
      createdAt: now,
    };
    const saved = await engagementService.save(row);
    engagementIds.push(saved.id);
    created.engagements += 1;
    existingTitles.add(activity.title.toLowerCase());
  }

  const existingCommitments = await commitmentService.list({
    projectId: plan.projectId || undefined,
  });
  const existingCommitmentTitles = new Set(
    existingCommitments.map((row) => row.title.toLowerCase()),
  );

  for (const item of plan.commitments) {
    if (existingCommitmentTitles.has(item.title.toLowerCase())) continue;
    const row: Commitment = {
      id: createCommitmentId(),
      title: item.title,
      status: "open",
      ownerLabel: item.ownerHint,
      dueOn: isoDateOffset(45),
      projectId: plan.projectId,
      engagementId: engagementIds[0] || null,
      stakeholderIds,
      sourceActionItem: item.why,
      createdAt: now,
    };
    const saved = await commitmentService.save(row);
    commitmentIds.push(saved.id);
    created.commitments += 1;
    existingCommitmentTitles.add(item.title.toLowerCase());
  }

  const next: EngagementPlan = {
    ...plan,
    status: "applied",
    updatedAt: now,
    applied: {
      at: now,
      stakeholderIds,
      engagementIds,
      commitmentIds,
    },
  };
  await saveEngagementPlanLive(next);
  return {
    plan: next,
    stakeholders: created.stakeholders,
    engagements: created.engagements,
    commitments: created.commitments,
  };
}
