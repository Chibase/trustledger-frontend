import { mockEvidence, mockMeetingNotes } from "@/data/mockEngagements";
import type { EvidenceStub, MeetingNote } from "@/types/engagement";

function delay<T>(value: T, ms = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const noteService = {
  async list(filters: { ward?: string; projectId?: string } = {}): Promise<
    MeetingNote[]
  > {
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
    return delay(mockEvidence.filter((e) => e.incidentId === incidentId));
  },

  async list(): Promise<EvidenceStub[]> {
    return delay([...mockEvidence]);
  },
};
