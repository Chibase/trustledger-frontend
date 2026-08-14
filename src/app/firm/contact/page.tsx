import type { Metadata } from "next";
import { FirmContactForm } from "@/components/chibase/FirmContactForm";
import { chibasePackageCopy } from "@/lib/chibase/packages";

export const metadata: Metadata = {
  title: "Contact",
  description: "A short note. No CAPEX questionnaire on first contact.",
};

type PageProps = {
  searchParams?: Promise<{ package?: string }>;
};

export default async function FirmContactPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const requested = chibasePackageCopy(params.package);
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-tl-ink">
        Talk to Chibase
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-tl-ink-muted">
        Name, work email, and what you need. If you want the software only,
        the TrustLedger trial does not require this form.
      </p>
      {requested ? (
        <p className="mt-4 rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm text-tl-ink">
          You asked about <strong>{requested.label}</strong> — a Chibase
          Consulting package, not a TrustLedger software plan.
        </p>
      ) : null}
      <div className="mt-8">
        <FirmContactForm initialPackage={requested} />
      </div>
    </div>
  );
}
