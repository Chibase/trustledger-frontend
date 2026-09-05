import type { Metadata } from "next";
import Link from "next/link";
import { PURGE_SLA_DAYS } from "@/lib/legal/subprocessors";

export const metadata: Metadata = {
  title: "DPA Trust Pack (template) — TrustLedger",
  description:
    "POPIA-aware processor terms template for Project+ Trust Pack. Not executed until countersigned.",
  alternates: { canonical: "/legal/dpa" },
};

export default function DpaTemplatePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-medium text-tl-trust">Legal template</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Data processing terms (Trust Pack)
      </h1>
      <p className="mt-3 rounded-md border border-tl-amber/40 bg-tl-amber/10 px-3 py-2 text-sm text-tl-ink">
        This is a <strong>template</strong> for Project+ and Institutional
        scoping. It is <strong>not executed</strong> until both parties
        countersign. It is not legal advice and does not claim ISO 27001 or
        SOC 2.
      </p>
      <article className="prose prose-sm mt-8 max-w-none space-y-4 text-sm leading-relaxed text-tl-ink">
        <h2 className="font-display text-lg font-semibold">1. Parties and roles</h2>
        <p>
          The customer is the responsible party (POPIA) for personal information
          it loads into TrustLedger. Chibase Consulting, trading as TrustLedger,
          is the operator / processor for that information while the workspace
          is live.
        </p>
        <h2 className="font-display text-lg font-semibold">2. Purpose</h2>
        <p>
          Processing is limited to providing the TrustLedger workspace: grievance
          desk, entitled Stakeholder Intelligence modules, billing, and
          operator support. We do not sell customer content and do not use it
          to train external foundation models.
        </p>
        <h2 className="font-display text-lg font-semibold">3. Instructions</h2>
        <p>
          We process only on documented instructions: product use, support
          tickets you open, and legal obligation. AI Assist only suggests; a
          human must apply before anything is saved.
        </p>
        <h2 className="font-display text-lg font-semibold">4. Security</h2>
        <p>
          Live access is bound per organisation on the server (Plan Owner and
          accepted Cloud teammates). Platform operators are allowlisted.
          Connections are encrypted in transit. This is not a dedicated private
          cloud unless an Isolation order is in force.
        </p>
        <h2 className="font-display text-lg font-semibold">5. Subprocessors</h2>
        <p>
          Current processors are listed at{" "}
          <Link href="/legal/subprocessors" className="text-tl-trust-ink underline">
            /legal/subprocessors
          </Link>
          . Material changes will be posted there.
        </p>
        <h2 className="font-display text-lg font-semibold">6. Retention and deletion</h2>
        <p>
          After a verified deletion request, the target to complete purge of
          Customer records and linked Cloud Users is {PURGE_SLA_DAYS} days,
          unless a longer legal hold applies. Browser-only trial data is deleted
          by clearing that device; it is not a Cloud Customer until provisioned.
        </p>
        <h2 className="font-display text-lg font-semibold">7. International transfers</h2>
        <p>
          Some processors may store or process outside South Africa. The
          subprocessors page states the role of each. Contact us if a residency
          constraint requires an Isolation quote.
        </p>
        <h2 className="font-display text-lg font-semibold">8. Execution</h2>
        <p>
          Replace this paragraph with signature blocks when a Project or
          Institutional order includes the Trust Pack. Until then, this page is
          information only. Full operator copy:{" "}
          <code className="font-mono text-xs">docs/DPA_TRUST_PACK.md</code>.
        </p>
      </article>
      <p className="mt-8 text-sm">
        <Link
          href="/legal/subprocessors"
          className="font-medium text-tl-trust-ink underline"
        >
          Subprocessors
        </Link>
        {" · "}
        <Link href="/contact" className="font-medium text-tl-trust-ink underline">
          Contact
        </Link>
      </p>
    </main>
  );
}
