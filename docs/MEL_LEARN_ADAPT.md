# MEL-3 — Learn & Adapt records

**Packet:** MEL-3. **Not** a standalone product (ADR-054). **Not** `addon_mel`.  
**Not in this packet:** AI retrospectives (MEL-4). Expected vs actual: `docs/MEL_INDICATORS.md`. Root-cause tags: `docs/MEL_ROOT_CAUSE.md`.

## What it is

A **corrective-action** card on the grievance: **Monitor → Analyse → Adapt**.

It does **not** replace reported → deploy → investigate → resolve → verify → close. Marking a record done does **not** close or advance the case. The record is a watch, not a trust-movement cause (TE-12).

## Record

| Field | Role |
|-------|------|
| Monitor | What was observed |
| Analyse | Why (optional MEL-2 root-cause link) |
| Adapt | What we will change — required before **Mark done** |
| Owner / due | Optional follow-up |
| Status | `open` or `done` |

## Cloud

`TL Incident.adapt_json` (Long Text JSON list). PUT omits it unless the client sent records (including `[]`). List fetch tries adapt fields, then MEL-2 tags, then stage stamps, then core — missing Custom Fields must not drop lifecycle stamps.

Empty Cloud stays empty: live lists overlay local extras onto **Cloud ids only**. An empty Cloud `[]` wins over a stale local list.

Ops **Check/Create product DocTypes** adds `adapt_json` on existing `TL Incident`.

## Where in the app

| Surface | Capability |
|---------|------------|
| Case desk → **Learn & Adapt** | Add / save / mark done (including after the case is closed) |
| `/app/dashboard` | Open-record watch |
| Project dashboard | Open records for that project’s cases |

Themba does not run desk M&E. Activity reports still use `reportComposer`.
