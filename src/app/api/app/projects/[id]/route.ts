import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCustomerEntitlementByOwnerEmail } from "@/lib/entitlementCloud";
import { getCloudProjectForCustomer } from "@/lib/productCloud";

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

  const ent = await getCustomerEntitlementByOwnerEmail(user.email);
  if (!ent?.customerName) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const found = await getCloudProjectForCustomer(ent.customerName, id);
  if (!found.ok) {
    return NextResponse.json({ error: found.error }, { status: 502 });
  }
  if (!found.project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project: found.project });
}
