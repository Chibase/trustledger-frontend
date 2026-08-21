# Autonomous marketing engine (MKT-1)

**Status:** Shipped in this repo. Human-in-the-loop is mandatory (ADR-006, ADR-052).  
**Owners:** developer-controlled serverless on this Next.js app — not a third-party marketing dashboard.  
**Public voice:** Trust (ADR-039). Product name **TrustLedger**. Chibase Consulting is a separate speaker for thought-leadership posts.

This is the Next.js App Router equivalent of the requested `/api` + `/lib` layout. Vercel runs **this** app’s `src/app/api/**/route.ts` handlers; a root `/api/*.ts` folder would not be invoked beside the App Router.

| Requested path | Implemented path |
|----------------|------------------|
| `/api/cron/run-chibase-campaign.ts` | `src/app/api/cron/run-chibase-campaign/route.ts` |
| `/api/cron/run-trustledger-outreach.ts` | `src/app/api/cron/run-trustledger-outreach/route.ts` |
| `/api/webhooks/clickup-handler.ts` | `src/app/api/webhooks/clickup/route.ts` |
| `/lib/gemini.ts` | `src/lib/marketing/gemini.ts` |
| `/lib/zernio.ts` | `src/lib/marketing/zernio.ts` |
| `/lib/clickup.ts` | `src/lib/marketing/clickup.ts` |
| `/content/chibase-papers/` | `content/chibase-papers/` |
| `/content/trustledger-campaigns/` | `content/trustledger-campaigns/` |
| `vercel.json` | `vercel.json` (crons added) |

---

## Team split

| Role | In this system |
|------|----------------|
| **Gemini** | Server-side synthesis only (`GEMINI_API_KEY`). Breaks papers/campaign markdown into LinkedIn-length JSON. If the key is missing, a template fallback still stages a draft. |
| **Cursor / this repo** | Handlers, wrappers, cron, webhook, content packs, Vercel config. |
| **Zernio** | Programmatic social publish (`POST https://zernio.com/api/v1/posts`). No Zernio UI embed, no watermark in our app. |
| **ClickUp** | Command centre: staging list, calendar-week task names, approval gate. **Not** the email blast engine. |

**Locked:** bulk email stays **Frappe Newsletter** (`docs/FRAPPE_EMAIL_MARKETING.md`, `docs/CLICKUP_NEWSLETTER_OPS.md`). This engine never sends Resend blasts, HubSpot mail, or ClickUp automations to a list.

---

## Flow

```text
content/*.md  →  cron (Mon / Wed 07:00 SAST)
      →  Gemini (or template fallback)
      →  ClickUp list “Marketing Review” (status Review / to do)
      →  Human edits
      →  Status = Approved  OR  comment `/tl-publish`
      →  Webhook  →  brand scrub  →  Zernio publish
```

Idempotency: one staged task per brand per ISO week (`[Chibase] slug — YYYY-Www`). Re-running the cron that week returns `already_staged_this_week`.

Outreach DM copy may appear on the task as **Outreach draft (not auto-sent)**. Inbox send requires a conversation id and is not called from cron.

---

## ClickUp list (already created)

| Item | Value |
|------|--------|
| Workspace / team | `90121198081` |
| Folder | TrustLedger Marketing |
| List | [Marketing Review](https://app.clickup.com/90121198081/v/l/li/901220539195) (`901220539195`) |
| Setup card | [Engine setup](https://app.clickup.com/t/869en19vw) |

**Add statuses in the ClickUp UI** (API cannot create them):  
`Drafting` → `Review` → `Approved` → `Publishing` → `Published` → `Parked` → `Failed`

Until `Approved` exists, publish with a task comment:

```text
/tl-publish
```

Do **not** treat default `complete` as publish — that would fire on ordinary close.

### Webhook (once)

`GET https://<this-app-host>/api/webhooks/clickup` **registers or updates** the ClickUp webhook using `CLICKUP_API_KEY` and HMAC secret `CLICKUP_WEBHOOK_SECRET` (falls back to `CRON_SECRET` if the dedicated secret is unset).

- Endpoint: `https://<this-app-host>/api/webhooks/clickup`  
  Use the **Next.js production host** (today `https://trustledger-frontend-pi.vercel.app`), not WordPress `trustledger.co.za`.
- Events: `taskStatusUpdated`, `taskCommentPosted`
- Production refuses unsigned POSTs.

Operator one-shot (Bearer `CRON_SECRET` or Ops session): `POST /api/cron/setup-marketing` registers the webhook and stages this week’s Chibase + TrustLedger drafts. `{ "dryRun": true }` synthesizes without writing ClickUp.

Health: `GET /api/health` → `launch.marketingEngine` `{ gemini, zernio, zernioAccounts, clickup, webhookSecret, webhookSecretDedicated, listId, teamId }`. Missing keys do **not** fail platform health.

---

## Ops desk (`/ops/marketing`)

Allowlisted Platform Operators work the engine from TrustLedger Platform — same login that lands on `/ops/executive`. Customer `/app/dashboard` does not show this stack.

| Action | Where |
|--------|--------|
| See drafts still needing review | `/ops/marketing` **To review** inbox |
| Archive published or skipped drafts | **Archive** on a card, or they leave the inbox after live publish |
| Compose topic / length / destination | **Compose a brief** (LinkedIn post/article/comment, Reddit, ESG, website blog) |
| Stage Chibase / TrustLedger cron drafts | Buttons on that page (`POST /api/ops/marketing`) |
| Edit full markdown | Click **Open** → Marketing Review task |
| Publish LinkedIn feed | **Publish** on the desk (human apply) or ClickUp **Approved** / `/tl-publish` |
| LinkedIn article/comment, ESG, Reddit, blog | Preview + **Copy markdown** / **Mark paste-ready**. Not auto-posted to the website. |

The desk never sends bulk email. Default ClickUp `complete` is still not a publish signal.

---

## Vercel env (secrets only — never `NEXT_PUBLIC_`)

| Variable | Required to | Notes |
|----------|-------------|--------|
| `CRON_SECRET` | Invoke crons | Vercel sends `Authorization: Bearer <CRON_SECRET>` |
| `GEMINI_API_KEY` | LLM drafts | Optional; template fallback if unset |
| `GEMINI_MODEL` | Optional | Default `gemini-2.0-flash` |
| `CLICKUP_API_KEY` | Stage tasks | Personal token (ClickUp header is the token, not `Bearer`) |
| `CLICKUP_TEAM_ID` | Optional | Defaults to `90121198081` |
| `CLICKUP_LIST_ID` | Stage / approve | Defaults to Marketing Review `901220539195` |
| `CLICKUP_WEBHOOK_SECRET` | Production publish HMAC | Optional if `CRON_SECRET` is set (fallback). Dedicated secret preferred. |
| `ZERNIO_API_KEY` | Publish | `sk_…` |
| `ZERNIO_LINKEDIN_ACCOUNT_ID` | Publish | Or brand-specific IDs below |

Brand-specific accounts (optional):

- `ZERNIO_TRUSTLEDGER_LINKEDIN_ACCOUNT_ID`
- `ZERNIO_CHIBASE_LINKEDIN_ACCOUNT_ID`
- `ZERNIO_TWITTER_ACCOUNT_ID` / `ZERNIO_PLATFORMS=linkedin:acc_…,twitter:acc_…`

Connect accounts once in Zernio (OAuth), then store the account `_id` values here. If accounts are missing, approval comments “paste manually” and does not fail the webhook.

### Publish returns “not authorised”

That string is almost always Zernio or LinkedIn, not the TrustLedger ops gate.

1. **API key (this is the usual 401)** — Zernio keys are shown **once**.  
   - zernio.com → **Settings → API Keys → Create**  
   - Copy the full `sk_…` or `zrk_…` value (67–68 characters).  
   - Vercel → Production → `ZERNIO_API_KEY` = paste **only the key** (not `Bearer …`, not quotes, not an MCP OAuth token).  
   - Redeploy. `/ops/marketing` Engine status reports prefix + length if the key is still rejected.  
2. **LinkedIn OAuth** — reconnect the TrustLedger / Chibase LinkedIn account in the Zernio dashboard. Expired tokens surface after the key is valid.
3. **Account ID** — `ZERNIO_LINKEDIN_ACCOUNT_ID` (or brand-specific) must be the Zernio account `_id` from the dashboard / `GET /accounts`, not a LinkedIn profile URL or `urn:li:organization:…`.
4. **Frappe Newsletter** — a Desk “Publish” on a Newsletter is a different path (`docs/FRAPPE_EMAIL_MARKETING.md`). That needs Email Manager + outgoing `sales@`. It is not this Publish button.

After reconnecting, retry **Publish** on `/ops/marketing`. Copy stays in ClickUp until a live post succeeds.

---

## Cron

| Job | Schedule (UTC) | SAST | Path |
|-----|----------------|------|------|
| Chibase thought-leadership | `0 5 * * 1` | Mon 07:00 | `/api/cron/run-chibase-campaign` |
| TrustLedger trial / product | `0 5 * * 3` | Wed 07:00 | `/api/cron/run-trustledger-outreach` |
| Operator one-shot | — | — | `/api/cron/setup-marketing` |

Manual (Platform Operator session or `Authorization: Bearer CRON_SECRET`):

```bash
curl -X POST "$HOST/api/cron/run-chibase-campaign" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true}'
```

`dryRun: true` synthesizes copy and returns it — no ClickUp write, no Zernio publish.

---

## Adding source material

1. Drop a `.md` file in `content/chibase-papers/` or `content/trustledger-campaigns/`.
2. YAML front matter: `slug`, `title`, `brand`, `kind`, `channel`, `cta_label`, `cta_url`, `platforms`.
3. Body = practitioner notes. Do not invent paper findings. Paraphrase only what you have the right to use.
4. Redeploy (content is traced into the serverless bundle via `outputFileTracingIncludes`).

---

## Voice check (automatic)

Before staging and again conceptually at publish, copy is scrubbed for: Frappe, Vercel, HubSpot, Interserv, AccordBridge, Gemini, Zernio, ClickUp, Paystack, Grok, WordPress, Webway.

Chibase posts may name **Chibase Consulting** and mention TrustLedger once as a complementary product. TrustLedger posts do not hero-co-brand Chibase (ADR-039).

---

## Related

| Doc | Role |
|-----|------|
| ADR-052 in `docs/DECISIONS.md` | Locked split |
| `docs/CLICKUP_NEWSLETTER_OPS.md` | Fortnightly email (separate list; Frappe send) |
| `docs/FRAPPE_EMAIL_MARKETING.md` | Bulk email SoT |
| `docs/exports/linkedin/WEEKLY_CONTENT.md` | Human LinkedIn pack (still valid; engine rotates repo markdown) |
| `content/README.md` | How to add papers / campaigns |
