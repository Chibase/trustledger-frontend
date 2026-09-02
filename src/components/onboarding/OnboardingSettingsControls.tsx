"use client";

import Link from "next/link";
import { requestOnboardingWizard } from "@/lib/onboardingGuide";

type OnboardingSettingsControlsProps = {
  isVip?: boolean;
};

/** Settings strip — reopen wizard / open Guide. */
export function OnboardingSettingsControls({
  isVip = false,
}: OnboardingSettingsControlsProps) {
  return (
    <section className="rounded-lg border border-tl-line bg-tl-paper px-4 py-3">
      <h2 className="font-display text-lg font-semibold text-tl-ink">
        User guide
      </h2>
      <p className="mt-1 text-sm text-tl-ink-muted">
        First-time setup wizard and seeding checklist for your SRM desk.
        {isVip
          ? " VIP showcase walks the preloaded NCGR-B programme — launch the wizard anytime."
          : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => requestOnboardingWizard()}
          className="rounded-md bg-tl-trust px-3 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          Launch setup wizard
        </button>
        <Link
          href="/app/guide"
          className="rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm font-medium text-tl-ink hover:bg-tl-paper"
        >
          Open Guide
        </Link>
      </div>
    </section>
  );
}
