import type { EvidenceStub, MeetingNote } from "@/types/engagement";

export const mockMeetingNotes: MeetingNote[] = [
  {
    id: "NOTE-01",
    title: "Ward 12 roadworks community briefing",
    ward: "Ward 12",
    projectId: "PRJ-001",
    heldOn: "2026-07-05",
    summary:
      "Residents raised clinic access flooding and night-work noise. Contractor committed to temporary pumps and revised night schedule.",
    attendeesLabel: "Ward committee, Thari Civils, SRM desk",
    actionItems: [
      "Install temporary pumps within 48 hours",
      "Publish night-work window on notice boards",
    ],
  },
  {
    id: "NOTE-02",
    title: "Water Phase 2 east-bank walkabout",
    ward: "Ward 7",
    projectId: "PRJ-002",
    heldOn: "2026-07-03",
    summary:
      "Households reported pressure drops after tie-in. Utility engineer to verify valve settings.",
    attendeesLabel: "Community reps, Amanzi Works, Water Board",
    actionItems: ["Pressure test by Friday", "SMS update to affected streets"],
  },
  {
    id: "NOTE-03",
    title: "Market upgrade pause notice",
    ward: "Ward 3",
    projectId: "PRJ-004",
    heldOn: "2026-06-28",
    summary:
      "Project on hold pending LED Fund tranche. Traders informed of revised start window.",
    attendeesLabel: "Trader association, LED office",
    actionItems: ["Post hold notice at market entrance"],
  },
];

export const mockEvidence: EvidenceStub[] = [
  {
    id: "EVD-01",
    incidentId: "INC-1001",
    fileName: "clinic-road-flooding.jpg",
    classification: "General",
    uploadedBy: "Community reporter",
    uploadedAt: "2026-07-08T09:22:00+02:00",
    isPrimary: true,
  },
  {
    id: "EVD-02",
    incidentId: "INC-1007",
    fileName: "open-trench-night.jpg",
    classification: "General",
    uploadedBy: "Community reporter",
    uploadedAt: "2026-07-10T07:45:00+02:00",
    isPrimary: true,
  },
  {
    id: "EVD-03",
    incidentId: "INC-1012",
    fileName: "june-claim-checklist.pdf",
    classification: "Confidential",
    uploadedBy: "Client desk",
    uploadedAt: "2026-07-06T14:05:00+02:00",
    isPrimary: false,
  },
];
