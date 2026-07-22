# Frappe system of record (T5 → OD-1)

**Status:** Contract + operator prep shipped. **Operational Step 1 active** (ADR-032): Desk fields + one live `provision-owner` smoke. Buyer public live login stays gated by **ADR-013** until Step 4.

**Master path:** `docs/OPERATIONAL_DELIVERY.md` · Ops UI: `/ops/readiness`

## Goal

Move Plan Owner org + domain data from browser (`tl-orgs`, `tl-org-data`, `tl-org-media`) onto Frappe Cloud:

```text
Pay / trial success
  → CRM Lead (already)
  → Customer (plan_code, seats, entitlement_status, tl_org_id)
  → User (Plan Owner, role Customer / custom)
  → later: Project / Incident / Evidence DocTypes (org-scoped)
```

## Env

```bash
# Keep for buyers until Owner issuance is proven
PLATFORM_OPERATOR_ONLY=1
PLATFORM_OPERATOR_EMAILS=admin@chibaseconsulting.co.za

# Operator-only tools for T5 dry-run / issuance helpers (default off)
FRAPPE_OWNER_ISSUANCE=0

# Existing CRM / API keys (never commit)
FRAPPE_API_KEY=…
FRAPPE_API_SECRET=…
FRAPPE_BASE_URL=https://app.trustledger.co.za
```

## API (this repo)

| Route | Who | Behaviour |
|-------|-----|-----------|
| `POST /api/frappe/ensure-custom-fields` | Platform Operator + `FRAPPE_OWNER_ISSUANCE=1` | Idempotent create of Customer/User `custom_*` fields (`dryRun` default true). |
| `POST /api/frappe/provision-owner` | Platform Operator + `FRAPPE_OWNER_ISSUANCE=1` | Returns Customer + User **drafts** + checklist; optional `dryRun: true` (default). Live create (`dryRun: false`) auto-ensures fields then creates docs. |
| `POST /api/frappe/crm-setup` | Token | Lead sources/views (existing) |

## Customer custom fields (Desk)

Prefer `custom_*` fieldnames (Customize Form). Create on **Customer**:

| Field | Type | Notes |
|-------|------|-------|
| `custom_plan_code` | Select | practitioner / project / institutional |
| `custom_seat_limit` | Int | null = unlimited (Project) |
| `custom_project_limit` | Int | Practitioner default 2 |
| `custom_entitlement_status` | Select | trial / active / past_due / cancelled |
| `custom_tl_org_id` | Data | Browser org id for migration |
| `custom_owner_email` | Data | Plan Owner |

Legacy short names (`plan_code`, …) in older notes map to the same intent — use `custom_*` when adding via Customize Form.

## Owner User

- Email = purchaser work email  
- Custom: `tl_desk_tier`, `tl_plan_owner`  
- Link to Customer  
- Welcome email via Frappe / Resend

## Lift ADR-013 (only when ready)

1. Smoke `provision-owner` with `dryRun: false` for one test Customer.  
2. Confirm Owner can `/login/live` and sees empty org data (not demo).  
3. Set `PLATFORM_OPERATOR_ONLY=0`.  
4. Point Paystack success at provision (automation packet).

See ADR-031, ADR-032, `docs/OPERATIONAL_DELIVERY.md`, `docs/ACCESS_MODEL.md`, `docs/PLATFORM_OPERATOR.md`.
