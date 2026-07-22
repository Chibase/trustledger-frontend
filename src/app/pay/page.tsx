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
    mode?: string;
  }>;
};

export default async function PayPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const plans = getPaystackPlans();
  const requested = (params.plan || "practitioner") as PaystackPlanId;
  const initialPlan = plans.some((p) => p.id === requested)
    ? requested
    : "practitioner";
  const initialMode =
    params.mode === "pay_now" ? "pay_now" : "trial_authorize";

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <p className="text-sm font-medium text-tl-trust">TrustLedger subscribe</p>
      <h1 className="mt-1 font-display text-3xl font-semibold text-tl-ink">
        Start your 14-day trial
      </h1>
      <p className="mt-2 text-sm text-tl-ink-muted">
        Pick a plan, verify your banking details on Paystack, and your trial
        activates immediately. We keep the card on file for the first charge at
        the end of the trial — cancel anytime before then to stop billing. Login
        details are emailed after confirmation.
      </p>

      <PayCheckoutForm
        plans={plans}
        initialPlan={initialPlan}
        configured={paystackConfigured()}
        initialEmail={params.email?.trim() || ""}
        initialName={params.name?.trim() || ""}
        initialOrganization={params.organization?.trim() || ""}
        initialMode={initialMode}
      />

      <p className="mt-4 text-xs text-tl-ink-muted">
        Card and bank details are entered on Paystack — never on this page. Use
        Paystack test keys until go-live. A small verification amount confirms
        the card; the plan price is charged only after the trial unless you
        opt out.
      </p>
    </main>
  );
}
