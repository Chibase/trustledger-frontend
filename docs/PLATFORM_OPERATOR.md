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

## How to lift lockdown (when you advise)

1. Set `PLATFORM_OPERATOR_ONLY=0` (or remove it) on Vercel.
2. Optionally clear `PLATFORM_OPERATOR_LOCK_PUBLIC`.
3. Resume Plan Owner provisioning per ADR-012 / `ACCESS_MODEL.md`.

You can keep `PLATFORM_OPERATOR_EMAILS` set for future staff tools without enforcing lockdown.

**Soft public launch (ADR-027):** Do **not** lift this yet for buyers. They use `/pay` + `/trial` with live Paystack while you keep operator-only live Frappe. See `docs/PUBLIC_LAUNCH.md`.

## UI signal

Live sessions under lockdown show a **Platform Operator** banner and Settings → Access control status.
