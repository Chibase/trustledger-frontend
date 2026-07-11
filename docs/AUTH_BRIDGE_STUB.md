# Auth bridge (Step 3)

## Goal

Live pilots sign in with Frappe credentials without breaking `/demo`.

## Approach (BFF)

Vercel (`*.vercel.app`) and Frappe (`app.trustledger.co.za`) are different sites,
so the browser cannot share Frappe’s `sid` cookie reliably.

1. Keep `/demo` on cookie role + mock data (`tl-mode=demo`).
2. `/login/live` posts to **`POST /auth/live/login`** (Next.js).
3. The route logs into Frappe server-side, stores `tl-frappe-sid` (httpOnly),
   sets `session-role`, `tl-mode=live`, `tl-user-name`.
4. Live API calls use **`POST /api/frappe`** which forwards with the sid.
5. `get_session` on srm-core maps Frappe roles → TrustLedger role.

## Role map

| Frappe roles | TrustLedger |
|--------------|-------------|
| System Manager, SRM Admin | `admin` |
| SRM Lead, SRM Case Manager | `client` |
| SRM Analyst | `contractor` |
| Other / SRM Viewer | `community` |

## Routes

| Path | Purpose |
|------|---------|
| `/login/live` | Live login UI |
| `/auth/live/login` | BFF login |
| `/auth/live/logout` | BFF logout (also cleared by `/auth/logout`) |
| `/api/frappe` | Authenticated method proxy |

## Env

```
NEXT_PUBLIC_API_BASE_URL=https://app.trustledger.co.za
FRAPPE_BASE_URL=https://app.trustledger.co.za   # optional server override
NEXT_PUBLIC_DATA_MODE=live                      # Step 4
NEXT_PUBLIC_AI_MOCK=false                       # when AI methods ready
```

## Not required for this bridge

- Cross-site `SameSite=None` on Frappe cookies
- Storing passwords in Vercel env
