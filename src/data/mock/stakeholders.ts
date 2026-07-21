import type { Stakeholder } from "@/types/stakeholder";

export const mockStakeholders: Stakeholder[] = [
  {
    id: "STK-1001",
    name: "Ward 12 Community Forum",
    kind: "community_group",
    placeId: "za-gp-jhb-w12",
    influence: "high",
    interests: ["Water access", "Local employment"],
    summary: "Primary community liaison structure for Ward 12 projects.",
  },
  {
    id: "STK-1002",
    name: "Thandi Mokoena",
    kind: "individual",
    organisation: "Ward committee",
    placeId: "za-gp-jhb-w12",
    influence: "medium",
    email: "thandi.demo@example.com",
    interests: ["Youth programmes"],
  },
  {
    id: "STK-1003",
    name: "City of Johannesburg — Region E",
    kind: "government",
    placeId: "za-gp-jhb",
    influence: "high",
    interests: ["Compliance", "Service delivery"],
  },
];
