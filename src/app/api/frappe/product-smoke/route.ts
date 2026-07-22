import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import {
  createCloudEvidence,
  createCloudIncident,
  createCloudProject,
} from "@/lib/productCloud";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  assertLiveOperatorAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";
import type { EvidenceStub } from "@/types/engagement";
import type { Incident } from "@/types/incident";
import type { Project } from "@/types/project";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  kind?: "project" | "incident" | "evidence";
  customer?: string;
  orgId?: string;
  project?: Project;
  incident?: Incident;
  evidence?: EvidenceStub;
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

  return NextResponse.json(
    { error: "kind + matching payload required (project|incident|evidence)" },
    { status: 400 },
  );
}
