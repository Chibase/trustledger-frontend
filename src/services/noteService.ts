import { mockEvidence, mockMeetingNotes } from "@/data/mockEngagements";
import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import type { EvidenceStub, MeetingNote } from "@/types/engagement";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const noteService = {
  async list(filters: { ward?: string; projectId?: string } = {}): Promise<
    MeetingNote[]
  > {
    if (isLiveMode()) {
      try {
        const rows = await callFrappeMethod<MeetingNote[]>(
          FRAPPE_METHODS.listNotes,
          { ...filters },
        );
        return Array.isArray(rows) ? rows : [];
      } catch {
        /* fall through to demo */
      }
    }

    let rows = [...mockMeetingNotes];
    if (filters.ward) rows = rows.filter((n) => n.ward === filters.ward);
    if (filters.projectId) {
      rows = rows.filter((n) => n.projectId === filters.projectId);
    }
    return delay(rows);
  },

  async get(id: string): Promise<MeetingNote | null> {
    return delay(mockMeetingNotes.find((n) => n.id === id) ?? null);
  },
};

export const evidenceService = {
  async listForIncident(incidentId: string): Promise<EvidenceStub[]> {
    if (isLiveMode()) {
      try {
        const rows = await callFrappeMethod<EvidenceStub[]>(
          FRAPPE_METHODS.listEvidence,
          { incident: incidentId },
        );
        return Array.isArray(rows) ? rows : [];
      } catch {
        /* fall through */
      }
    }
    return delay(mockEvidence.filter((e) => e.incidentId === incidentId));
  },

  async list(): Promise<EvidenceStub[]> {
    return delay([...mockEvidence]);
  },
};
