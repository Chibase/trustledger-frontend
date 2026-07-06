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
  ward: string;
  status: ProjectStatus;
}
