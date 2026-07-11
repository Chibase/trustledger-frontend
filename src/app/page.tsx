import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-4 py-16">
      <p className="text-sm font-medium text-tl-trust">TrustLedger</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-tl-ink">
        Stakeholder trust you can operationalise
      </h1>
      <p className="mt-4 max-w-xl text-base text-tl-ink-muted">
        Role-based dashboards for community, contractors, clients, and admins —
        with assisted intake and governance briefs. Explore the interactive demo
        on sample data.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/demo"
          className="rounded-md bg-tl-trust px-5 py-2.5 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Try the demo
        </Link>
        <a
          href="mailto:hello@trustledger.co.za?subject=TrustLedger%20enquiry"
          className="rounded-md border border-tl-line bg-tl-surface px-5 py-2.5 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          Contact us
        </a>
      </div>
    </main>
  );
}
