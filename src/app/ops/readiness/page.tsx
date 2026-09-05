import { AcquisitionOpsPanel } from "@/components/ops/AcquisitionOpsPanel";
import { OperationalReadinessPanel } from "@/components/ops/OperationalReadinessPanel";
import { TenancySmokePanel } from "@/components/ops/TenancySmokePanel";
import { buildOperationalReadiness } from "@/lib/operationalDelivery";

export const dynamic = "force-dynamic";

export default function OpsReadinessPage() {
  const initial = buildOperationalReadiness();
  return (
    <div className="space-y-8">
      <OperationalReadinessPanel initial={initial} />
      <TenancySmokePanel />
      <AcquisitionOpsPanel />
    </div>
  );
}
