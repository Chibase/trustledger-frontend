import type { ProjectStatus } from "@/types/project";

export type MockIncident = {
  id: string;
  title: string;
  description: string;
  ward: string;
  status: "Open" | "Investigating" | "Escalated" | "Closed";
  priority: "P4-Low" | "P3-Medium" | "P2-High" | "P1-Critical";
  projectName: string;
  projectStatus: ProjectStatus;
};

export const mockIncidents: MockIncident[] = [
  {
    id: "INC-1001",
    title: "Burst pipe near clinic access road",
    description:
      "Community members report a burst pipe flooding the access road to the clinic. People are angry and say the contractor has not responded for two days.",
    ward: "Ward 12",
    status: "Escalated",
    priority: "P1-Critical",
    projectName: "Road Repair",
    projectStatus: "Active",
  },
  {
    id: "INC-1004",
    title: "Dust and noise from night works",
    description:
      "Residents are concerned about dust and continuous noise from night construction near homes.",
    ward: "Ward 12",
    status: "Investigating",
    priority: "P2-High",
    projectName: "Road Repair",
    projectStatus: "Active",
  },
];

export function getMockIncident(id: string): MockIncident | undefined {
  return mockIncidents.find((incident) => incident.id === id);
}
