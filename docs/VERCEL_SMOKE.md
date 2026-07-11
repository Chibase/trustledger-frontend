# TrustLedger Frontend — Vercel smoke checklist

## Deploy (Demo — default)

1. GitHub `master` connected to Vercel project
2. Framework preset: Next.js
3. Env (Demo-safe):
   - `NEXT_PUBLIC_DATA_MODE=demo`
   - `NEXT_PUBLIC_AI_MOCK=true`
   - `NEXT_PUBLIC_API_BASE_URL=https://app.trustledger.co.za` (harmless in demo)
   - `NEXT_PUBLIC_SITE_URL=https://trustledger-frontend-pi.vercel.app`
4. Production URL should serve `/` and `/demo`

## Step 4 — Live mode env (Production)

In **Vercel → Project → Settings → Environment Variables** (Production):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://app.trustledger.co.za` |
| `FRAPPE_BASE_URL` | `https://app.trustledger.co.za` |
| `NEXT_PUBLIC_DATA_MODE` | `live` |
| `NEXT_PUBLIC_AI_MOCK` | `false` |
| `NEXT_PUBLIC_SITE_URL` | `https://trustledger-frontend-pi.vercel.app` |

Then **Deployments → latest `master` → Redeploy** (required: `NEXT_PUBLIC_*` only apply after a new build).

### Live smoke

- [ ] `/demo` still works (sample data path)
- [ ] `/login/live` accepts a Frappe user/password
- [ ] After login, `/app/dashboard` loads **without** demo banner
- [ ] Incidents list shows Interserv data (not only mock titles)
- [ ] Sign out clears the session
- [ ] AI assist returns heuristic suggestions (`srm-heuristic-v0`) for an SRM-privileged user

### If live login fails

1. Confirm Interserv CORS includes the Vercel origin (Step 2)
2. Confirm `srm_core.api.auth.get_session` is on the site
3. Check Vercel function logs for `/auth/live/login`
4. Temporarily set `NEXT_PUBLIC_DATA_MODE=demo` to restore the public demo

## Demo smoke (unchanged)

- [ ] `/` shows TrustLedger home + Try the demo
- [ ] `/demo` role picker works for each role
- [ ] Demo banner visible on `/app/*`
- [ ] Community / contractor / client / admin widgets
- [ ] Lead gate after ~3 AI/submit actions
