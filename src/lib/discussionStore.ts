/**
 * Browser discussion threads for report/issue viewers.
 * Key: tl-discussions. Cloud DocType later — mirror shape in types/discussion.ts.
 */

import { isPlanId, type PlanId } from "@/config/plans";
import {
  createEngagementId,
  engagementService,
} from "@/services/engagementService";
import type {
  DiscussionCalendarItem,
  DiscussionCalendarKind,
  DiscussionKind,
  DiscussionMessage,
  DiscussionSubjectRef,
  DiscussionThread,
} from "@/types/discussion";
import type { Engagement } from "@/types/engagement";
import { TL_TRIAL_PLAN_COOKIE, SESSION_ROLE_COOKIE, TL_USER_NAME_COOKIE } from "@/lib/auth.constants";
import { hasCapabilityForPlan } from "@/lib/entitlements";

const STORAGE_KEY = "tl-discussions";

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return undefined;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function readAll(): DiscussionThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DiscussionThread[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: DiscussionThread[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

/** Plan stamp for audit — from session cookie when present. */
export function readSessionPlanId(): PlanId | undefined {
  const value = readCookie(TL_TRIAL_PLAN_COOKIE);
  return value && isPlanId(value) ? value : undefined;
}

export function readSessionAuthor(): { name: string; role?: string } {
  const name = readCookie(TL_USER_NAME_COOKIE)?.trim();
  const role = readCookie(SESSION_ROLE_COOKIE)?.trim();
  return {
    name: name || "Viewer",
    role: role || undefined,
  };
}

export function listDiscussionsForSubject(
  subjectType: DiscussionThread["subjectType"],
  subjectId: string,
): DiscussionThread[] {
  return readAll()
    .filter((t) => t.subjectType === subjectType && t.subjectId === subjectId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getDiscussionThread(id: string): DiscussionThread | null {
  return readAll().find((t) => t.id === id) ?? null;
}

export function createDiscussionThread(input: {
  subject: DiscussionSubjectRef;
  kind: DiscussionKind;
  body: string;
  authorName: string;
  authorRole?: string;
  planId?: PlanId;
  calendar?: {
    title: string;
    startsAt: string;
    endsAt?: string;
    kind?: DiscussionCalendarKind;
    location?: string;
    notes?: string;
    createEngagement?: boolean;
  };
}): DiscussionThread {
  const now = new Date().toISOString();
  const planId = input.planId ?? readSessionPlanId();
  const message: DiscussionMessage = {
    id: newId("dmsg"),
    authorName: input.authorName.trim() || "Viewer",
    authorRole: input.authorRole,
    body: input.body.trim(),
    givenAt: now,
  };

  const calendarItems: DiscussionCalendarItem[] = [];
  let status: DiscussionThread["status"] = "open";

  if (input.kind === "meeting_request" && input.calendar?.startsAt) {
    const cal = input.calendar;
    const item: DiscussionCalendarItem = {
      id: newId("dcal"),
      title: cal.title.trim() || "Proposed meeting",
      startsAt: cal.startsAt,
      endsAt: cal.endsAt,
      kind: cal.kind || "meeting",
      location: cal.location?.trim() || undefined,
      notes: cal.notes?.trim() || undefined,
      createdAt: now,
    };

    if (
      cal.createEngagement &&
      hasCapabilityForPlan("engagements", planId) &&
      typeof window !== "undefined"
    ) {
      const heldOn = cal.startsAt.slice(0, 10);
      const engagement: Engagement = {
        id: createEngagementId(),
        title: item.title,
        kind: item.kind === "engagement" ? "consultation" : "meeting",
        status: "draft",
        heldOn,
        ward: "",
        placeLabel: item.location,
        projectId: input.subject.projectId || null,
        summary:
          item.notes ||
          `Proposed from ${input.subject.subjectType} discussion: ${input.subject.subjectTitle}`,
        attendeesLabel: input.authorName.trim() || "Viewer",
        actionItems: [],
        stakeholderIds: [],
        source: "discussion",
        createdAt: now,
      };
      void engagementService.save(engagement);
      item.engagementId = engagement.id;
    }

    calendarItems.push(item);
    status = "scheduled";
  }

  const thread: DiscussionThread = {
    id: newId("dth"),
    subjectType: input.subject.subjectType,
    subjectId: input.subject.subjectId,
    subjectTitle: input.subject.subjectTitle,
    projectId: input.subject.projectId,
    kind: input.kind,
    status,
    planId,
    createdAt: now,
    updatedAt: now,
    givenAt: now,
    respondedAt: null,
    messages: [message],
    calendarItems,
  };

  const all = readAll();
  all.unshift(thread);
  writeAll(all);
  return thread;
}

export function addDiscussionResponse(input: {
  threadId: string;
  body: string;
  authorName: string;
  authorRole?: string;
  /** Explicit response timestamp (defaults to now). */
  respondedAt?: string;
}): DiscussionThread | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === input.threadId);
  if (idx < 0) return null;
  const thread = all[idx];
  const now = input.respondedAt || new Date().toISOString();
  const message: DiscussionMessage = {
    id: newId("dmsg"),
    authorName: input.authorName.trim() || "Responder",
    authorRole: input.authorRole,
    body: input.body.trim(),
    givenAt: now,
    isResponse: true,
  };
  const prior = thread.messages[thread.messages.length - 1];
  if (prior && !prior.isResponse && !prior.respondedAt) {
    prior.respondedAt = now;
  }
  thread.messages.push(message);
  thread.respondedAt = now;
  thread.updatedAt = now;
  if (thread.status === "open") thread.status = "responded";
  all[idx] = thread;
  writeAll(all);
  return thread;
}

export function addDiscussionCalendarItem(input: {
  threadId: string;
  title: string;
  startsAt: string;
  endsAt?: string;
  kind?: DiscussionCalendarKind;
  location?: string;
  notes?: string;
  createEngagement?: boolean;
  authorName?: string;
}): DiscussionThread | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === input.threadId);
  if (idx < 0) return null;
  const thread = all[idx];
  const now = new Date().toISOString();
  const item: DiscussionCalendarItem = {
    id: newId("dcal"),
    title: input.title.trim() || "Meeting",
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    kind: input.kind || "meeting",
    location: input.location?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: now,
  };

  if (
    input.createEngagement &&
    hasCapabilityForPlan("engagements", thread.planId) &&
    typeof window !== "undefined"
  ) {
    const engagement: Engagement = {
      id: createEngagementId(),
      title: item.title,
      kind: item.kind === "engagement" ? "consultation" : "meeting",
      status: "draft",
      heldOn: item.startsAt.slice(0, 10),
      ward: "",
      placeLabel: item.location,
      projectId: thread.projectId || null,
      summary:
        item.notes ||
        `Scheduled from ${thread.subjectType} discussion: ${thread.subjectTitle}`,
      attendeesLabel: input.authorName?.trim() || "Participant",
      actionItems: [],
      stakeholderIds: [],
      source: "discussion",
      createdAt: now,
    };
    void engagementService.save(engagement);
    item.engagementId = engagement.id;
  }

  thread.calendarItems.push(item);
  thread.status = "scheduled";
  thread.updatedAt = now;
  all[idx] = thread;
  writeAll(all);
  return thread;
}

export function closeDiscussionThread(threadId: string): DiscussionThread | null {
  const all = readAll();
  const idx = all.findIndex((t) => t.id === threadId);
  if (idx < 0) return null;
  const now = new Date().toISOString();
  all[idx] = {
    ...all[idx],
    status: "closed",
    updatedAt: now,
  };
  writeAll(all);
  return all[idx];
}

export function formatDiscussionStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-ZA", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
