/**
 * T4 — plan media storage quotas (browser until Cloud File / T5).
 * Solo = 10 MB (ADR-035).
 */

import type { PlanId } from "@/config/plans";
import { PLANS } from "@/config/plans";

/** Soft caps in bytes for org media in the browser data space. */
export const PLAN_MEDIA_QUOTA_BYTES: Record<PlanId, number> = {
  solo: 10 * 1024 * 1024, // 10 MB
  practitioner: 25 * 1024 * 1024, // 25 MB
  project: 250 * 1024 * 1024, // 250 MB
  institutional: 2 * 1024 * 1024 * 1024, // 2 GB soft demo cap
};

/** Max single attachment stored as data URL in browser. */
export const MAX_INLINE_MEDIA_BYTES = 2 * 1024 * 1024; // 2 MB

export const MEDIA_KINDS = [
  "register",
  "minutes",
  "photo",
  "video",
  "other",
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  register: "Attendance register",
  minutes: "Meeting minutes",
  photo: "Photo / site evidence",
  video: "Video",
  other: "Other document",
};

export function mediaQuotaBytes(planId?: PlanId | null): number {
  if (!planId) return PLAN_MEDIA_QUOTA_BYTES.project; // demo lens
  return PLAN_MEDIA_QUOTA_BYTES[planId];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const UPGRADE_PLAN: Record<PlanId, PlanId | null> = {
  solo: "practitioner",
  practitioner: "project",
  project: "institutional",
  institutional: null,
};

export function upgradeHrefForMedia(planId?: PlanId | null): string {
  const next = planId ? UPGRADE_PLAN[planId] : "practitioner";
  if (!next) {
    return "/contact?utm_source=settings&utm_medium=media_quota";
  }
  if (next === "institutional") {
    return "/pay?plan=institutional&utm_source=settings&utm_medium=media_quota&utm_campaign=upgrade_institutional";
  }
  return `/pay?plan=${next}&utm_source=settings&utm_medium=media_quota&utm_campaign=upgrade_${next}`;
}

export function upgradeLabelForMedia(planId?: PlanId | null): string {
  const next = planId ? UPGRADE_PLAN[planId] : "practitioner";
  if (!next) return "Contact sales for dedicated storage";
  if (next === "institutional") {
    return `Upgrade to ${PLANS.institutional.name} for larger media`;
  }
  return `Upgrade to ${PLANS[next].name} (${formatBytes(PLAN_MEDIA_QUOTA_BYTES[next])})`;
}
