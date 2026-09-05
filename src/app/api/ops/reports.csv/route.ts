import { buildOpsOverview, type OpsActivityKind } from "@/lib/opsIntel";
import { filterOpsActivityRows, opsActivityToCsv } from "@/lib/opsReports";
import { opsDenied, requireOpsLiveSession } from "@/lib/opsSession";

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
  const session = await requireOpsLiveSession();
  if (!session.ok) return opsDenied(session, { text: true });
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
