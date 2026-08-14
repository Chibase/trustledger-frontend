import type { Metadata } from "next";
import { FirmContactForm } from "@/components/chibase/FirmContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "A short note. No CAPEX questionnaire on first contact.",
};

export default function FirmContactPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-tl-ink">
        Talk to Chibase
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-tl-ink-muted">
        Name, work email, and what you need. If you want the software only,
        the TrustLedger trial does not require this form.
      </p>
      <div className="mt-8">
        <FirmContactForm />
      </div>
    </div>
  );
}
