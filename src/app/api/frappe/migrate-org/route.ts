import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { FRAPPE_SID_COOKIE, TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  createCloudEvidence,
  createCloudIncident,
  createCloudProject,
} from "@/lib/productCloud";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import { bindSessionCustomer } from "@/lib/tenantScope";
import {
  upsertCloudCommunity,
  upsertCloudObservation,
  upsertCloudParticipation,
} from "@/lib/trustCloud";
import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type {
  TrustCommunityContext,
  TrustObservation,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  customer?: string;
  orgId?: string;
  projects?: Project[];
  incidents?: Incident[];
  evidence?: EvidenceStub[];
  observations?: TrustObservation[];
  participation?: TrustParticipationRecord[];
  community?: TrustCommunityContext[];
};

/**
 * OD-3 — push browser tl-org-data rows to Cloud DocTypes (first live login migrate).
 * Requires live session (operator lockdown still applies to callers).
 */
export async function POST(request: Request) {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  if (!sid) {
    return NextResponse.json({ error: "Not logged in to live session" }, { status: 401 });
  }

  const gate = assertLiveOperatorAccess(email);
  if (!gate.ok) {
    return NextResponse.json(
      { error: operatorGateMessage(gate.reason) },
      { status: 403 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const bound = await bindSessionCustomer(email, body.customer, { sid });
  if (!bound.ok) {
    return NextResponse.json(
      { error: bound.error, code: bound.code },
      { status: bound.status },
    );
  }
  const customer = bound.customerName;

  const projects = body.projects || [];
  const incidents = body.incidents || [];
  const evidence = body.evidence || [];

  const results = {
    projects: [] as Array<{ id: string; ok: boolean; name?: string; error?: string }>,
    incidents: [] as Array<{ id: string; ok: boolean; name?: string; error?: string }>,
    evidence: [] as Array<{ id: string; ok: boolean; name?: string; error?: string }>,
    observations: [] as Array<{ id: string; ok: boolean; name?: string; error?: string }>,
    participation: [] as Array<{ id: string; ok: boolean; name?: string; error?: string }>,
    community: [] as Array<{ id: string; ok: boolean; name?: string; error?: string }>,
  };

  for (const project of projects) {
    const r = await createCloudProject(project, customer, body.orgId);
    results.projects.push({
      id: project.id,
      ok: r.ok,
      name: r.ok ? r.name : undefined,
      error: r.ok ? undefined : r.error,
    });
  }
  for (const incident of incidents) {
    const r = await createCloudIncident(incident, customer, body.orgId);
    results.incidents.push({
      id: incident.id,
      ok: r.ok,
      name: r.ok ? r.name : undefined,
      error: r.ok ? undefined : r.error,
    });
  }
  for (const row of evidence) {
    const r = await createCloudEvidence(row, customer, body.orgId);
    results.evidence.push({
      id: row.id,
      ok: r.ok,
      name: r.ok ? r.name : undefined,
      error: r.ok ? undefined : r.error,
    });
  }
  for (const row of body.observations || []) {
    const r = await upsertCloudObservation(row, customer, body.orgId);
    results.observations.push({
      id: row.id,
      ok: r.ok,
      name: r.ok ? r.name : undefined,
      error: r.ok ? undefined : r.error,
    });
  }
  for (const row of body.participation || []) {
    const r = await upsertCloudParticipation(row, customer, body.orgId);
    results.participation.push({
      id: row.id,
      ok: r.ok,
      name: r.ok ? r.name : undefined,
      error: r.ok ? undefined : r.error,
    });
  }
  for (const row of body.community || []) {
    const r = await upsertCloudCommunity(row, customer, body.orgId);
    results.community.push({
      id: row.id,
      ok: r.ok,
      name: r.ok ? r.name : undefined,
      error: r.ok ? undefined : r.error,
    });
  }

  const failed =
    results.projects.filter((x) => !x.ok).length +
    results.incidents.filter((x) => !x.ok).length +
    results.evidence.filter((x) => !x.ok).length +
    results.observations.filter((x) => !x.ok).length +
    results.participation.filter((x) => !x.ok).length +
    results.community.filter((x) => !x.ok).length;

  return NextResponse.json({
    ok: failed === 0,
    customer,
    orgId: body.orgId,
    counts: {
      projects: results.projects.length,
      incidents: results.incidents.length,
      evidence: results.evidence.length,
      observations: results.observations.length,
      participation: results.participation.length,
      community: results.community.length,
      failed,
    },
    results,
    message:
      failed === 0
        ? "Browser org data migrated to Cloud DocTypes."
        : `Migrated with ${failed} failure(s) — see results.`,
  });
}
