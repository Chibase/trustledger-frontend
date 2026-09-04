import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth";
import { FRAPPE_SID_COOKIE } from "@/lib/auth.constants";
import { getCloudProjectForCustomer } from "@/lib/productCloud";
import { bindSessionCustomer } from "@/lib/tenantScope";

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
