import Link from "next/link";
import { ProvisionOwnerPanel } from "@/components/ops/ProvisionOwnerPanel";
import { getCurrentUser } from "@/lib/auth";
import { isFrappeOwnerIssuanceEnabled } from "@/lib/frappeSoT";
import {
  isPlatformOperatorIdentity,
  isPlatformOperatorOnly,
} from "@/lib/platformOperator";

export const dynamic = "force-dynamic";

export default async function OpsAccountsPage() {
  const user = await getCurrentUser();
  const isOperator =
    Boolean(user?.email) && isPlatformOperatorIdentity(user?.email);
  const issuanceOn = isFrappeOwnerIssuanceEnabled();
  const lockdown = isPlatformOperatorOnly();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command centre</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Accounts</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Control client accounts and Step 1 Plan Owner provision. Buyers stay
          on trial/browser tenancy while ADR-013 lockdown is on. Track the full
          ladder on{" "}
          <Link
            href="/ops/readiness"
            className="font-medium text-tl-trust-ink underline"
          >
            Delivery readiness
          </Link>
          .
        </p>
      </header>

      <div className="rounded-lg border border-tl-line bg-tl-surface p-5 text-sm text-tl-ink-muted">
        <p>
          Issuance flag:{" "}
          <span className="font-medium text-tl-ink">
            FRAPPE_OWNER_ISSUANCE={issuanceOn ? "1" : "0"}
          </span>
          {" · "}
          Lockdown:{" "}
          <span className="font-medium text-tl-ink">
            {lockdown ? "ON" : "OFF"}
          </span>
          . See <code className="text-tl-ink">docs/FRAPPE_SOT.md</code> and{" "}
          <code className="text-tl-ink">docs/OPERATIONAL_DELIVERY.md</code>.
        </p>
      </div>

      {isOperator ? (
        <ProvisionOwnerPanel
          isOperator
          defaultEmail={user?.email}
          defaultName={user?.name}
          defaultPlanId={user?.trialPlan}
          defaultOrg={undefined}
          orgId={user?.orgId}
        />
      ) : (
        <p className="text-sm text-tl-ink-muted">
          Sign in as Platform Operator to run provision drafts.
        </p>
      )}

      <p className="text-sm">
        <Link href="/ops" className="font-medium text-tl-trust-ink underline">
          Back to overview
        </Link>
      </p>
    </div>
  );
}
