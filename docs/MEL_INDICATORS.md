# MEL-1 — expected vs actual on projects and commitments

**Packet:** MEL-1. **Not** a standalone product (ADR-054). **Not** `addon_mel`.  
**Not in this packet:** Root-cause tags: `docs/MEL_ROOT_CAUSE.md` (MEL-2). Learn & Adapt: `docs/MEL_LEARN_ADAPT.md` (MEL-3). Retrospectives: `docs/MEL_RETROSPECTIVE.md` (MEL-4).

## What it is

Named **expected vs actual** figures:

- On **TL Project**: a JSON list (`mel_json`) of indicators (label, unit, expected, actual, optional commitment id).
- On **TL Commitment**: `expected_value`, `actual_value`, `mel_unit`.

A gap (actual below expected) is a **watch** on the executive dashboard and project desk. It is **not** a cause (TE-12). Material shortfall = actual / expected &lt; 0.8 (the 1,000 vs 620 example).

Empty Cloud stays empty: live lists overlay local extras onto **Cloud ids only**.

## Where in the app

| Surface | Capability |
|---------|------------|
| Project dashboard → **Expected vs actual (M&E)** | `projects` (all plans) |
| Commitment detail → expected / actual / unit | `commitments` (Project+ or add-on) |
| Executive dashboard → **M&E shortfall watch** | From loaded projects; commitments when entitled |

Trial / local workspaces save in the org store. Live PUT omits `mel_json` unless the client sent indicators (including `[]`).

## Cloud ensure

Ops **Check/Create product DocTypes** adds Custom Field `mel_json` on existing `TL Project`, and `expected_value` / `actual_value` / `mel_unit` on existing `TL Commitment`.

## Honest limits

- No auto-escalate, no auto-close, no causality copy.
- Themba does not run desk M&E.
- Activity reports still use `reportComposer` — weekly AI retrospectives are MEL-4 (`docs/MEL_RETROSPECTIVE.md`).
