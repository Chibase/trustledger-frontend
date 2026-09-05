import type { Metadata } from "next";
import Link from "next/link";
import {
  PURGE_SLA_DAYS,
  SUBPROCESSORS,
} from "@/lib/legal/subprocessors";
import { SITE_URL } from "@/lib/aeo/siteFacts";

export const metadata: Metadata = {
  title: "Subprocessors — TrustLedger",
  description:
    "Processors that handle TrustLedger Cloud customer data, and how to request deletion.",
  alternates: { canonical: "/legal/subprocessors" },
};

export default function SubprocessorsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-medium text-tl-trust">Legal notice</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-tl-ink">
        Subprocessors
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-tl-ink-muted">
        This page names organisations that process personal information on
        behalf of TrustLedger (operator: Chibase Consulting) when you use a live
        or trial workspace. It is not a product brochure. Marketing, FAQ, and
        public agents do not list these names.
      </p>
      <div className="mt-8 overflow-x-auto rounded-lg border border-tl-line bg-tl-surface">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-tl-line text-xs uppercase tracking-wide text-tl-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Processor</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Region</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-tl-line">
            {SUBPROCESSORS.map((row) => (
              <tr key={row.name}>
                <td className="px-4 py-3 font-medium">{row.name}</td>
                <td className="px-4 py-3 text-tl-ink-muted">{row.role}</td>
                <td className="px-4 py-3 text-tl-ink-muted">{row.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-6 text-sm text-tl-ink-muted">
        Deletion target after a verified request: {PURGE_SLA_DAYS} days (VIP
        terms). Operator runbook:{" "}
        <code className="font-mono text-xs">docs/PURGE_RUNBOOK.md</code>.
      </p>
      <p className="mt-4 text-sm">
        <Link href="/legal/dpa" className="font-medium text-tl-trust-ink underline">
          DPA Trust Pack template
        </Link>
        {" · "}
        <Link href="/" className="font-medium text-tl-trust-ink underline">
          Home
        </Link>
        {" · "}
        <a
          href={`${SITE_URL}/contact`}
          className="font-medium text-tl-trust-ink underline"
        >
          Contact
        </a>
      </p>
    </main>
  );
}
