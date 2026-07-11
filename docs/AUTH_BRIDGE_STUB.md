# Auth bridge stub (Phase 2 Packet 14)

## Goal

Replace the Demo role-cookie picker with Frappe session auth for live pilots,
without breaking `/demo`.

## Planned approach

1. Keep `/demo` on cookie role + mock data.
2. Add `/login/live` (or reuse `/login?mode=live`) that redirects to Frappe
   `/api/method/login` or OAuth / desk session cookie on the API host.
3. Frontend sends `credentials: "include"` (already in `frappeClient`).
4. Map Frappe roles / custom fields → TrustLedger `UserRole`.
5. Middleware: `/app` allows either Demo cookie **or** live session signal.

## Not in this packet

- Storing Frappe passwords in Vercel
- Implementing Interserv CORS (ops on Frappe site)
- Grok API keys (server-side on `srm-core` only)

## Blockers requiring human input

- Interserv site URL + CORS allowlist for the Vercel domain
- Which Frappe roles map to community / contractor / client / admin
