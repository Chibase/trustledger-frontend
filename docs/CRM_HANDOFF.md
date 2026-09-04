# CRM handoff: Vercel forms → Frappe (HubSpot out)

**Locked operating model (ADR-034):**  
**Frappe Cloud** `app.trustledgersrm.co.za` = acquisition **and** relationship system of record.  
WordPress = CTAs only. HubSpot = **not required** (emergency fallback only until HS-4).  
See `docs/HS_CUTOVER.md` and `docs/WEBWAY_CUTOVER.md`.

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
| Assessment / contact / quote / trial / feedback | CRM Lead via Vercel APIs → `submitProductLead` |
| Support tickets Phase A | Same CRM Lead path (`support_ticket`) |
| UTM / campaign attribution | Lead message / fields as shipped |
| Paying / VIP customers | Customer + Owner User (Paystack / Ops / VIP panel) |

**Do not** rebuild marketing automation in HubSpot for these forms.

## Suggested Lead stages (Phase 3)

`New → Contacted → Qualified → Proposal → Commitment`

At **Commitment** or Paystack success: Customer + Plan Owner (auto-provision / Ops).  
Follow-ups: Frappe email if enabled, else Webway mailbox using the Lead **Comment** — not HubSpot sequences.

## Commitment → Customer

**Trigger (any one):** signed pilot, paid Paystack checkout, written “yes” to paid plan, or Ops VIP / Owner provision.

1. **Customer** (organisation)  
2. **Contact** (buyer / champion) linked to Customer  
3. **User** + roles when they need product access  
4. Optional close CRM Lead against that Customer  

Day-to-day relationship work stays in **Frappe**.

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
| WordPress | CTAs only |
| HubSpot | Out (emergency fallback until retired) |
