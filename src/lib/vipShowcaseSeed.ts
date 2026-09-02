/**
 * Apply the VIP NCGR-B showcase pack into the active org / local desks.
 * Own-data sources only (trial / minutes) so customer-mode filters keep the rows.
 * Never runs for non-VIP or live Cloud VIP (own workspace).
 */

import { VIP_SHOWCASE_PACK, VIP_SHOWCASE_PROJECT_ID } from "@/data/vipShowcase";
import { TL_MODE_COOKIE, TL_VIP_COOKIE } from "@/lib/auth.constants";
import { saveCaptureRecord } from "@/lib/captureStore";
import { saveCapturedEmail } from "@/lib/emailGate";
import { ensureSavedIndicatorBrief } from "@/lib/indicatorBriefStore";
import { completeOnboardingWizard } from "@/lib/onboardingGuide";
import {
  saveOrgEvidence,
  saveOrgIncident,
  saveOrgProject,
  saveOrgStakeholder,
} from "@/lib/orgDataSpace";
import { isVipShowcaseWorkspace } from "@/lib/planLabel";
import { setActiveOrgId } from "@/lib/orgStore";
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

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const row = document.cookie
    .split("; ")
    .find((part) => part.startsWith(`${name}=`));
  if (!row) return "";
  return decodeURIComponent(row.split("=").slice(1).join("="));
}

function showcaseCookiesOk(): boolean {
  const mode = readCookie(TL_MODE_COOKIE);
  const vip = readCookie(TL_VIP_COOKIE) === "1";
  return isVipShowcaseWorkspace(mode === "trial" ? "trial" : "live", vip);
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
    id: "SEP-NCGR-B",
    status: "applied",
    applied: {
      at: "2026-06-15T08:00:00.000Z",
      stakeholderIds: pack.stakeholders.map((row) => row.id),
      engagementIds: pack.engagements.map((row) => row.id),
      commitmentIds: pack.commitments.map((row) => row.id),
    },
  });
}

function seedEsgIfMissing() {
  ensureSavedIndicatorBrief({
    id: "ESG-NCGR-B",
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
} {
  if (typeof window === "undefined") {
    return {
      projectId: "",
      incidents: 0,
      stakeholders: 0,
      skipped: true,
      bundleVersion: 0,
    };
  }
  if (!input.forceShowcase && !showcaseCookiesOk()) {
    console.info("[plan-packaging] skip VIP seed (not showcase workspace)");
    return {
      projectId: "",
      incidents: 0,
      stakeholders: 0,
      skipped: true,
      bundleVersion: 0,
    };
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

  completeOnboardingWizard();
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
