import Link from "next/link";
import { formatZar, PLANS } from "@/config/plans";

export default function Home() {
  const starter = PLANS.starter;
  const growth = PLANS.growth;

  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-16">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-tl-ink">
        Stakeholder trust you can operationalise
      </h1>
      <p className="mt-4 max-w-xl text-base text-tl-ink-muted">
        Start a 14-day trial with sample data — no login. Email is only asked when
        you print or save. Plans from{" "}
        {starter.monthlyLaunchZar != null
          ? formatZar(starter.monthlyLaunchZar)
          : "—"}
        /mo (Starter) and{" "}
        {growth.monthlyLaunchZar != null
          ? formatZar(growth.monthlyLaunchZar)
          : "—"}
        /mo (Growth), excl. VAT.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/demo?utm_source=app&utm_medium=cta&utm_campaign=trial_14day"
          className="rounded-md bg-tl-trust px-5 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Start 14-day trial
        </Link>
        <a
          href="mailto:hello@trustledger.co.za?subject=TrustLedger%20enquiry"
          className="rounded-md border border-tl-line bg-tl-surface px-5 py-2.5 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          Contact us
        </a>
      </div>
      <p className="mt-6 text-xs text-tl-ink-muted">
        Staff live access:{" "}
        <Link href="/login/live" className="underline">
          /login/live
        </Link>
      </p>
    </main>
  );
}
