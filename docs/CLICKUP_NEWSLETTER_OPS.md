# ClickUp — Newsletter marketing ops (approve → Frappe send)

**Status:** Operator playbook (v1)  
**Locked split:** ClickUp = cadence + AI draft + your approval. **Frappe Newsletter** = send to Email Groups. Never blast from ClickUp, Resend OTP keys, or HubSpot.  
**Brand / HTML:** `docs/FRAPPE_EMAIL_MARKETING.md` + `docs/exports/email-marketing/`  
**Voice:** Trust (ADR-039) — TrustLedger only; no Frappe / Vercel / HubSpot / Interserv in copy.

---

## 1. Defaults (locked for v1)

| Item | Value |
|------|--------|
| Cadence | **Fortnightly** (every 14 days) |
| Default audience | Email Group **`TL Marketing`** (ICP) |
| Segment sends | Use a **`TL Segment …`** group only when the body is industry-specific |
| From mailbox | `sales@trustledger.co.za` |
| Your gate | **No send without ClickUp status = Approved** (and Send Test in Desk) |
| AI role | Draft / rewrite only — you edit and approve |

---

## 2. ClickUp space setup (once)

Create (or reuse) a Space / Folder: **TrustLedger Marketing**.

**Applied 2026-08-18 (Team Space):**

| Object | Link |
|--------|------|
| Folder | TrustLedger Marketing |
| List | [Newsletter Cadence](https://app.clickup.com/90121198081/v/l/li/901220454750) |
| List | [Newsletter Themes](https://app.clickup.com/90121198081/v/l/li/901220454751) |
| List | [Marketing Review](https://app.clickup.com/90121198081/v/l/li/901220539195) (MKT-1 social engine — not email) |
| Ops list | [Platform Ops](https://app.clickup.com/90121198081/v/l/li/901220454767) (Resend / EM-1 Desk) |

Theme backlog (6 cards) + first fortnightly cadence task + AI prompt reference are seeded.  
**Still configure in ClickUp UI:** list statuses (below) and recommended custom fields (API cannot create them).

### List: `Newsletter Cadence`

**Statuses (in order):**

1. `Idea` — theme parked  
2. `Drafting` — AI / operator drafting  
3. `Review` — waiting on you  
4. `Approved` — content locked; ready for Desk paste  
5. `Queued in Frappe` — Newsletter draft created / test sent  
6. `Sent` — blast complete  
7. `Parked` — skipped this cycle  

**Custom fields (recommended):**

| Field | Type | Notes |
|-------|------|--------|
| Send date | Date | Target blast day |
| Audience | Dropdown | `TL Marketing` · Construction · Government · Architects · Engineers · Social Facilitators · Related |
| Template base | Dropdown | Soft Launch · Trial Invite · Assessment Nudge · Quote Follow-up · Segment Intro · Custom |
| Primary CTA | Dropdown | `/trial` · `/assessment` · `/product` · `/quote` · `/pay` · `/contact` |
| UTM campaign | Text | e.g. `tl_nl_2026_08_soft` |
| Approved by | People | You |
| Frappe Newsletter | URL / text | Desk Newsletter name or link after create |

**Recurring task:** “Fortnightly newsletter” — due every 14 days, template = checklist below.

### Optional list: `Newsletter Themes`

Backlog of angles (one card each). Pull into Cadence when scheduling.

---

## 3. Fortnightly checklist (every task)

Copy into the recurring task description:

```text
[ ] Pick audience (default TL Marketing; segment only if industry copy)
[ ] Pick theme + one CTA path + utm_campaign
[ ] Run AI draft prompt (section 5) → paste into task comment / Doc
[ ] Human edit for Trust voice + no stack brands + honest Version 001/002 claims
[ ] Move to Review → you approve → status Approved
[ ] Desk: Newsletter → audience Email Group → paste HTML (Use HTML)
[ ] Confirm Sender = sales@ + display name (general TrustLedger or segment From)
[ ] Send Test to yourself → check links + footer unsubscribe
[ ] Send → status Sent; note date + Newsletter name in task
[ ] Log 2–3 reply themes; promote warm replies to CRM Lead notes
[ ] Park next theme Idea for +14 days
```

---

## 4. Handoff: ClickUp Approved → Frappe send

1. Open approved HTML (task attachment or ClickUp Doc). Prefer starting from a pack in `docs/exports/email-marketing/` (`00-shell.html` wrapper or an existing `01`–`04` / `10`–`15` pack).  
2. Desk → **https://app.trustledger.co.za** → **Newsletter** → New (or open draft).  
3. **Email Group** = `TL Marketing` or the matching `TL Segment …`.  
4. Paste HTML (Use HTML). Absolute CTAs to `https://trustledger.co.za/...` with  
   `utm_source=email&utm_medium=bulk&utm_campaign=<field>`.  
5. Sender email `sales@trustledger.co.za`; Sender name per `SEGMENT_INTROS.md` when segment.  
6. **Send Test** → you → then **Send**.  
7. ClickUp → `Sent`. Track queue/bounces in Desk **Email Queue** if needed.

**Do not:** auto-send from ClickUp Automations to the list. Automations may only move statuses, assign, or remind — never SMTP blast.

---

## 5. AI assist prompts (ClickUp AI / Super Agent)

Paste into ClickUp AI when status = `Drafting`. Always attach or paste the prior approved send if any (for tone consistency).

### 5.1 System / constraints (paste once per draft)

```text
You draft TrustLedger marketing newsletter copy for South African / Global South
infrastructure and community-trust operators.

Rules:
- Product name: TrustLedger only. Promise: Resolution you can audit.
- Voice: Trust — calm, institutional; lead with trust outcomes and auditability.
- Never name Frappe, Vercel, HubSpot, Interserv, AccordBridge, or Paystack in body.
- Hosting = “TrustLedger Cloud” / “cloud” if needed.
- Version 001 = live grievance desk. Version 002 = Stakeholder Intelligence on Cloud for entitled plans — do not over-claim full TEDS / ESIP / offline app.
- AI Assist = suggest only; humans apply before save. Never say AI closes cases.
- Sample demo desk is retired; point to product overview + trial with own data.
- One primary CTA. Short subject (≤55 chars) + preheader (≤90 chars).
- Output: Subject, Preheader, Body (HTML-friendly short paragraphs + one teal CTA label), Footer note (unsubscribe stays in Frappe template).
- Operator Chibase only in legal footer if mentioned — never co-brand the hero.
```

### 5.2 Draft request (fill brackets)

```text
Audience: [TL Marketing | TL Segment …]
Theme: [e.g. readiness before the next site meeting]
Angle: [one sentence]
Primary CTA path: [/assessment | /trial | /product | …]
utm_campaign: [tl_nl_YYYY_MM_slug]
Base pack to match tone: [01-soft-launch | 02-trial-invite | 04-assessment-nudge | segment intro]
Length: ~180–280 words body.
Include one reflective readiness-style question (intake / ownership / engagement / reporting) without running a full quiz in email.
```

### 5.3 Rewrite after your comments

```text
Revise the draft using my notes below. Keep Trust voice and the same CTA.
Do not invent features. Notes:
[paste your bullets]
```

### 5.4 Consistency pass (before Review)

```text
Diff this draft against our brand bans and honesty rules. List only violations
and a corrected sentence for each. Then output a clean final Subject + Body.
```

---

## 6. Theme rotation (starter backlog)

Use as ClickUp `Newsletter Themes` cards; one per fortnight:

| # | Theme | Default CTA | Pack hint |
|---|--------|-------------|-----------|
| 1 | Soft launch / what TrustLedger is for | `/product` | `01-soft-launch` |
| 2 | Free SRM readiness diagnostic | `/assessment` | `04-assessment-nudge` |
| 3 | 14-day own-data trial (no sample INC-*) | `/trial` | `02-trial-invite` |
| 4 | Ward-to-board trust trail | `/product` | shell + custom |
| 5 | Commitments after the tent | `/trial` | segment social / construction |
| 6 | Quote / Institutional multi-project | `/quote` | `03-quote-followup` |

After six cycles, reuse angles with fresh proof (a feature sharpening, a checklist, a segment story) — not the same subject line.

---

## 7. Automation allowed in ClickUp (safe)

| Automation | OK? |
|------------|-----|
| Every 14 days → create Cadence task from template | Yes |
| Status `Review` → notify you | Yes |
| Status `Approved` → assign Desk operator + due “paste to Frappe today” | Yes |
| Status `Sent` → create next Idea +14 days | Yes |
| AI auto-send email to `TL Marketing` | **No** |
| Post approved HTML to a public webhook that sends mail | **No** (v1) |

**Later (optional packet):** Approved → webhook creates a **draft** Frappe Newsletter only; send remains manual in Desk.

---

## 8. Definition of done (each send)

- [ ] ClickUp showed `Approved` before Desk Send  
- [ ] Audience = intended Email Group  
- [ ] Send Test received; CTAs open trustledger.co.za with UTM  
- [ ] No stack vendor names in subject/body  
- [ ] Task = `Sent` with date + Newsletter name  

---

## 9. Related docs

| Doc | Role |
|-----|------|
| `docs/FRAPPE_EMAIL_MARKETING.md` | Desk send SoT |
| `docs/exports/email-marketing/SEGMENT_INTROS.md` | Segment From names + packs |
| `docs/exports/email-marketing/contacts/SEGMENTATION.md` | Who is on which list |
| `docs/PLATFORM_STRATEGIC_BRIEF.md` §6 | Approved public lines |
| `docs/DESIGN_SYSTEM.md` | Brand tokens |
| `docs/THEMBA.md` | Public visitor agent (separate from bulk email) |
| `docs/MARKETING_ENGINE.md` | MKT-1 social engine (Gemini + ClickUp HITL + Zernio). Separate list; never email. |
