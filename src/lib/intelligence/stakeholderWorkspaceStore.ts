/**
 * Browser store for P-01 stakeholder intelligence chains.
 * Local / org-scoped only. Not a Cloud DocType redesign.
 * Customer workspaces never persist or return seed_demo rows.
 */

import { getActiveOrgId } from "@/lib/orgStore";
import { isCustomerWorkspaceClient } from "@/lib/workspaceMode";
import {
  emptyStakeholderChain,
} from "@/lib/intelligence/stakeholderWorkspace";
import type { StakeholderChainBundle } from "@/types/stakeholderIntelligenceWorkspace";

export const STAKEHOLDER_WORKSPACE_STORAGE_KEY =
  "tl-stakeholder-intelligence-workspace";

type WorkspaceRoot = Record<string, Record<string, StakeholderChainBundle>>;

function spaceId(): string {
  return getActiveOrgId() || "local";
}

function readRoot(): WorkspaceRoot {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STAKEHOLDER_WORKSPACE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WorkspaceRoot;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeRoot(root: WorkspaceRoot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STAKEHOLDER_WORKSPACE_STORAGE_KEY,
    JSON.stringify(root),
  );
}

function isBundle(value: unknown): value is StakeholderChainBundle {
  if (!value || typeof value !== "object") return false;
  const row = value as StakeholderChainBundle;
  return (
    typeof row.stakeholderId === "string" &&
    (row.source === "human" || row.source === "seed_demo") &&
    Array.isArray(row.signals) &&
    Array.isArray(row.interpretations) &&
    Array.isArray(row.intelligence) &&
    Array.isArray(row.recommendations) &&
    Array.isArray(row.decisions) &&
    Array.isArray(row.actions) &&
    Array.isArray(row.outcomes)
  );
}

export function loadStakeholderChain(
  stakeholderId: string,
  opts: { customerWorkspace?: boolean } = {},
): StakeholderChainBundle {
  const customer =
    opts.customerWorkspace ??
    (typeof window !== "undefined" && isCustomerWorkspaceClient());
  const empty = emptyStakeholderChain(stakeholderId, "human");
  const bundle = readRoot()[spaceId()]?.[stakeholderId];
  if (!isBundle(bundle) || bundle.stakeholderId !== stakeholderId) {
    return empty;
  }
  if (customer && bundle.source === "seed_demo") {
    return empty;
  }
  return bundle;
}

export function saveStakeholderChain(
  bundle: StakeholderChainBundle,
  opts: { customerWorkspace?: boolean } = {},
): StakeholderChainBundle {
  const customer =
    opts.customerWorkspace ??
    (typeof window !== "undefined" && isCustomerWorkspaceClient());
  if (customer && bundle.source === "seed_demo") {
    throw new Error(
      "saveStakeholderChain: seed_demo chains cannot be stored in a customer workspace",
    );
  }
  const next: StakeholderChainBundle = {
    ...bundle,
    updatedAt: new Date().toISOString(),
  };
  const root = readRoot();
  const space = spaceId();
  root[space] = { ...(root[space] || {}), [bundle.stakeholderId]: next };
  writeRoot(root);
  return next;
}
