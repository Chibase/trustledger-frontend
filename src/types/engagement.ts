export type MeetingNote = {
  id: string;
  title: string;
  ward: string;
  projectId: string | null;
  heldOn: string;
  summary: string;
  attendeesLabel: string;
  actionItems: string[];
};

export type EvidenceStub = {
  id: string;
  incidentId: string;
  fileName: string;
  classification: "General" | "Confidential" | "Restricted";
  uploadedBy: string;
  uploadedAt: string;
  isPrimary: boolean;
};
