TrustLedger email marketing pack
================================

Paste-ready HTML for Frappe Email Template / Newsletter / Email Campaign.

Files:
- 00-shell.html            Brand wrapper (Jinja placeholders)
- 01-soft-launch.html      First warm-contact blast
- 02-trial-invite.html     14-day trial CTA
- 03-quote-followup.html   Quote / Institutional follow-up
- 04-assessment-nudge.html SRM diagnostic CTA
- HUMAN_ONLY.md            Steps that need Cloud/Desk/DNS (not the agent)
- DESK_EMAIL_ACCOUNT_SALES.md  sales@ SMTP checklist

Ops push (after FRAPPE_API_KEY on Vercel):
  /ops/accounts → Bulk email marketing → Push templates
  or POST /api/frappe/ensure-email-marketing { "dryRun": false }

Runbook: docs/FRAPPE_EMAIL_MARKETING.md
Brand: docs/DESIGN_SYSTEM.md (teal #0e7c66, ink #12202a)

CTAs must stay on https://trustledger-frontend-pi.vercel.app — not HubSpot.
