# Platform Operator — sole live control

**Locked with ADR-013.**  
Until you advise otherwise, **you** are the only person allowed to operate live TrustLedger (product, ops, CRM handoff, strategy, process changes).

This is **not** the same as a customer **Plan Owner** (`admin` on a paid org). See `docs/ACCESS_MODEL.md`.

## What is locked (default)

| Surface | Behaviour when `PLATFORM_OPERATOR_ONLY=1` |
|---------|-------------------------------------------|
| `/login/live` | Only emails in `PLATFORM_OPERATOR_EMAILS` may sign in |
| Live `/app/*` | Non-operator live sessions cleared + redirected |
| `/api/frappe` BFF | Rejected for non-operators |
| Customer Plan Owner issuance | **Paused** (manual/policy — do not provision buyers until lockdown lifts) |
| Demo `/demo` → sample `/app` | **Still public** (lead magnet) unless you also set `PLATFORM_OPERATOR_LOCK_PUBLIC=1` |
| Assessment / marketing | Stay public |

Fail closed: if lockdown is on and the allowlist is empty, **all** live logins are denied.

## Vercel env (required)

```bash
PLATFORM_OPERATOR_ONLY=1
PLATFORM_OPERATOR_EMAILS=admin@chibaseconsulting.co.za
```

Optional — also block demo product entry (assessment can remain):

```bash
PLATFORM_OPERATOR_LOCK_PUBLIC=1
```

Add alternate operator emails as a comma-separated list if needed.

## How to lift lockdown (Step 4 — **DONE 2026-07-23**)

1. Confirm Ops Finance **Dry-run due list** / forced charge smoke works.
2. Set `PLATFORM_OPERATOR_ONLY=0` (or remove it) on Vercel.
3. Optionally clear `PLATFORM_OPERATOR_LOCK_PUBLIC`.
4. Keep `PLATFORM_OPERATOR_EMAILS` for `/ops` (always allowlist-gated).
5. Smoke buyer `/login/live`; `past_due` / `cancelled` Customers stay blocked by entitlement gate.

**Status:** Buyer live login is open. Do **not** clear the Ops allowlist. Soft-launch marketing may continue; GO LIVE still waits on Step 5 + criteria in `docs/OPERATIONAL_DELIVERY.md`.

## T5 / OD-1 Owner issuance

1. Read `docs/FRAPPE_SOT.md` and `docs/OPERATIONAL_DELIVERY.md` (Step 1).
2. Set `FRAPPE_OWNER_ISSUANCE=1` (operator tools only).
3. Track gates on `/ops/readiness`; `/ops/accounts` → Dry-run then Create on Cloud after Desk custom fields exist.
4. Lift `PLATFORM_OPERATOR_ONLY` only at delivery Step 4 after Steps 1–3 smoke *(Done)*.

## UI signal

Live sessions under lockdown show a **Platform Operator** banner and Settings → Access control status.
