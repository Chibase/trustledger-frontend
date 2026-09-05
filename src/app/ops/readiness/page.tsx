import { AcquisitionOpsPanel } from "@/components/ops/AcquisitionOpsPanel";
import { OperatorSittingPanel } from "@/components/ops/OperatorSittingPanel";
import { OperationalReadinessPanel } from "@/components/ops/OperationalReadinessPanel";
import { TenancySmokePanel } from "@/components/ops/TenancySmokePanel";
import { buildOperationalReadiness } from "@/lib/operationalDelivery";
import { buildOperatorSitting } from "@/lib/operatorSitting";

export const dynamic = "force-dynamic";

export default function OpsReadinessPage() {
  const initial = buildOperationalReadiness();
  const sitting = buildOperatorSitting();
  return (
    <div className="space-y-8">
      <OperationalReadinessPanel initial={initial} />
      <OperatorSittingPanel initial={sitting} />
      <TenancySmokePanel />
      <AcquisitionOpsPanel />
    </div>
  );
}
