export type ProjectStatus =
  | "Draft"
  | "Approved"
  | "Active"
  | "OnHold"
  | "Completed"
  | "Closed";

export interface Project {
  id: string;
  name: string;
  clientFunder: string;
  budgetTotal: number;
  budgetSpent: number;
  ward: string;
  municipality: string;
  status: ProjectStatus;
  contractorName: string;
  startDate: string;
  targetEndDate: string;
  publicSummary: string;
}
