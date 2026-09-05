# MEL-4 — Learn & Adapt retrospective

**Packet:** MEL-4. **Not** a standalone product (ADR-054). **Not** `addon_mel`.  
**Not a fourth report pack SKU.** Monthly / executive / funder packs are unchanged.  
**Not in this packet:** expected vs actual capture (MEL-1), root-cause tags (MEL-2), Learn & Adapt records (MEL-3).

## What it is

A local evidence draft with three locked sections:

1. **What worked**
2. **What did not**
3. **What we will change**

The writer is `reportComposer` → `composeMelRetrospectiveMarkdown`. Suggest → human apply → save through the existing reports wizard. It never calls Frappe or Grok (`trustledger-evidence` only).

Saving or applying the draft does **not** close or advance a grievance.

## Evidence (honest, not TE-12 causality)

| Section | On file | If empty |
|---------|---------|----------|
| What worked | MEL-1 indicators where actual ≥ expected; closed cases; done MEL-3 records | Does not invent a success |
| What did not | MEL-1 shortfalls (watch, not a cause); open tagged cases; open Learn & Adapt records | Says nothing is on file |
| What we will change | Open Adapt actions | Does not invent a change |

Case ids (`INC-*`) are cited when cases exist.

## Where in the app

| Surface | Capability |
|---------|------------|
| `/app/reports?kind=mel_retrospective&projectId=` | Wizard opens on **Learn & Adapt retrospective** |
| Project dashboard → report studio | Kind picker includes the retrospective |
| Case desk → Learn & Adapt | Link to the writer for that project |

Topic pickers stay hidden (fixed brief), same as executive / funder.

## Honest limits

- No auto-save, no auto-close, no causality copy.
- Themba / Cloud LLM is not used for this draft.
- Empty Cloud stays empty.
