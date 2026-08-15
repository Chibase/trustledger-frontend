import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCustomerEntitlementByOwnerEmail } from "@/lib/entitlementCloud";
import { isVipCustomerName } from "@/lib/planLabel";
import {
  createCloudProject,
  getCloudProjectForCustomer,
  listCloudProjectsForCustomer,
} from "@/lib/productCloud";
import type { Project, ProjectStatus } from "@/types/project";

function createProjectCode(): string {
  return `PRJ-${Date.now().toString(36).toUpperCase().slice(-8)}`;
}

/** List Cloud projects for the signed-in live Owner (VIP / paid). */
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.mode !== "live" || !user.email) {
    return NextResponse.json({ error: "Live sign-in required" }, { status: 401 });
  }
  const ent = await getCustomerEntitlementByOwnerEmail(user.email);
  if (!ent?.customerName) {
    return NextResponse.json({ projects: [] });
  }
  const listed = await listCloudProjectsForCustomer(ent.customerName);
  if (!listed.ok) {
    return NextResponse.json({ error: listed.error }, { status: 502 });
  }
  return NextResponse.json({ projects: listed.projects });
}

/** Create a TL Project for the signed-in live Owner (VIP can add projects). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.mode !== "live" || !user.email) {
    return NextResponse.json({ error: "Live sign-in required" }, { status: 401 });
  }
  if (user.isPlanOwner === false) {
    return NextResponse.json(
      { error: "Only the Plan Owner can create projects." },
      { status: 403 },
    );
  }

  let body: {
    name?: string;
    clientFunder?: string;
    ward?: string;
    municipality?: string;
    status?: ProjectStatus;
    publicSummary?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = (body.name || "").trim();
  if (name.length < 2) {
    return NextResponse.json(
      { error: "Project name is required (at least 2 characters)." },
      { status: 400 },
    );
  }

  const ent = await getCustomerEntitlementByOwnerEmail(user.email);
  if (!ent?.customerName) {
    return NextResponse.json(
      {
        error:
          "No TrustLedger Cloud Customer linked to this login. Ask Ops to provision VIP or Owner access.",
      },
      { status: 400 },
    );
  }

  const vip =
    isVipCustomerName(ent.customerLabel) ||
    isVipCustomerName(ent.customerName);

  const existing = await listCloudProjectsForCustomer(ent.customerName);
  if (!existing.ok) {
    return NextResponse.json({ error: existing.error }, { status: 502 });
  }
  // VIP complimentary = Institutional (unlimited). Paid plans keep Cloud limits.
  // Do not trust client tl-vip cookie for limit bypass — Cloud Customer name only.
  if (
    !vip &&
    ent.projectLimit != null &&
    ent.projectLimit >= 0 &&
    existing.projects.length >= ent.projectLimit
  ) {
    return NextResponse.json(
      {
        error: `Project limit reached (${ent.projectLimit}). Upgrade plan or archive a project.`,
      },
      { status: 403 },
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const project: Project = {
    id: createProjectCode(),
    name,
    clientFunder: (body.clientFunder || "").trim(),
    budgetTotal: 0,
    budgetSpent: 0,
    ward: (body.ward || "").trim(),
    municipality: (body.municipality || "").trim(),
    status: body.status || "Active",
    contractorName: "",
    startDate: today,
    targetEndDate: today,
    publicSummary: (body.publicSummary || "").trim(),
  };

  const created = await createCloudProject(project, ent.customerName);
  if (!created.ok) {
    return NextResponse.json({ error: created.error }, { status: 502 });
  }

  let saved: Project = project;
  const byCode = await getCloudProjectForCustomer(ent.customerName, project.id);
  if (byCode.ok && byCode.project) {
    saved = byCode.project;
  } else {
    const byName = await getCloudProjectForCustomer(
      ent.customerName,
      created.name,
    );
    if (byName.ok && byName.project) saved = byName.project;
  }

  return NextResponse.json({
    ok: true,
    project: saved,
    cloudName: created.name,
  });
}
