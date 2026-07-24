# CRM handoff: leads → Frappe (HubSpot retired)

**Locked operating model (ADR-034):**  
**Frappe Cloud** `app.trustledger.co.za` = acquisition **and** relationship system of record.  
HubSpot Free = **cutover fallback only** (`LEAD_BACKEND=auto` / `hubspot`) until HS-3/HS-4 remove it. See `docs/HS_CUTOVER.md`.

```text
WordPress CTA → Vercel branded form
        ↓
   Frappe CRM Lead (source + comment)
        ↓  ← Paystack / Ops commitment
   Frappe Customer + Contact + Owner User
        ↓
   /login/live · projects · support
```

## What lands in Frappe (from day one)

| Keep | Where |
|------|--------|
| Assessment / contact / quote / trial / feedback | CRM Lead via `/api/...` → `submitProductLead` |
| Support tickets Phase A | Same CRM Lead path (`support_ticket`) |
| UTM / campaign attribution | Lead message / custom fields as already shipped |
| Paying / VIP customers | Customer + Owner User (Paystack / Ops / VIP panel) |

**Do not** rebuild marketing automation in HubSpot for these forms.

## What used to stay in HubSpot (retired target)

Until HS-2 smoke is green you may keep HubSpot credentials for emergency `LEAD_BACKEND=auto`. After HS-3, remove portal/form env and WP embeds.

## Commitment → Customer

**Trigger (any one):** signed pilot, paid Paystack checkout, written “yes” to paid plan, or Ops VIP / Owner provision.

**Create on Frappe Cloud:**

1. **Customer** (organisation)  
2. **Contact** (buyer / champion) linked to Customer  
3. **User** + roles when they need product access  
4. Optional close CRM Lead against that Customer  
5. Link **Project(s)** when `srm-core` / SI DocTypes apply  

Day-to-day relationship work (calls, renewals, support) stays in **Frappe**.

## Solo checklist when someone commits

1. Confirm CRM Lead (or Paystack reference) in Desk.  
2. Customer + Contact (+ User via provision / auto-provision).  
3. Email credentials / `/login/live` (or VIP temp password).  
4. Stop any leftover HubSpot nurture for that email.

## Decision

| Stage | System |
|-------|--------|
| Strangers → interest | **Frappe CRM Lead** (Vercel forms) |
| Commitment → ongoing client | **Frappe** Customer / Owner |
| HubSpot | Fallback only during cutover |
