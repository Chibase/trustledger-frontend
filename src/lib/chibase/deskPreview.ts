/**
 * Local-only TrustLedger preview desk for the Chibase Consulting hero.
 * Not a workspace (ADR-033): no /app session, no INC-* seed, this browser only.
 */

export type PreviewKind = "case" | "person" | "promise";

export type PreviewRow = {
  id: string;
  kind: PreviewKind;
  title: string;
  place: string;
  at: string;
};

export const PREVIEW_STORAGE_KEY = "chibase-desk-preview-v1";
export const PREVIEW_MAX_ROWS = 12;

export const KIND_LABEL: Record<PreviewKind, string> = {
  case: "Case",
  person: "Person",
  promise: "Promise",
};

export function previewCounts(rows: PreviewRow[]) {
  return {
    cases: rows.filter((r) => r.kind === "case").length,
    people: rows.filter((r) => r.kind === "person").length,
    promises: rows.filter((r) => r.kind === "promise").length,
  };
}

export function newPreviewId(): string {
  return `PV-${Math.random().toString(36).slice(2, 8)}`;
}

export function sanitizePreviewText(value: string, max: number): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function parsePreviewRows(raw: string | null): PreviewRow[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row): row is PreviewRow => {
        if (!row || typeof row !== "object") return false;
        const r = row as PreviewRow;
        return (
          typeof r.id === "string" &&
          (r.kind === "case" || r.kind === "person" || r.kind === "promise") &&
          typeof r.title === "string"
        );
      })
      .slice(0, PREVIEW_MAX_ROWS)
      .map((r) => ({
        id: r.id.slice(0, 16),
        kind: r.kind,
        title: sanitizePreviewText(r.title, 80),
        place: sanitizePreviewText(r.place || "", 40),
        at: typeof r.at === "string" ? r.at : new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

const EMPTY: PreviewRow[] = [];
let memory: PreviewRow[] | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribePreviewDesk(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPreviewDeskSnapshot(): PreviewRow[] {
  if (memory) return memory;
  if (typeof window === "undefined") return EMPTY;
  memory = parsePreviewRows(sessionStorage.getItem(PREVIEW_STORAGE_KEY));
  return memory;
}

export function getPreviewDeskServerSnapshot(): PreviewRow[] {
  return EMPTY;
}

export function writePreviewDesk(rows: PreviewRow[]) {
  memory = rows;
  try {
    sessionStorage.setItem(PREVIEW_STORAGE_KEY, JSON.stringify(rows));
  } catch {
    /* private mode — memory still works this visit */
  }
  emit();
}
