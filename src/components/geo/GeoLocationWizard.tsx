"use client";

import { useState } from "react";
import {
  GeoCascadePicker,
  labelFromGeoCtx,
} from "@/components/geo/GeoCascadePicker";
import type { IncidentGeoContext } from "@/types/incident";

type GeoLocationWizardProps = {
  open: boolean;
  countryCode?: string;
  countryName?: string;
  onClose: () => void;
  onComplete: (ctx: IncidentGeoContext, label: string) => void;
};

/**
 * Location dialog — sequential dropdown cascade
 * (Country → Province → Town → DM → TC → Ward) with add-if-missing.
 */
export function GeoLocationWizard({
  open,
  onClose,
  onComplete,
}: GeoLocationWizardProps) {
  const [draft, setDraft] = useState<IncidentGeoContext | null>(null);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleConfirm() {
    if (!draft?.wardId || !draft.wardName) {
      setError("Select a ward (or add one) to complete location.");
      return;
    }
    if (!draft.provinceName || !draft.municipalityName || !draft.districtName) {
      setError("Follow the sequence: Country → Province → Town → DM → TC → Ward.");
      return;
    }
    onComplete(draft, label || labelFromGeoCtx(draft));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="geo-wizard-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-tl-line bg-tl-surface shadow-lg"
      >
        <div className="border-b border-tl-line px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
            Site location
          </p>
          <h2
            id="geo-wizard-title"
            className="mt-1 font-display text-xl font-semibold text-tl-ink"
          >
            Country → Province → Town → DM → TC → Ward
          </h2>
          <p className="mt-1 text-sm text-tl-ink-muted">
            Pick from pre-injected place data. Use “Add if not listed” when yours
            is missing.
          </p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <GeoCascadePicker
            onChange={(ctx, nextLabel) => {
              setDraft(ctx);
              setLabel(nextLabel);
              setError(null);
            }}
          />
          {error ? <p className="mt-3 text-sm text-tl-danger">{error}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 border-t border-tl-line px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-tl-line px-3 py-2 text-sm hover:bg-tl-paper"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="ml-auto rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
          >
            Confirm location
          </button>
        </div>
      </div>
    </div>
  );
}
