import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  FRAPPE_SID_COOKIE,
  TL_ORG_OWNER_COOKIE,
} from "@/lib/auth.constants";
import { liveOwnerDenied, requireLivePlanOwner } from "@/lib/planOwnerAccess";
import { inviteEmailDeliveryReady } from "@/lib/transactionalEmail";

/** Plan Owner check: can third-party invite emails leave the box? */
export async function GET() {
  const jar = await cookies();
  const sid = jar.get(FRAPPE_SID_COOKIE)?.value;
  if (sid) {
    const owner = await requireLivePlanOwner();
    if (!owner.ok) return liveOwnerDenied(owner);
  } else if (jar.get(TL_ORG_OWNER_COOKIE)?.value !== "1") {
    return NextResponse.json(
      { error: "Plan Owner session required" },
      { status: 401 },
    );
  }

  const delivery = await inviteEmailDeliveryReady();
  return NextResponse.json(
    {
      ready: delivery.ready,
      from: delivery.from,
      source: delivery.source,
      verifiedDomains: delivery.verifiedDomains,
      reason: delivery.reason ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
