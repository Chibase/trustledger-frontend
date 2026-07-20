import { PayCheckoutForm } from "@/components/pay/PayCheckoutForm";
import {
  getPaystackPlans,
  type PaystackPlanId,
} from "@/lib/paystackPlans";
import { paystackConfigured } from "@/lib/paystackServer";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    plan?: string;
    email?: string;
    name?: string;
    organization?: string;
  }>;
};

export default async function PayPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const plans = getPaystackPlans();
  const requested = (params.plan || "practitioner") as PaystackPlanId;
  const initialPlan = plans.some((p) => p.id === requested)
    ? requested
    : "practitioner";

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-sm font-medium text-tl-trust">TrustLedger checkout</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-tl-ink">
        Pay securely with Paystack
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        WordPress products and Start trial link here. After payment, Ops /
        Finance is notified; CRM Customer access is confirmed manually for soft
        launch.
      </p>

      <PayCheckoutForm
        plans={plans}
        initialPlan={initialPlan}
        configured={paystackConfigured()}
        initialEmail={params.email?.trim() || ""}
        initialName={params.name?.trim() || ""}
        initialOrganization={params.organization?.trim() || ""}
      />

      <p className="mt-4 text-xs text-tl-ink-muted">
        Card details are entered on Paystack — never on this page. Use Paystack
        test keys until go-live.
      </p>
    </main>
  );
}
