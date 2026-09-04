/**
 * Browser drafts for field notes when connectivity is low or capture is interrupted.
 * Separate from `tl-trust-layer` and `tl-org-data`. Not a native offline app.
 */

import {
  EMPTY_FIELD_META,
  type FieldNoteMeta,
} from "@/lib/trust/fieldCapture";

export const FIELD_DRAFT_STORAGE_KEY = "tl-field-drafts";

export type FieldCaptureDraft = {
  orgId: string;
  projectId: string;
  source: string;
  title: string;
  body: string;
  meta: FieldNoteMeta;
  updatedAt: string;
};

type DraftRoot = Record<string, FieldCaptureDraft>;

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function draftId(orgId: string, projectId: string, source: string): string {
  return `${orgId}::${projectId}::${source}`;
}

function readRoot(store: Storage | null): DraftRoot {
  if (!store) return {};
  try {
    const raw = store.getItem(FIELD_DRAFT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as DraftRoot;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRoot(store: Storage | null, root: DraftRoot) {
  if (!store) return;
  store.setItem(FIELD_DRAFT_STORAGE_KEY, JSON.stringify(root));
}

export function readFieldCaptureDraft(
  orgId: string,
  projectId: string,
  source: string,
  store: Storage | null = storage(),
): FieldCaptureDraft | null {
  if (!orgId || !projectId || !source) return null;
  const row = readRoot(store)[draftId(orgId, projectId, source)];
  if (!row) return null;
  return {
    ...row,
    meta: { ...EMPTY_FIELD_META, ...row.meta },
  };
}

export function saveFieldCaptureDraft(
  draft: Omit<FieldCaptureDraft, "updatedAt">,
  store: Storage | null = storage(),
): FieldCaptureDraft {
  const next: FieldCaptureDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  };
  const root = readRoot(store);
  root[draftId(draft.orgId, draft.projectId, draft.source)] = next;
  writeRoot(store, root);
  return next;
}

export function clearFieldCaptureDraft(
  orgId: string,
  projectId: string,
  source: string,
  store: Storage | null = storage(),
): void {
  const root = readRoot(store);
  delete root[draftId(orgId, projectId, source)];
  writeRoot(store, root);
}
