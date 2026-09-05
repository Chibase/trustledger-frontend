import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { FRAPPE_SID_COOKIE } from "@/lib/auth.constants";
import {
  getCloudProjectForCustomer,
  mergeProjectCloudPutFallback,
  upsertCloudProject,
} from "@/lib/productCloud";
import { bindSessionCustomer } from "@/lib/tenantScope";
import type { Project } from "@/types/project";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** Fetch one Cloud TL Project for the signed-in live Owner (by code or name). */
export async function GET(_request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user || user.mode !== "live" || !user.email) {
    return NextResponse.json({ error: "Live sign-in required" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = decodeURIComponent(rawId || "").trim();
  if (!id) {
    return NextResponse.json({ error: "Project id required" }, { status: 400 });
  }

  const jar = await cookies();
  const bound = await bindSessionCustomer(user.email, null, {
    sid: jar.get(FRAPPE_SID_COOKIE)?.value,
  });
  if (!bound.ok) {
    return NextResponse.json(
      { error: bound.status === 404 ? "Project not found" : bound.error },
      { status: bound.status === 404 ? 404 : bound.status },
    );
  }

  const found = await getCloudProjectForCustomer(bound.customerName, id);
  if (!found.ok) {
    return NextResponse.json({ error: found.error }, { status: 502 });
  }
  if (!found.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project: found.project });
}

/**
 * Update an existing TL Project for the signed-in live session.
 * Create stays Plan Owner-only on POST /api/app/projects; any bound live user may save edits.
 */
export async function PUT(request: Request, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user || user.mode !== "live" || !user.email) {
    return NextResponse.json({ error: "Live sign-in required" }, { status: 401 });
  }

  const { id: rawId } = await context.params;
  const id = decodeURIComponent(rawId || "").trim();
  if (!id) {
    return NextResponse.json({ error: "Project id required" }, { status: 400 });
  }

  let body: { project?: Project };
  try {
    body = (await request.json()) as { project?: Project };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const incoming = body.project;
  if (!incoming?.id || !incoming.name) {
    return NextResponse.json(
      { error: "project.id and name required" },
      { status: 400 },
    );
  }
  if (incoming.id !== id) {
    return NextResponse.json(
      { error: "project.id must match the URL" },
      { status: 400 },
    );
  }

  const jar = await cookies();
  const bound = await bindSessionCustomer(user.email, null, {
    sid: jar.get(FRAPPE_SID_COOKIE)?.value,
  });
  if (!bound.ok) {
    return NextResponse.json(
      {
        error:
          bound.status === 404
            ? "No TrustLedger Cloud organisation is linked to this login."
            : bound.error,
        code: bound.code,
      },
      { status: bound.status === 404 ? 400 : bound.status },
    );
  }

  const existing = await getCloudProjectForCustomer(bound.customerName, id);
  if (!existing.ok) {
    return NextResponse.json({ error: existing.error }, { status: 502 });
  }
  if (!existing.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const upserted = await upsertCloudProject(incoming, bound.customerName);
  if (!upserted.ok) {
    return NextResponse.json({ error: upserted.error }, { status: 502 });
  }

  let saved: Project = mergeProjectCloudPutFallback(
    existing.project,
    incoming,
  );
  const refreshed = await getCloudProjectForCustomer(
    bound.customerName,
    incoming.id,
  );
  if (refreshed.ok && refreshed.project) {
    saved = refreshed.project;
  }

  return NextResponse.json({
    ok: true,
    project: saved,
    cloudName: upserted.name,
  });
}
