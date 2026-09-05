import { NextResponse } from "next/server";
import { requirePlanOwnerSession } from "@/lib/livePlanOwner";
import { inviteEmailDeliveryReady } from "@/lib/transactionalEmail";

/** Plan Owner check: can third-party invite emails leave the box? */
export async function GET() {
  const ownerGate = await requirePlanOwnerSession();
  if (!ownerGate.ok) {
    return NextResponse.json(
      { error: "Plan Owner session required" },
      { status: ownerGate.status },
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
