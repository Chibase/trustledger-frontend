import { NextResponse } from "next/server";
import { getPaystackPlans } from "@/lib/paystackPlans";
import { paystackConfigured } from "@/lib/paystackServer";

export async function GET() {
  return NextResponse.json({
    configured: paystackConfigured(),
    plans: getPaystackPlans(),
  });
}
