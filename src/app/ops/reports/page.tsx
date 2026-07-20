import Link from "next/link";

export default function OpsReportsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-medium text-tl-trust">Command centre</p>
        <h1 className="mt-1 font-display text-3xl font-semibold">Reports</h1>
        <p className="mt-2 max-w-2xl text-sm text-tl-ink-muted">
          Analytical pulls of client/visitor activity — intake, feedback,
          readiness, support, billing. Not project or issue reports. Packet 23b
          adds filters and CSV export.
        </p>
      </header>

      <ul className="space-y-3 text-sm">
        {[
          {
            title: "Intake & visitor signals",
            body: "All CRM Lead sources, job-title signals, UTM/context from comments.",
          },
          {
            title: "Experience feedback",
            body: "Ratings 1–5, weak experience queue, qualitative notes.",
          },
          {
            title: "Assessment readiness",
            body: "Score bands and priorities from assessment unlocks.",
          },
          {
            title: "Support & billing",
            body: "Tickets and Paystack/invoice status (as entitlements land).",
          },
        ].map((item) => (
          <li
            key={item.title}
            className="rounded-lg border border-tl-line bg-tl-surface px-4 py-3"
          >
            <p className="font-semibold">{item.title}</p>
            <p className="mt-1 text-tl-ink-muted">{item.body}</p>
            <p className="mt-2 text-xs text-tl-amber">Coming in next Ops packet</p>
          </li>
        ))}
      </ul>

      <p className="text-sm">
        <Link href="/ops" className="font-medium text-tl-trust-ink underline">
          Back to overview
        </Link>
      </p>
    </div>
  );
}
