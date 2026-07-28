# Taskade — TrustLedger landing + public agent pack

Paste-ready prompts for Taskade Genesis (Free now, Pro next week).

**Source of truth for claims:** `docs/PLATFORM_STRATEGIC_BRIEF.md` §5–§6.  
**Do not invent features.** If unsure, point visitors to production `/product`.

## Files

| File | Use |
|------|-----|
| [`01-landing-genesis-prompt.md`](./01-landing-genesis-prompt.md) | Paste into Taskade Genesis → Create app |
| [`02-public-agent-knowledge.md`](./02-public-agent-knowledge.md) | Train / system prompt for the public agent |
| [`03-automations-and-publish.md`](./03-automations-and-publish.md) | Publish settings, CTAs, Free→Pro checklist |

## Production URLs (use these in buttons)

| Label | URL |
|-------|-----|
| Product | `https://trustledger-frontend-pi.vercel.app/product` |
| 14-day trial | `https://trustledger-frontend-pi.vercel.app/trial` |
| Subscribe | `https://trustledger-frontend-pi.vercel.app/pay` |
| Assessment | `https://trustledger-frontend-pi.vercel.app/assessment` |
| Quote | `https://trustledger-frontend-pi.vercel.app/quote` |
| Contact | `https://trustledger-frontend-pi.vercel.app/contact` |
| Live login | `https://trustledger-frontend-pi.vercel.app/login/live` |
| Marketing site | `https://trustledger.co.za` |

When a custom app domain exists, keep CTAs on the Vercel paths above (product of record).

## Suggested Free-tier spend (3 apps / 1 agent)

1. **App 1:** SaaS landing (this pack).
2. **Agent 1:** Public TrustLedger guide (knowledge file).
3. Reserve apps 2–3 for a Secret prospect portal or assessment microsite after Pro.

## Lead routing (ADR-034)

Taskade forms must not become a parallel CRM. Prefer:

- CTAs that open TrustLedger `/contact`, `/quote`, `/assessment`, or `/trial`, **or**
- One automation: form submit → webhook/email that you manually file as **Frappe CRM Lead**.

Do not embed HubSpot. Do not blast from Resend OTP keys.
