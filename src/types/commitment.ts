export type CommitmentStatus =
  | "open"
  | "in_progress"
  | "overdue"
  | "fulfilled"
  | "broken"
  | "cancelled";

/** Promise tracked from an engagement / consultation (V002 packet 24d). */
export type Commitment = {
  id: string;
  title: string;
  status: CommitmentStatus;
  ownerLabel: string;
  dueOn: string;
  projectId: string | null;
  engagementId: string | null;
  stakeholderIds: string[];
  sourceActionItem?: string;
  evidenceNote?: string;
  createdAt: string;
};

export const COMMITMENT_STATUS_LABELS: Record<CommitmentStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  overdue: "Overdue",
  fulfilled: "Fulfilled",
  broken: "Broken",
  cancelled: "Cancelled",
};

/** Board columns (active work first; closed statuses grouped at end). */
export const COMMITMENT_BOARD_STATUSES: CommitmentStatus[] = [
  "open",
  "in_progress",
  "overdue",
  "fulfilled",
  "broken",
  "cancelled",
];
