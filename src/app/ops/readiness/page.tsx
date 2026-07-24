import { OperationalReadinessPanel } from "@/components/ops/OperationalReadinessPanel";
import { buildOperationalReadiness } from "@/lib/operationalDelivery";

export const dynamic = "force-dynamic";

export default function OpsReadinessPage() {
  const initial = buildOperationalReadiness();
  return <OperationalReadinessPanel initial={initial} />;
}
