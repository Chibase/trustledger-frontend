# Workspace review — client comments → marketing sites

**Status:** Operator playbook (MKT-5, ADR-053)  
**Locked split:** Google Workspace = team + client **review comments**. ClickUp = social **publish gate**. Frappe Newsletter = bulk send. This repo = public quotes after human apply.

Clients should not need a ClickUp seat. Workspace Docs (Commenter) is where they mark the draft.

## Why Workspace

The marketing team includes Google Workspace users. Drafts shared as Google Docs collect **threaded comments** from the team and from clients. Those comments are the source for:

- Internal revise-then-approve (newsletter, LinkedIn, site copy)
- **Public voice** on TrustLedger (`/`, `/product`) and Chibase (`/firm`) — only after written consent

Do **not** scrape Gmail or Docs into the website. Do **not** blast from Gmail or ClickUp Email.

## Once: Drive folder

In Drive, signed in as **`admin@chibaseconsulting.co.za`**:

1. Create folder **Marketing review**.
2. Share the folder with the **Workspace group** (Commenter or Editor). Do not share the whole folder with clients.
3. Optional: add the folder shortcut to ClickUp [Inbox & diary](https://app.clickup.com/90121198081/v/l/li/901220601939).

Paste-ready Doc body: `docs/exports/workspace/REVIEW_DOC_TEMPLATE.md`.

## Each draft

1. Copy the template into **Marketing review**. Name: `[TrustLedger|Chibase] <slug> — <week or send date>`.
2. Paste the draft (from ClickUp Marketing Review, Newsletter Cadence, or `/ops/marketing`).
3. **Team:** share the Doc with Workspace reviewers. They comment in Suggesting / Comments. A reviewer writes **Approved for publish** when the body is ready.
4. **Client (optional):** File → Share → add the client as **Commenter** on **that Doc only**. Ask them to comment in the Doc, not a side WhatsApp.
5. Harvest usable lines onto [Customer research — harvest](https://app.clickup.com/t/869ephe0r) with consent status (see below).
6. **Publish social** still requires ClickUp **Approved** or `/tl-publish` (or `/ops/marketing` Publish). A Google comment is not a Zernio publish.
7. **Send newsletter** still requires Cadence Approved → Desk Newsletter. A Google comment is not a blast.

## Consent before a public quote

A comment on a Doc is **not** permission to put the client on the website.

Required, in writing on the Doc or in the Gmail thread (keep the link on the ClickUp card):

- Exact sentence (or a paraphrase they accept)
- How they are named: **named** (person + organisation) or **role-only** (e.g. “Programme manager, municipal infrastructure”)
- Surfaces: TrustLedger home / product, and/or Chibase firm

Then human-apply into `src/data/clientVoice.ts` (`CLIENT_VOICE_QUOTES`) — [Content card](https://app.clickup.com/t/869ephe10). Redeploy. The sites render only catalog rows with consent `named` or `role-only`. Empty catalog → no fake partner logos.

Drive folder once: [Create Drive folder Marketing review](https://app.clickup.com/t/869ephe16).

POPIA: do not publish a person’s name or organisation without that written line. Do not use `/assessment` or product Discussion threads as public testimonials.

## Hats

| Step | Who |
|------|-----|
| Share Doc, chase comments | Thozi (Sales / Outreach) |
| Harvest + consent card | Thozamile (Customer research) |
| Apply to `clientVoice.ts` | Thozamile (Content); Thozi merge |
| ClickUp / Desk publish | Unchanged (Marketing Review, Cadence, `/ops/marketing`) |

## Related

- ADR-053 in `docs/DECISIONS.md`
- `docs/MARKETING_ENGINE.md` — social engine still ClickUp HITL
- `docs/CLICKUP_NEWSLETTER_OPS.md` — Frappe send
