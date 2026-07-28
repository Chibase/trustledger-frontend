# Taskade Feature Showcase — publish & Free→Pro

## Positioning (read first)

| Surface | Job |
|---------|-----|
| WordPress `trustledger.co.za` | Marketing story, sectors, **pricing**, conversion CTAs |
| Vercel `/` | Parallel marketing home |
| Vercel `/product` | Static feature education |
| Vercel `/assessment` | 16-question SRM readiness diagnostic |
| **Taskade Feature Showcase** | **Interactive** walkthrough + capability map + SI chain + role lens + short plan fitness |

If the Taskade app looks like another TrustLedger homepage, **delete the brochure sections** and rebuild from `01-landing-genesis-prompt.md` using a dashboard/portal-style template — not SaaS Landing Page.

## A. Publish

1. Generate from the Feature Showcase prompt (or rebuild existing app with that prompt as “replace marketing page with interactive showcase”).
2. **Publish → Secret** for review.
3. Title: `TrustLedger Feature Showcase`
4. Meta: interactive walkthrough — not a live workspace.
5. Consider **noindex** so WP keeps SEO for the brand homepage.
6. Embed public agent widget.
7. Review checklist:
   - [ ] No full pricing wall / sector grid / marketing FAQ
   - [ ] AI step requires Apply before Save
   - [ ] Illustrative labels visible
   - [ ] Exits to /trial /product /assessment /pay /quote /contact
   - [ ] No INC-* as “your workspace”

## B. Automations (Free: max 3)

1. Optional: showcase “Request walkthrough” → email you (`source=taskade_showcase`).
2. Agent Inbox triage reminder.
3. Spare for Pro webhook → file as Frappe CRM Lead (ADR-034).

No HubSpot. No auto-discounts from Taskade (`docs/LEAD_FORMS.md`).

## C. Week plan

### Free (now)

- [ ] **First:** build Presentation report dashboard from `04-presentation-report-dashboard.md` (clone Finance/Revenue analytics gallery app, then reshape). Confirm story starts at baseline/low trust.
- [ ] Optionally wrap it inside Feature Showcase (`01-…`) as Module 7 / home view.
- [ ] Agent from `02-public-agent-knowledge.md`.
- [ ] Secret publish + QA below.
- [ ] Share Secret link for internal copy review.

### Pro (next week)

- [ ] Remove Taskade branding.
- [ ] Password-gated variant for hot prospects (same showcase, Secret).
- [ ] Webhook → CRM Lead filing workflow.
- [ ] Optional WordPress embed: **iframe the showcase** on a “See how it works” page — keep homepage as WP marketing.

### Later / on request

- [ ] Client-branded satellite portals = paid add-on (Business for custom domain).
- [ ] Never replace Frappe SI / grievance SoT.

## D. QA script (10 minutes)

1. Presentation dashboard opens on **before engagement / low trust**, not the recovery end-state?
2. SHOW-2407-014 traces every stage to Closed with a story line under each step?
3. Graphs present (trust trend, funnel/status, SLA, engagements) with captions?
4. Recovery chapter feels like finance/SaaS analytics (KPI strip + chart grid)?
5. Walkthrough AI: Apply gates Save?
6. Capability map: Solo vs Project unlocks correct?
7. Agent: “Where is the demo?” → showcase + /product + /trial, not sample desk.
8. No WP pricing/FAQ/sectors duplicate; CTAs hit Production Vercel?

## E. If Genesis still builds a brochure site

Reply in the builder with:

```text
Remove all marketing homepage sections (hero sales pitch, benefits strip, sectors, pricing table, FAQ).
Replace with an app shell and these interactive modules only: Guided walkthrough, Capability explorer, SI chain builder, Role lens, Plan fitness, AI micro-lab.
Keep a slim exit bar to trial/product/pay. This must feel like a product tour tool, not a second trustledger.co.za homepage.
```
