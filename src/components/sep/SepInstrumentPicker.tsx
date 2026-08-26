"use client";

import { SEP_INSTRUMENT_CATALOG } from "@/lib/sepInstruments";

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
};

export function SepInstrumentPicker({ selected, onChange }: Props) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 block text-sm font-medium text-tl-ink">
        Client requirements / instruments
      </legend>
      <p className="text-xs text-tl-ink-muted">
        Tick only what the client or briefing named (NEMA, IFC, SLP, WULA,
        PPPFA, SPLUMA). The composer will not invent a statute.
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {SEP_INSTRUMENT_CATALOG.map((row) => {
          const checked = selected.includes(row.id);
          return (
            <li key={row.id}>
              <label className="flex cursor-pointer items-start gap-2 rounded-md border border-tl-line px-3 py-2 text-sm hover:bg-tl-paper">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={checked}
                  onChange={() => {
                    onChange(
                      checked
                        ? selected.filter((id) => id !== row.id)
                        : [...selected, row.id],
                    );
                  }}
                />
                <span>
                  <span className="block font-medium text-tl-ink">
                    {row.label}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
