import { cookies } from "next/headers";
import { TL_USER_EMAIL_COOKIE } from "@/lib/auth.constants";
import { buildOpsOverview, type OpsActivityKind } from "@/lib/opsIntel";
import { filterOpsActivityRows, opsActivityToCsv } from "@/lib/opsReports";
import {
  assertOpsAccess,
  operatorGateMessage,
} from "@/lib/platformOperator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS: Array<OpsActivityKind | "all"> = [
  "all",
  "demo",
  "assessment",
  "feedback",
  "contact",
  "quote",
  "support",
  "other",
];

export async function GET(request: Request) {
  const jar = await cookies();
  const email = jar.get(TL_USER_EMAIL_COOKIE)?.value;
  const gate = assertOpsAccess(email);
  if (!gate.ok) {
    return new Response(operatorGateMessage(gate.reason), { status: 403 });
  }
  const url = new URL(request.url);
  const typeRaw = (url.searchParams.get("type") || "all").toLowerCase();
  const type = (
    KINDS.includes(typeRaw as OpsActivityKind | "all") ? typeRaw : "all"
  ) as OpsActivityKind | "all";
  const source = url.searchParams.get("source") || "";
  const q = url.searchParams.get("q") || "";
  const data = await buildOpsOverview();
  const rows = filterOpsActivityRows(data.intake.recent, {
    activity: type,
    source,
    q,
  });
  const csv = opsActivityToCsv(rows);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="trustledger-ops-activity.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
