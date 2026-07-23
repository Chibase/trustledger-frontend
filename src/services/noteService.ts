import { mockEvidence } from "@/data/mockEngagements";
import { FRAPPE_METHODS, isLiveMode } from "@/config/api";
import { callFrappeMethod } from "@/lib/frappeClient";
import {
  engagementService,
} from "@/services/engagementService";
import {
  engagementToMeetingNote,
  type EvidenceStub,
  type MeetingNote,
} from "@/types/engagement";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Legacy notes API — backed by Engagement records. */
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
        if (Array.isArray(rows) && rows.length) return rows;
      } catch {
        /* fall through */
      }
    }

    const engagements = await engagementService.list({
      ward: filters.ward,
      projectId: filters.projectId,
    });
    return delay(engagements.map(engagementToMeetingNote));
  },

  async get(id: string): Promise<MeetingNote | null> {
    const row = await engagementService.get(id);
    return row ? engagementToMeetingNote(row) : null;
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
