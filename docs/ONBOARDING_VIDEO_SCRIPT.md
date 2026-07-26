# TrustLedger onboarding video — master script & AI prompt

**Purpose:** Train new clients to navigate the SRM desk: seed initial data, add records as work happens, generate reports, and work day-to-day without fictional demo data.

**Product:** TrustLedger — Social Relations Management (SRM) for infrastructure / community trust.  
**App URL (production):** `https://trustledger-frontend-pi.vercel.app`  
**Brand:** TrustLedger only (never “AccordBridge”).  
**Voice:** Clear, calm, institutional — Global South field ledger tone.  
**Look:** Cool stone surfaces, deep ink text, teal accent `#0e7c66` — not purple SaaS chrome.

---

## What this agent / studio cannot do

Cursor agents do **not** render finished product walkthrough videos. Use this file as:

1. **Narration script** for a human screen-recording (best accuracy), or  
2. **Master prompt** for a video AI (Runway / HeyGen / Synthesia / CapCut AI) that must invent UI only if you cannot supply screen captures — prefer real product footage.

**Recommended production mix**

| Layer | Source |
|-------|--------|
| UI | Real screen recording of `/trial` or a sandboxed live org |
| Voice | AI voiceover reading the narration below |
| B-roll / title cards | Optional AI motion graphics from the master prompt |
| Length | Target **8–12 minutes** (or split into 5 shorts — see Part C) |

---

## Part A — Master prompt (for a video AI that knows nothing about the product)

Copy everything in this box into the video tool as the **system / style brief**, then feed **Part B** scene-by-scene.

```text
You are producing an onboarding walkthrough video for TrustLedger, a Social Relations Management (SRM) web product used by consultants, site teams, and community liaison officers on mining, energy, infrastructure, and public-sector projects in Africa and the Global South.

PRODUCT IN ONE SENTENCE:
TrustLedger turns community risk into an auditable resolution desk — projects, stakeholders, engagements, commitments, grievances/incidents, evidence, and governance reports — with AI that only suggests; humans always apply and save.

AUDIENCE:
New Plan Owners on their first day. They may be lone consultants or small SI desks. They start with an EMPTY workspace (no sample cases). Teach them the correct seeding order and the daily loop.

MUST COMMUNICATE:
1. Empty workspace is intentional — they seed their own real (or practice) data.
2. Correct first-week order: Project → Stakeholders → Engagements → Commitments → Incidents/grievances → Capture evidence → Reports.
3. “Add as you go” — do not try to load everything on day one.
4. AI Assist is suggest → human Apply → Save. Never auto-resolve.
5. Reports are composed from their desk evidence (monthly / executive / board packs by plan).
6. Trial = own browser workspace; Live = Frappe Cloud login for paying / provisioned accounts.

VISUAL STYLE:
Institutional field-ledger UI: light grey paper background (#f3f5f7), white panels, teal primary buttons (#0e7c66), amber for urgency, no purple gradients, no neon glow, no emoji stickers, no floating promo badges. Typography feel: clean sans for UI, restrained serif only for the TrustLedger wordmark. Widescreen 16:9. Soft zooms on cursor clicks; 0.4s fades between chapters. On-screen labels in English (South African English spelling where relevant: organisation, licence).

NARRATION STYLE:
Calm female or male professional voice, South African or neutral international English, 145–160 words per minute. Short sentences. No hype words (“revolutionary”, “game-changer”). Prefer “desk”, “case”, “commitment”, “trust pulse”, “Plan Owner”.

HARD FORBIDDEN CLAIMS:
- Do not invent Stats SA live feeds, offline native apps, or auto-closing grievances.
- Do not show fictional INC-* sample cases as the client’s real data.
- Do not say AI will resolve issues without a human.
- Product name on screen and voice: TrustLedger only.

STRUCTURE:
Chapter titles on screen. Cursor highlights the left nav items as they are named. End each chapter with a one-line “Do this next” tip.
```

---

## Part B — Full narration script (shot list)

**Total ~10 minutes.** Timecodes are approximate.

### 0. Cold open (0:00–0:35)

**On screen:** TrustLedger wordmark → app shell with empty dashboard.  
**VO:**  
“Welcome to TrustLedger — your Social Relations Management desk. This walkthrough shows how to seed your first project data, keep adding records as fieldwork continues, raise and close grievances, and generate reports your client or funder can trust. Your workspace starts empty on purpose. Nothing here is sample theatre. You build the ledger as you go.”

**Tip card:** *Empty is correct. Seed in order.*

---

### 1. How you enter (0:35–1:20)

**Show:** `/product` → `/trial` form (name, work email, plan) → `/app/dashboard`. Mention live path briefly.  
**VO:**  
“Public onboarding starts at Product, then Trial — a fourteen-day workspace on your own data. Paying Plan Owners and VIP guests use Live login with email verification. Either way, open the app shell. Left navigation is your map: Dashboard, Projects, Stakeholders, Engagements, Commitments, Incidents, Capture, Reports, Settings.”

**Tip card:** *Trial = practice on your data. Live = Cloud for provisioned accounts.*

---

### 2. Seeding order — the spine (1:20–2:00)

**On screen:** Simple vertical diagram:

```text
1 Project
2 Stakeholders
3 Engagements
4 Commitments
5 Incidents / grievances
6 Capture / evidence
7 Reports
```

**VO:**  
“Memorise this spine. First create a Project — the site or programme container. Then register Stakeholders — people and organisations who matter. Log Engagements when you meet them. Promote promises to Commitments so they stay visible. When harm or a complaint arrives, open an Incident on the grievance desk. Attach evidence through Capture or the case. Only then generate Reports — they compose from what you already saved.”

**Tip card:** *Do not start with Reports. Reports need a desk that already has work.*

---

### 3. Create your first project (2:00–3:00)

**Show:** `/app/projects` → New → name, location/geo fields if shown → save → open detail.  
**VO:**  
“Open Projects and create one active project. Use the real site name your team already uses in meetings — for example a mine package, a substation corridor, or a municipal programme. Add place context when the form offers geo or ward fields. Keep project count small at first: Solo plans allow one active project; higher plans allow more. You can refine details later.”

**Do this next:** *One project you can defend in a client call.*

---

### 4. Seed stakeholders (3:00–4:00)

**Show:** `/app/stakeholders` → create 3–5 records (community leader, contractor, client, ward liaison).  
**VO:**  
“Open Stakeholders — your Social Relations registry. Add a short first list: a community representative, a contractor contact, a client sponsor, and your own liaison role if needed. Capture name, organisation, role, and how you reach them. You are not building a full CRM dump on day one. You are planting the people who already appear in this week’s meetings.”

**Do this next:** *Five named humans beat fifty empty rows.*

---

### 5. Log an engagement (4:00–4:45)

**Show:** `/app/engagements` → new engagement linked to stakeholder + project.  
**VO:**  
“When you meet, call, or receive minutes, log an Engagement. Link it to the project and the stakeholders who attended. Note the purpose, date, and outcome in plain language. Engagements are the memory of contact. Without them, commitments and grievances float without context.”

**Do this next:** *Log yesterday’s real meeting before inventing future ones.*

---

### 6. Promote commitments (4:45–5:30)

**Show:** `/app/commitments` board — open / in progress / done (or equivalent statuses).  
**VO:**  
“Promises made in engagements belong on the Commitments board. Promote or create a commitment with an owner, due cue, and status. This is how TrustLedger keeps social licence visible between visits. Update status as fieldwork moves — do not wait for month-end.”

**Do this next:** *One open commitment with a named owner.*

---

### 7. Grievance / incident desk (5:30–6:30)

**Show:** `/app/incidents` → new case → assist panel if plan includes AI → Apply → Save. Issue intake `/app/issues/report` optional.  
**VO:**  
“When a complaint or site issue arrives, open Incidents — the grievance desk. Create the case against your project. Record what happened, who is affected, and urgency. If your plan includes AI Assist, TrustLedger may suggest triage language or next steps. Read the suggestion, edit it, press Apply, then Save. AI never writes the official record without you. Use Issue intake when field staff need a guided report form.”

**Do this next:** *One practice case, then delete or close it if it was only training.*

---

### 8. Capture hub & evidence (6:30–7:15)

**Show:** `/app/capture` (if entitled) and attaching media / evidence on a case. Mention plan gates briefly.  
**VO:**  
“Capture is where minutes, registers, and field notes become structured desk data. Paste or upload what you have; when AI extract is available, review every proposed stakeholder or action, then Apply only what is true. Photos and documents become evidence on the case. Storage is limited by plan — keep files lean and relevant.”

**Do this next:** *Attach one real artefact to one case or engagement.*

---

### 9. Reports that boards can read (7:15–8:15)

**Show:** `/app/reports` — monthly operational pack; mention executive / board packs on higher plans.  
**VO:**  
“Open Reports when the desk already has activity. Start with the Monthly operational report — narrative plus graphs for period activity, cases, and trust signals. Higher plans unlock Executive and Board packs for risk and assurance audiences. Reports compose from your saved evidence. If a report looks empty, seed more desk work — do not invent Cloud month-end fiction. Always review before you share externally.”

**Do this next:** *Generate one monthly draft and export or print after review.*

---

### 10. Daily loop — add as you go (8:15–9:00)

**On screen:** Loop diagram:

```text
Meet → Engagement
Promise → Commitment
Complaint → Incident + evidence
Week/month → Report
Anytime → refine Stakeholders & Project
```

**VO:**  
“After the first seed, stop batch-loading. Work the daily loop. Every meeting becomes an engagement. Every promise becomes a commitment. Every complaint becomes an incident with evidence. Every reporting cycle pulls from what you already trusted enough to save. Dashboard and Trust Pulse show whether the desk is healthy. Settings is where the Plan Owner invites juniors — only on plans that allow seats — and reviews entitlements.”

**Do this next:** *Put TrustLedger on the agenda of your next site meeting.*

---

### 11. Plans in one breath (9:00–9:30)

**On screen:** Solo → Practitioner → Project → Institutional (no hard sell).  
**VO:**  
“Solo is the essential one-seat desk. Practitioner adds AI Assist and light governance depth. Project unlocks multi-seat Stakeholder Intelligence — capture, registry, engagements, commitments. Institutional is sales-scoped for programmes and boards. Features you do not see are usually a plan gate, not a broken screen.”

---

### 12. Close (9:30–10:00)

**VO:**  
“You now know the TrustLedger spine: Project, people, contact, promises, cases, evidence, reports — seeded once, then updated as you go. Resolution you can audit. Open your workspace, create one project, and log the next real engagement before the day ends.”

**End card:**  
`https://trustledger-frontend-pi.vercel.app/product`  
Support / walkthrough: Contact on the marketing site or your Plan Owner channel.

---

## Part C — Split into five short videos (optional)

| # | Title | Script sections | Length |
|---|--------|-----------------|--------|
| 1 | Empty desk & entry | 0–2 | ~2 min |
| 2 | Seed project & stakeholders | 3–4 | ~2.5 min |
| 3 | Engagements & commitments | 5–6 | ~2 min |
| 4 | Incidents, AI apply, capture | 7–8 | ~2.5 min |
| 5 | Reports & daily loop | 9–12 | ~2.5 min |

---

## Part D — Shot checklist for a human editor

Record in a **clean trial org** (or VIP sandbox), never a client’s live cases:

- [ ] Empty dashboard first frame  
- [ ] Create Project  
- [ ] Create 3 stakeholders  
- [ ] One engagement  
- [ ] One commitment on the board  
- [ ] One incident with Apply on an AI suggestion (Practitioner+), or skip AI on Solo and say so on screen  
- [ ] Capture or attach one file  
- [ ] Open Reports → Monthly pack  
- [ ] Left-nav tour with labels  
- [ ] 5-second TrustLedger end card  

**Privacy:** Blur real phone numbers and ID numbers. Use fictional but plausible names (ward, contractor) — not INC-* demo IDs from old sample data.

---

## Part E — One-paste prompt for “generate full video” tools

If the tool only accepts a single prompt (no scene list), paste:

```text
Create an 10-minute 16:9 onboarding video for TrustLedger, an SRM web app for community trust on African infrastructure projects. Style: calm institutional explainer, teal (#0e7c66) and stone UI, no purple neon. Narrator: clear professional English.

Chapters with on-screen titles:
1) Empty workspace is intentional
2) Enter via Product/Trial or Live login; tour left nav
3) Seeding spine: Project → Stakeholders → Engagements → Commitments → Incidents → Capture → Reports
4) Create first project
5) Add five stakeholders
6) Log one engagement
7) Promote one commitment
8) Open one grievance incident; AI is suggest → Apply → Save only
9) Capture evidence
10) Generate monthly report from saved work
11) Daily loop: meet/promise/complaint/report
12) Plans: Solo, Practitioner, Project, Institutional briefly
13) CTA: create one project and log the next real engagement

Do not claim autonomous AI resolution, Stats SA feeds, offline native apps, or preloaded sample INC cases. Product name: TrustLedger only.
```

---

## Part F — Where this lives in the product

| Placement | Status / idea |
|-----------|----------------|
| In-app Setup wizard + `/app/guide` | **Shipped (UG-1 / ADR-036)** — plan-aware seeding checklist |
| Written manual | `docs/USER_MANUAL.md` |
| `/product` | Mentions setup wizard; add “Watch onboarding” when a hosted video URL exists |
| Settings | “Launch setup wizard” / Open Guide |
| WordPress Resources | Link Guide after login or host the video URL |
| Email pack | Soft-launch / trial newsletter CTA |

Host the finished video on Vercel Blob, YouTube unlisted, or Webway media — keep the canonical link in Ops notes when published.
