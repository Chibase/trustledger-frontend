import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  createCloudEvidence,
  createCloudIncident,
  createCloudProject,
} from "@/lib/productCloud";
import {
  createCloudCommitment,
  createCloudEngagement,
  createCloudStakeholder,
} from "@/lib/siCloud";
import { createCloudEngagementPlan } from "@/lib/sepCloud";
import {
  upsertCloudCommunity,
  upsertCloudObservation,
  upsertCloudParticipation,
  upsertCloudVerification,
} from "@/lib/trustCloud";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import type { Commitment } from "@/types/commitment";
import type { Engagement, EvidenceStub } from "@/types/engagement";
import type { EngagementPlan } from "@/types/engagementPlan";
import type { SepExecutionOverlay } from "@/types/sepExecution";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";
import type { Stakeholder } from "@/types/stakeholder";
import type { TrustClaimVerificationStamp } from "@/lib/trust/claimVerification";
import type {
  TrustCommunityContext,
  TrustObservation,
  TrustParticipationRecord,
} from "@/types/trustLayer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  kind?:
    | "project"
    | "incident"
    | "evidence"
    | "stakeholder"
    | "engagement"
    | "commitment"
    | "sep"
    | "observation"
    | "participation"
    | "community"
    | "verification";
  customer?: string;
  orgId?: string;
  project?: Project;
  incident?: Incident;
  evidence?: EvidenceStub;
  stakeholder?: Stakeholder;
  engagement?: Engagement;
  commitment?: Commitment;
  plan?: EngagementPlan;
  overlay?: SepExecutionOverlay | null;
  observation?: TrustObservation;
  participation?: TrustParticipationRecord;
  community?: TrustCommunityContext;
  verification?: TrustClaimVerificationStamp;
  fileUrl?: string;
};

/** OD-2 Ops smoke — create one product row on Cloud under a Customer. */
export async function POST(request: Request) {
  if (!isFrappeOwnerIssuanceEnabled()) {
    return NextResponse.json(
      { error: "FRAPPE_OWNER_ISSUANCE is off." },
      { status: 403 },
    );
  }

  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(email);
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

  const customer = (body.customer || "").trim();
  if (!customer) {
    return NextResponse.json(
      { error: "customer (Frappe Customer name) required" },
      { status: 400 },
    );
  }

  if (body.kind === "project" && body.project) {
    const result = await createCloudProject(body.project, customer, body.orgId);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "incident" && body.incident) {
    const result = await createCloudIncident(body.incident, customer, body.orgId);
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "evidence" && body.evidence) {
    const result = await createCloudEvidence(
      body.evidence,
      customer,
      body.orgId,
      body.fileUrl,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "stakeholder" && body.stakeholder) {
    const result = await createCloudStakeholder(
      body.stakeholder,
      customer,
      body.orgId,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "engagement" && body.engagement) {
    const result = await createCloudEngagement(
      body.engagement,
      customer,
      body.orgId,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "commitment" && body.commitment) {
    const result = await createCloudCommitment(
      body.commitment,
      customer,
      body.orgId,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "sep" && body.plan) {
    const result = await createCloudEngagementPlan(body.plan, customer, {
      orgId: body.orgId,
      overlay: body.overlay ?? null,
      includeExecution: body.overlay != null,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "observation" && body.observation) {
    const result = await upsertCloudObservation(
      body.observation,
      customer,
      body.orgId,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "participation" && body.participation) {
    const result = await upsertCloudParticipation(
      body.participation,
      customer,
      body.orgId,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "community" && body.community) {
    const result = await upsertCloudCommunity(
      body.community,
      customer,
      body.orgId,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }
  if (body.kind === "verification" && body.verification) {
    const result = await upsertCloudVerification(
      body.verification,
      customer,
      body.orgId,
    );
    return NextResponse.json(result, { status: result.ok ? 200 : 502 });
  }

  return NextResponse.json(
    {
      error:
        "kind + matching payload required (project|incident|evidence|stakeholder|engagement|commitment|sep|observation|participation|community|verification)",
    },
    { status: 400 },
  );
}
