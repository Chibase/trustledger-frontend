# Operational delivery — real platform for customers

**Policy:** Delay public rollout until customers get durable Cloud-backed operations (not browser-only tenancy).  
**Locked:** ADR-032. Soft-launch marketing may continue for `/demo` / leads.

```text
Step 1  Frappe SoT ready (Customer + Plan Owner User smoke)     DONE
   ↓
Step 2  Product DocTypes + Cloud File                           DONE
   ↓
Step 3  Sync browser org → Cloud + auto-provision on Paystack   DONE
   ↓
Step 4  Billing scheduler + lift ADR-013 for buyers             DONE
   ↓
Step 5  V002 depth (engagements → commitments → grievance → ESG) DONE (demo)
   ↓
GO LIVE  Operational grade                                      DONE
```

---

## Step 1 — Frappe SoT ready **(DONE — 2026-07-22)**

Customer + Owner User smoke passed (`nonunu@trustledger.co.za`).

---

## Step 2 — Product DocTypes + Cloud File **(DONE — 2026-07-22)**

DocTypes + Project/Incident/Evidence smoke under `Step1 Smoke Test` passed.

---

## Step 3 — Sync + auto-provision **(DONE — 2026-07-23)**

Paystack creates Customer+User without Ops click.

---

## Step 4 — Billing ops + lift lockdown **(DONE — 2026-07-23)**

Day-14 charge cron + entitlement gate live. `PLATFORM_OPERATOR_ONLY=0`; buyer `/login/live` smoke passed. Ops stay allowlist via `PLATFORM_OPERATOR_EMAILS`.

---

## Step 5 — V002 operational depth **(DONE — 2026-07-23)**

Demo modules shipped: 24c Engagements · 24d Commitments · 24e Grievance verify/close · 24g Intelligence/ESG.

Follow-ups (non-blocking for GO LIVE ladder): Cloud Engagement/Commitment DocTypes; Stats SA ingest; live Grok via srm-core.

---

## GO LIVE — operational grade **(DONE — 2026-07-23)**

Ops ladder: https://trustledger-frontend-pi.vercel.app/ops/readiness — **GO LIVE ready** confirmed by operator.

| Criterion | Required | Status |
|-----------|----------|--------|
| Owner provision automated or one-click Ops | Yes | Met (auto-provision + Ops tools) |
| Customer data on Cloud, not browser-only | Yes | Met (TL DocTypes + migrate) |
| Media on Cloud File | Yes | Met (upload BFF) |
| Day-14 billing without babysitting | Yes | Met (cron + Finance panel) |
| ADR-013 lifted for buyers | Yes | Met (`PLATFORM_OPERATOR_ONLY=0`) |
| Demo path still separate (`/demo`) | Yes | Keep separate |
| No demo `INC-*` in customer live workspace | Yes | Met (buyer live smoke) |

TrustLedger is operational-grade for paying customers. Keep `/demo` separate. Non-blocking follow-ups: Cloud Engagement/Commitment DocTypes; Stats SA ingest; live Grok via srm-core.

**Launch runbook:** `docs/LAUNCH_WATCHLIST.md` (first-days failures, traffic, branding).
