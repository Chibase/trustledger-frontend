# Interserv cancellation — TrustLedger

**Status: safe to cancel from the TrustLedger product side.**  
Emails / marketing web were never on Interserv (Webway). Only the old backend plan is in scope.

## Verified (this cutover)

| Check | Result |
|-------|--------|
| Product UI | Vercel → no Interserv URL in runtime |
| API / Desk | `https://app.trustledger.co.za` (Frappe Cloud) |
| Health | `/api/health` → TrustLedger Cloud **OK** |
| API auth | `/api/frappe/auth-check` → Cloud Administrator **OK** |
| Leads / Ops / live login | Cloud CRM + Cloud session path |
| Payments path | Paystack on Frappe Cloud (not Interserv) |

Smoke (re-run anytime):

```bash
curl -sS "https://app.trustledger.co.za/api/method/frappe.ping"
curl -sS "https://trustledger-frontend-pi.vercel.app/api/health"
curl -sS "https://trustledger-frontend-pi.vercel.app/api/frappe/auth-check"
```

## What you do before cancelling Interserv

1. **Log into Interserv** once and confirm there is no unique data you still need (old DocTypes, files, custom scripts). If anything exists, export/backup, then import to Cloud if required.
2. **Confirm no DNS / webhooks / staff bookmarks** still point at the Interserv host (marketing email stays on Webway — unchanged).
3. **Cancel the Interserv plan** before the next deduction date.
4. Keep working only on **Frappe Cloud** + Vercel + Webway.

## What is *not* blocked by cancelling

| Item | Where it lives now / next |
|------|---------------------------|
| CRM Lead intake, Ops, Executive Board | Frappe Cloud |
| Live operator login | Frappe Cloud session (no `srm-core` required) |
| Paystack | Frappe Cloud |
| Demo / assessment / marketing | Vercel + Webway |
| Future `srm-core` product APIs | **Build/install on Frappe Cloud** (never depends on Interserv) |

## Explicit non-goals

- This repo cannot access your Interserv billing portal — you cancel there.
- Custom `srm-core` DocTypes/methods are **future Cloud work**, not something to “move back” from Interserv unless you still have unique data there.

## Owner sign-off

- [ ] Interserv backup/export checked (or confirmed empty / unused)
- [ ] No remaining Interserv hostnames in DNS or webhooks
- [ ] Cloud ping + Vercel health green (commands above)
- [ ] Interserv plan cancelled
