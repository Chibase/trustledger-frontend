# Taskade publish, automations, Free → Pro checklist

## A. Publish the landing app

1. Open the generated TrustLedger landing Space.
2. **Publish** → visibility:
   - **Secret** first (internal review link).
   - **Public** after copy sign-off; optionally submit to Community Gallery later (optional — brand preference may be to stay Secret/Public without gallery).
3. Configure:
   - Page title: `TrustLedger — Resolution you can audit`
   - Description: grievance + Stakeholder Intelligence one-liner (see landing prompt).
   - Site name: `TrustLedger`
   - Search indexing: off until Public + approved.
4. Embed the public agent widget (bottom-right).
5. Share Secret link in Ops / sales Slack (or email) for a 10-minute copy review against `PLATFORM_STRATEGIC_BRIEF` §6.

### Free vs Pro publish notes

| Need | Free | Pro ($10/mo annual) |
|------|:----:|:-------------------:|
| Live hosted landing | ✓ | ✓ |
| Visitor traffic without burning credits | ✓ | ✓ |
| Remove “Powered by Taskade” | — | ✓ |
| Unlimited agents / apps | — | ✓ |
| Password-protected prospect portal | limited | ✓ |
| Custom domain `app.yoursite.com` | — | Business+ |

Keep CTAs on Vercel even if the landing lives on `*.taskade.app`.

## B. Automations (stay within Free: max 3)

Suggested Free set:

1. **Form → notify** — If the landing has a waitlist form: on submit → email you (work inbox) with source `taskade_landing`.
2. **Daily Agent Inbox digest** — Optional: reminder to triage public chats into Frappe CRM Lead.
3. **Spare** — Hold for Pro (e.g. webhook to a future BFF).

Do **not** auto-send discounts from Taskade. Follow `docs/LEAD_FORMS.md`: incentives via Frappe CRM tagging only.

When Pro unlocks 100+ integrations: prefer webhook → internal Ops note, then human creates **Frappe CRM Lead** (ADR-034). No HubSpot.

## C. Week plan

### This week (Free)

- [ ] Create Taskade account (no card).
- [ ] Paste `01-landing-genesis-prompt.md` → generate app (or clone SaaS Landing Page then customise).
- [ ] Create agent from `02-public-agent-knowledge.md`.
- [ ] Publish landing as **Secret**; embed agent.
- [ ] Smoke-test CTAs: /product /trial /assessment /pay /quote /contact.
- [ ] Ask agent the objection table questions; fix knowledge if it invents features.

### Next week (Pro)

- [ ] Upgrade Pro (annual $10/mo).
- [ ] Remove Taskade branding on landing + agent.
- [ ] Second agent optional: “Sales / plans” vs keep one guide agent.
- [ ] Password-gated **Secret** “Trust Pack preview” app for hot prospects (still CTAs to real product).
- [ ] Wire one Pro automation: form → webhook/email you file as CRM Lead.
- [ ] Optional: embed agent widget on WordPress `trustledger.co.za` (CTA pages only).

### Later (client request / Business)

- [ ] Client portal satellite (branded domain needs Business).
- [ ] Quote as implementation add-on — not as Solo/Practitioner included feature.
- [ ] Never replace Frappe SI / grievance SoT with Taskade data.

## D. QA script (5 minutes)

Ask the public agent:

1. What is TrustLedger?  
2. Where is the demo?  
3. Does AI close cases?  
4. What’s in Solo vs Project?  
5. Is the CRM real on trial?

Pass = answers match knowledge pack; fail = edit knowledge and re-test before Public.

## E. Relationship to this repo

| Surface | Role |
|---------|------|
| Taskade landing + agent | Fast public story + Q&A |
| `trustledger.co.za` (WordPress) | Brand CTAs |
| Vercel frontend | Product of record |
| `app.trustledger.co.za` | Frappe Cloud SoT |

Update this pack when `PLATFORM_STRATEGIC_BRIEF.md` §5–§6 or prices change.
