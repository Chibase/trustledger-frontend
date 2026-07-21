/**
 * Capture pack stubs — minutes, attendance, social intel, pasted reports.
 */

export type CaptureSource =
  | "minutes"
  | "attendance"
  | "social_intel"
  | "pasted_report";

export type CaptureRecord = {
  id: string;
  source: CaptureSource;
  title: string;
  body: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  appliedStakeholderIds?: string[];
};

const KEY = "tl-capture-records";

function readJson<T>(fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(value));
}

export function listCaptureRecords(): CaptureRecord[] {
  return readJson<CaptureRecord[]>([]);
}

export function saveCaptureRecord(row: CaptureRecord) {
  const rows = listCaptureRecords().filter((r) => r.id !== row.id);
  rows.unshift(row);
  writeJson(rows);
}

export function createCaptureId(): string {
  return `CAP-${Date.now().toString().slice(-6)}`;
}
