import type { Engagement, EvidenceStub } from "@/types/engagement";

export const mockEngagements: Engagement[] = [
  {
    id: "ENG-01",
    title: "Ward 12 roadworks community briefing",
    kind: "briefing",
    status: "follow_up",
    ward: "Ward 12",
    placeLabel: "Clinic road intersection",
    projectId: "PRJ-001",
    heldOn: "2026-07-05",
    summary:
      "Residents raised clinic access flooding and night-work noise. Contractor committed to temporary pumps and revised night schedule.",
    attendeesLabel: "Ward committee, Thari Civils, SRM desk",
    actionItems: [
      "Install temporary pumps within 48 hours",
      "Publish night-work window on notice boards",
    ],
    stakeholderIds: [],
    source: "seed",
    createdAt: "2026-07-05T16:00:00+02:00",
  },
  {
    id: "ENG-02",
    title: "Water Phase 2 east-bank walkabout",
    kind: "walkabout",
    status: "held",
    ward: "Ward 7",
    placeLabel: "East-bank tie-in",
    projectId: "PRJ-002",
    heldOn: "2026-07-03",
    summary:
      "Households reported pressure drops after tie-in. Utility engineer to verify valve settings.",
    attendeesLabel: "Community reps, Amanzi Works, Water Board",
    actionItems: ["Pressure test by Friday", "SMS update to affected streets"],
    stakeholderIds: [],
    source: "seed",
    createdAt: "2026-07-03T11:30:00+02:00",
  },
  {
    id: "ENG-03",
    title: "Market upgrade pause notice",
    kind: "consultation",
    status: "closed",
    ward: "Ward 3",
    placeLabel: "Central market",
    projectId: "PRJ-004",
    heldOn: "2026-06-28",
    summary:
      "Project on hold pending LED Fund tranche. Traders informed of revised start window.",
    attendeesLabel: "Trader association, LED office",
    actionItems: ["Post hold notice at market entrance"],
    stakeholderIds: [],
    source: "seed",
    createdAt: "2026-06-28T14:00:00+02:00",
  },
];

/** @deprecated Prefer mockEngagements — kept for noteService seed fallback. */
export const mockMeetingNotes = mockEngagements.map((row) => ({
  id: row.id,
  title: row.title,
  ward: row.ward,
  projectId: row.projectId,
  heldOn: row.heldOn,
  summary: row.summary,
  attendeesLabel: row.attendeesLabel,
  actionItems: row.actionItems,
}));

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
