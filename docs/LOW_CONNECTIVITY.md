# Low-connectivity Capture (LC-1)

**Status:** Shipped on the Capture hub. Not a native offline app. Not a PWA. Not automatic Cloud invent.  
**Packet:** LC-1 (`docs/BUILD_PLAN.md`).  
**Do not sell as:** App Store / Play companion, offline-first field sync, or Version 003 (see `docs/VERSIONING.md`).

## What this is

Field desks often lose signal. Capture keeps an honest **same-browser draft** so notes and report packs are not lost while the network is down.

| Behaviour | What happens |
|-----------|----------------|
| Typing notes or filling a pack | Debounced save to `localStorage` key `tl-field-drafts` (this browser, this device, this org / project / source) |
| Banner | Online vs “No connection — draft on this device”, plus last-saved time |
| AI extract / brief | Needs a network. Buttons disable offline. Notes still draft. |
| Apply / Save pack | Human click required (ADR-006). Typing never auto-applies. |
| Confirmed apply, then network fail | Draft is kept with `pendingApply` and **stable ids**. Reconnect retries **that** apply (upsert), not a second apply. |
| Pack Cloud project sync fail | Local capture row is already saved. Cloud project / empowerment update retries on `online`. |
| Success while still offline | Local CRM / capture writes still happen. Banner holds Cloud retry until reconnect. |

## What this is not

- No service worker, no installable PWA, no background sync across devices.
- Reloading in a **different** browser or clearing site data drops the draft.
- Live project lists still need a network on first load. If the desk already has the project selected in this session, they can keep capturing.
- Stakeholder extract cannot run offline — there is no on-device model.

## Copy for the desk

Use: “Draft on this device / this browser. Apply still required. Cloud updates when you reconnect.”  
Do not use: “Works fully offline”, “native app”, “syncs every phone automatically”.

## Compatibility

- TE-5b narrative drafts remain. LC-1 adds **packs**, a visible connection state, AI gating, and confirmed-apply retry.
- Empty Cloud stays empty. Retry does not invent demo `INC-*` rows.
- Product name: **TrustLedger** only.
