# MEL-5 — Learn & Adapt cycle

**Packet:** MEL-5. **Not** a standalone product (ADR-054). **Not** `addon_mel`.  
**Not in this packet:** expected vs actual capture (MEL-1), root-cause tags (MEL-2), Learn & Adapt editor (MEL-3), retrospective composer (MEL-4).

## What it is

Closes the adaptive loop the original M&E brief asked for: a material expected-vs-actual gap is a **watch** and may **suggest** a Learn & Adapt record. Human apply is required.

The executive and project dashboards show one **Learn & Adapt cycle** panel:

- MEL-1 shortfall watch
- MEL-3 open Adapt watch
- MEL-2 root-cause mix (when tags exist)
- Suggested Learn & Adapt from a **material** shortfall that does not yet have an open Adapt record on that project
- Link to the MEL-4 retrospective

## Suggestion rules

| Rule | Behaviour |
|------|-----------|
| Material shortfall | actual / expected &lt; 0.8 (same as MEL-1) |
| Already looping | No new suggestion if that project already has an open Adapt record |
| Monitor text | Honest figures + “watch, not a named cause” |
| Adapt action | Left blank — write it on the case desk before Mark done |
| No case | Does not invent `INC-*`. Apply stays disabled |
| Apply | Appends an open record. Does not close or advance the grievance |

Not Themba. Not Grok. Not auto-save.

## Honest limits

- Copy does not name a cause (TE-12).
- Empty Cloud stays empty.
- Packaging (`addon_mel`) stays later — MEL stays on the existing project / commitment / incident desks.
