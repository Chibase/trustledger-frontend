/**
 * Apply or reverse the VIP NCGR-B showcase pack.
 * Seed: Thozamile KaDlanga (`thozi@…`) trial + VIP only.
 * Reverse: any other session that still has leftover NCGR-B rows.
 */

import { VIP_SHOWCASE_PACK, VIP_SHOWCASE_PROJECT_ID } from "@/data/vipShowcase";
import { TL_MODE_COOKIE, TL_USER_EMAIL_COOKIE, TL_VIP_COOKIE } from "@/lib/auth.constants";
import { saveCaptureRecord } from "@/lib/captureStore";
import { saveCapturedEmail } from "@/lib/emailGate";
import { ensureSavedIndicatorBrief } from "@/lib/indicatorBriefStore";
import {
  patchOnboardingState,
  restoreVipShowcaseSetupIfSeedDismissed,
} from "@/lib/onboardingGuide";
import {
  saveOrgEvidence,
  saveOrgIncident,
  saveOrgProject,
  saveOrgStakeholder,
} from "@/lib/orgDataSpace";
import { isVipShowcaseWorkspace } from "@/lib/planLabel";
import { listOrgs, removeOrg, setActiveOrgId } from "@/lib/orgStore";
import { saveAuthoredReport } from "@/lib/reportStore";
import { composeEngagementPlan } from "@/lib/sepComposer";
import {
  listEngagementPlansForProject,
  saveEngagementPlan,
} from "@/lib/sepStore";
import type { Commitment } from "@/types/commitment";
import type { Engagement } from "@/types/engagement";
import type { Stakeholder } from "@/types/stakeholder";
import {
  VIP_DEMO_BUNDLE_KEY,
  VIP_DEMO_BUNDLE_VERSION,
} from "@/types/planPackaging";
import {
  isVipShowcaseDefaultEmail,
  VIP_SHOWCASE_ORG_NAME,
} from "@/lib/vipShowcaseIdentity";

const SEP_SHOWCASE_ID = "SEP-NCGR-B";
const ESG_SHOWCASE_ID = "ESG-NCGR-B";

const ARRAY_KEYS = [
  "tl-crm-stakeholders",
  "tl-engagements",
  "tl-commitments",
  "tl-capture-records",
  "tl-authored-reports",
  "tl-esg-briefs",
  "tl-trial-incidents",
  "tl-trial-evidence",
  "tl-trial-projects",
] as const;

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  if (!row) return "";
  return decodeURIComponent(row.split("=").slice(1).join("="));
}

function showcaseCookiesOk(email: string): boolean {
  const mode = readCookie(TL_MODE_COOKIE);
  const vip = readCookie(TL_VIP_COOKIE) === "1";
  const mailbox = email || readCookie(TL_USER_EMAIL_COOKIE);
  return isVipShowcaseWorkspace(
    mode === "trial" ? "trial" : "live",
    vip,
    mailbox,
  );
}

function showcaseSeedIds(): Set<string> {
  const pack = VIP_SHOWCASE_PACK;
  const ids = new Set<string>([
    pack.project.id,
    pack.report.id,
    SEP_SHOWCASE_ID,
    ESG_SHOWCASE_ID,
  ]);
  for (const row of [
    ...pack.stakeholders,
    ...pack.engagements,
    ...pack.commitments,
    ...pack.incidents,
    ...pack.evidence,
    ...pack.captures,
  ]) {
    ids.add(row.id);
  }
  for (const incident of pack.incidents) {
    for (const ev of incident.timeline || []) ids.add(ev.id);
  }
  const promises = pack.project.dossier?.promises || [];
  for (const promise of promises) ids.add(promise.id);
  return ids;
}

function isShowcaseSeedId(id?: string | null): boolean {
  if (!id) return false;
  if (showcaseSeedIds().has(id)) return true;
  return /ncgr/i.test(id);
}

function upsertById<T extends { id: string }>(key: string, rows: T[]) {
  if (typeof window === "undefined") return;
  let existing: T[] = [];
  try {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (Array.isArray(parsed)) existing = parsed;
    }
  } catch {
    existing = [];
  }
  const byId = new Map<string, T>();
  for (const row of existing) byId.set(row.id, row);
  for (const row of rows) byId.set(row.id, row);
  try {
    window.localStorage.setItem(key, JSON.stringify([...byId.values()]));
  } catch {
    /* quota */
  }
}

function readBundleVersion(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(VIP_DEMO_BUNDLE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { version?: number };
    return typeof parsed.version === "number" ? parsed.version : 0;
  } catch {
    return 0;
  }
}

function writeBundleVersion(version: number) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      VIP_DEMO_BUNDLE_KEY,
      JSON.stringify({ version, at: new Date().toISOString() }),
    );
  } catch {
    /* quota */
  }
}

function seedSepIfMissing() {
  try {
    const pack = VIP_SHOWCASE_PACK;
    if (listEngagementPlansForProject(VIP_SHOWCASE_PROJECT_ID).length) return;
    const composed = composeEngagementPlan({
      text: `Illustrative briefing: NCGR-B 132 kV corridor reinforcement and community access roads in Ward 4, Joe Morolong Local Municipality, Northern Cape. Consult the traditional authority before bush clearing. Local labour target 60% of unskilled and semi-skilled hours. Acknowledge grievances within 48 hours. Dust suppression on the access road during haul weeks.`,
      sectorId: "energy",
      projectId: VIP_SHOWCASE_PROJECT_ID,
      projectName: pack.project.name,
      placeHint: "Ward 4 — Joe Morolong (illustrative)",
      clientHint: pack.project.clientFunder,
      timelineHint: "March 2026 – November 2027",
      purposeOverride:
        "Consult on corridor access, labour lists, and grievance closure on Package B.",
      namedParties: pack.stakeholders.slice(0, 4).map((row) => row.name),
    });
    saveEngagementPlan({
      ...composed,
      id: SEP_SHOWCASE_ID,
      status: "applied",
      applied: {
        at: "2026-06-15T08:00:00.000Z",
        stakeholderIds: pack.stakeholders.map((row) => row.id),
        engagementIds: pack.engagements.map((row) => row.id),
        commitmentIds: pack.commitments.map((row) => row.id),
      },
    });
  } catch (err) {
    console.info("[plan-packaging] SEP seed skipped", err);
  }
}

function seedEsgIfMissing() {
  ensureSavedIndicatorBrief({
    id: ESG_SHOWCASE_ID,
    placeId: "za-ward-34501004",
    placeName: "Ward 4 — Joe Morolong (illustrative)",
    title: "NCGR-B corridor socio-economic watch (illustrative)",
    executiveSummary:
      "Illustrative watch: local hire progress, dust and water complaints, and servitude courtesy protocols on Package B. Not a Stats SA series — tenant programme intel beside the baseline place pack.",
    watchpoints: [
      "Local labour hours vs 60% target",
      "Access-road dust complaints during haul weeks",
      "Traditional authority courtesy before bush clearing",
    ],
    recommendedActions: [
      "Keep the labour list current on the commitments board",
      "Close Ward 4 grievances inside the acknowledge window",
    ],
    indicatorKeys: ["local_hire", "grievance_closure"],
    model: "packaged",
    promptVersion: "vip-demo-bundle-2",
    createdAt: "2026-09-01T09:00:00.000Z",
  });
}

function dropShowcaseRow(row: {
  id?: string;
  projectId?: string;
  incidentId?: string;
}): boolean {
  return (
    isShowcaseSeedId(row.id) ||
    isShowcaseSeedId(row.projectId) ||
    isShowcaseSeedId(row.incidentId)
  );
}

function filterStoredArray(key: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as Array<Record<string, string>>;
    if (!Array.isArray(parsed)) return 0;
    const kept = parsed.filter((row) => !dropShowcaseRow(row));
    const removed = parsed.length - kept.length;
    if (removed > 0) {
      window.localStorage.setItem(key, JSON.stringify(kept));
    }
    return removed;
  } catch {
    return 0;
  }
}

function filterOrgDataBuckets(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("tl-org-data");
    if (!raw) return 0;
    const root = JSON.parse(raw) as Record<
      string,
      {
        projects?: Array<{ id: string }>;
        incidents?: Array<{ id: string }>;
        evidence?: Array<{ id: string; incidentId?: string }>;
        stakeholders?: Array<{ id: string }>;
      }
    >;
    let removed = 0;
    for (const bucket of Object.values(root)) {
      const before =
        (bucket.projects?.length || 0) +
        (bucket.incidents?.length || 0) +
        (bucket.evidence?.length || 0) +
        (bucket.stakeholders?.length || 0);
      bucket.projects = (bucket.projects || []).filter(
        (row) => !isShowcaseSeedId(row.id),
      );
      bucket.incidents = (bucket.incidents || []).filter(
        (row) => !isShowcaseSeedId(row.id),
      );
      bucket.evidence = (bucket.evidence || []).filter(
        (row) => !dropShowcaseRow(row),
      );
      bucket.stakeholders = (bucket.stakeholders || []).filter(
        (row) => !isShowcaseSeedId(row.id),
      );
      const after =
        (bucket.projects?.length || 0) +
        (bucket.incidents?.length || 0) +
        (bucket.evidence?.length || 0) +
        (bucket.stakeholders?.length || 0);
      removed += before - after;
    }
    if (removed > 0) {
      window.localStorage.setItem("tl-org-data", JSON.stringify(root));
    }
    return removed;
  } catch {
    return 0;
  }
}

function filterEngagementPlans(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("tl-engagement-plans");
    if (!raw) return 0;
    const root = JSON.parse(raw) as Record<
      string,
      Array<{ id: string; projectId?: string }>
    >;
    let removed = 0;
    for (const key of Object.keys(root)) {
      const rows = root[key] || [];
      const kept = rows.filter((row) => !dropShowcaseRow(row));
      removed += rows.length - kept.length;
      root[key] = kept;
    }
    if (removed > 0) {
      window.localStorage.setItem("tl-engagement-plans", JSON.stringify(root));
    }
    return removed;
  } catch {
    return 0;
  }
}

function filterSepExecution(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem("tl-sep-execution");
    if (!raw) return 0;
    const root = JSON.parse(raw) as Record<string, Record<string, unknown>>;
    let removed = 0;
    for (const scope of Object.keys(root)) {
      const plans = root[scope] || {};
      for (const planId of Object.keys(plans)) {
        if (isShowcaseSeedId(planId)) {
          delete plans[planId];
          removed += 1;
        }
      }
    }
    if (removed > 0) {
      window.localStorage.setItem("tl-sep-execution", JSON.stringify(root));
    }
    return removed;
  } catch {
    return 0;
  }
}

function removeForeignShowcaseOrgs(sessionEmail: string): number {
  let removed = 0;
  for (const org of listOrgs()) {
    if (org.name !== VIP_SHOWCASE_ORG_NAME) continue;
    if (isVipShowcaseDefaultEmail(org.ownerEmail)) continue;
    if (isVipShowcaseDefaultEmail(sessionEmail)) continue;
    if (removeOrg(org.id)) {
      removed += 1;
      try {
        const raw = window.localStorage.getItem("tl-org-data");
        if (!raw) continue;
        const root = JSON.parse(raw) as Record<string, unknown>;
        if (root[org.id]) {
          delete root[org.id];
          window.localStorage.setItem("tl-org-data", JSON.stringify(root));
        }
      } catch {
        /* ignore */
      }
    }
  }
  return removed;
}

function skippedResult(extra?: { purged?: boolean; removed?: number }): {
  projectId: string;
  incidents: number;
  stakeholders: number;
  skipped: true;
  bundleVersion: number;
  purged?: boolean;
  removed?: number;
} {
  return {
    projectId: "",
    incidents: 0,
    stakeholders: 0,
    skipped: true,
    bundleVersion: 0,
    ...extra,
  };
}

/**
 * Strip leftover NCGR-B rows from this browser. Does not touch Cloud VIP
 * Customers or the ops C-Suite board.
 */
export function purgeVipShowcaseSeed(sessionEmail = ""): {
  purged: boolean;
  removed: number;
} {
  if (typeof window === "undefined") {
    return { purged: false, removed: 0 };
  }
  if (isVipShowcaseDefaultEmail(sessionEmail || readCookie(TL_USER_EMAIL_COOKIE))) {
    return { purged: false, removed: 0 };
  }

  let removed = 0;
  for (const key of ARRAY_KEYS) {
    removed += filterStoredArray(key);
  }
  removed += filterOrgDataBuckets();
  removed += filterEngagementPlans();
  removed += filterSepExecution();
  removed += removeForeignShowcaseOrgs(sessionEmail);

  try {
    if (window.localStorage.getItem(VIP_DEMO_BUNDLE_KEY)) {
      window.localStorage.removeItem(VIP_DEMO_BUNDLE_KEY);
      removed += 1;
    }
  } catch {
    /* ignore */
  }

  if (removed > 0) {
    patchOnboardingState({
      wizardCompleted: false,
      dismissed: false,
      forceOpen: false,
    });
    window.dispatchEvent(new Event("tl-workspace-seeded"));
    console.info("[plan-packaging] purged leftover NCGR-B showcase rows", removed);
  }

  return { purged: removed > 0, removed };
}

export function applyVipShowcaseSeed(input: {
  orgId: string;
  email: string;
  /** Set on /login/vip after session cookies are written. */
  forceShowcase?: boolean;
}): {
  projectId: string;
  incidents: number;
  stakeholders: number;
  skipped?: boolean;
  bundleVersion: number;
  purged?: boolean;
  removed?: number;
} {
  if (typeof window === "undefined") {
    return skippedResult();
  }

  const allowSeed =
    isVipShowcaseDefaultEmail(input.email) &&
    (Boolean(input.forceShowcase) || showcaseCookiesOk(input.email));

  if (!allowSeed) {
    const purged = purgeVipShowcaseSeed(input.email);
    console.info("[plan-packaging] skip VIP seed (not Thozamile showcase)");
    return skippedResult(purged);
  }

  if (input.orgId) {
    setActiveOrgId(input.orgId);
  }

  const pack = VIP_SHOWCASE_PACK;
  saveOrgProject(pack.project, input.orgId);
  for (const incident of pack.incidents) {
    saveOrgIncident(incident, input.orgId);
  }
  for (const evidence of pack.evidence) {
    saveOrgEvidence(evidence, input.orgId);
  }
  for (const stakeholder of pack.stakeholders) {
    saveOrgStakeholder(stakeholder, input.orgId);
  }

  upsertById<Stakeholder>("tl-crm-stakeholders", pack.stakeholders);
  upsertById<Engagement>("tl-engagements", pack.engagements);
  upsertById<Commitment>("tl-commitments", pack.commitments);

  for (const capture of pack.captures) {
    saveCaptureRecord(capture);
  }
  saveAuthoredReport(pack.report);
  seedSepIfMissing();
  seedEsgIfMissing();

  restoreVipShowcaseSetupIfSeedDismissed();
  if (input.email.includes("@")) {
    saveCapturedEmail(input.email, "save");
  }

  const previousBundle = readBundleVersion();
  writeBundleVersion(VIP_DEMO_BUNDLE_VERSION);
  console.info(
    "[plan-packaging] VIP demo bundle",
    VIP_DEMO_BUNDLE_VERSION,
    "seeded/migrated",
    pack.project.id,
    "from",
    previousBundle,
  );
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tl-workspace-seeded"));
  }

  return {
    projectId: pack.project.id,
    incidents: pack.incidents.length,
    stakeholders: pack.stakeholders.length,
    bundleVersion: VIP_DEMO_BUNDLE_VERSION,
  };
}
