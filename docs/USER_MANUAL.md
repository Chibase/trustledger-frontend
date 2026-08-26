# TrustLedger user manual

**Audience:** New Plan Owners and desk users on trial or live Cloud.  
**Companion:** In-app **Setup wizard** + `/app/guide` · Video script `docs/ONBOARDING_VIDEO_SCRIPT.md`.

TrustLedger is a Social Relations Management (SRM) desk: projects, people, engagements, commitments, grievances, evidence, and reports. Your workspace starts **empty on purpose** — you seed real (or practice) data and add records as fieldwork continues.

---

## 1. How you get in

| Path | Who | What happens |
|------|-----|----------------|
| **Trial** (`/trial`) | Self-serve | 14-day own-data workspace in the browser; plan cookie set |
| **Subscribe** (`/pay`) | Paying | Paystack trial authorize or pay-now → Owner provision |
| **Live login** (`/login/live`) | Provisioned Owners / VIP | Email + password + OTP → Frappe Cloud session |
| **Invite accept** | Juniors | Join at the desk tier your Plan Owner assigned |

**Product name in the UI:** TrustLedger only.

After first entry, a **Setup wizard** opens once (unless you dismiss it). Reopen anytime from **Guide** in the nav or **Settings → User guide**.

---

## 2. The seeding spine (memorise this)

Do **not** start with Reports. Seed in this order:

```text
1. Project          → site / programme container
2. Engagement plan  → RFP / briefing → process (Project plan+, optional)
3. Stakeholders     → people & organisations (Project plan+)
4. Engagements      → meetings & contact (Project plan+)
5. Commitments      → promises with owners (Project plan+)
6. Incidents        → grievances / cases
7. Capture / files  → minutes & evidence (by plan)
8. Reports          → compose from saved work
```

**Solo** skips Stakeholder Intelligence modules (2–5 and Capture hub). Solo still uses Project → Incidents → Issue intake → Monthly report.

---

## 3. Left navigation (workspace map)

| Nav item | Purpose |
|----------|---------|
| **Dashboard** | Executive portfolio — projects, empowerment, engagement plans, cases |
| **Capture** | Minutes / registers with field templates → extract → apply (Project+) |
| **Engagements** | Log meetings and consultations (Project+) |
| **Engagement plan** | Compose a SEP from an RFP / tender / briefing; apply to SRM after approval (Project+) |
| **Commitments** | Promise board and statuses (Project+) |
| **Intelligence** | ESG / indicator cards (Project+) |
| **Stakeholders** | SRM registry (Project+) |
| **Projects** | Light project list and detail |
| **Incidents** | Grievance / case desk |
| **Report issue** | Guided field intake |
| **Reports** | Activity + report packs (monthly / executive / board by plan) |
| **Guide** | This manual’s in-app checklist + reopen wizard |
| **Settings** | Plan, seats, desk privileges, media, entitlements |

If a module is missing, it is usually a **plan gate**, not a broken screen. Upgrade paths appear on locked features.

---

## 4. First-week setup (recommended)

### Day 1 — Container

1. Open **Projects**. Rename or edit “My first project” (trial) or create one with the real site name.  
2. Add place / ward context when fields are available.  
3. Keep count small (Solo = 1 active project).

### Day 1–2 — People (Project+)

1. If you have a briefing, tender, or RFP, open **Engagement plan**, paste or upload it, compose the sector process, and save the presentable document. Apply to SRM only after the assignment is approved.  
2. Open **Stakeholders**.  
3. Add ~5 people you already meet this week (community, contractor, client, liaison) — or review the prospect rows the plan applied.  
4. Prefer five named humans over fifty empty rows.

### Ongoing — Contact & promises (Project+)

1. After each meeting, log an **Engagement** linked to project + stakeholders. Prefer the **Meeting minutes** or **Attendance register** template (Capture hub, or `/resources`) so names and actions map on first paste.  
2. Promote promises to **Commitments** with an owner and status.  
3. Update commitment status as fieldwork moves — do not wait for month-end.

### When harm or a complaint arrives

1. Open **Incidents** → create a case on the project.  
2. Record what happened, who is affected, urgency.  
3. If **AI Assist** is on your plan: read the suggestion → edit → **Apply** → **Save**. AI never writes the official record alone.  
4. Attach evidence (photos, registers) within your plan’s media quota.

### Reporting cycle

1. Open **Reports** only after the desk has activity.  
2. Start with the **Monthly operational** pack.  
3. Higher plans unlock Executive and Board packs.  
4. Review before sharing externally. Empty reports mean empty desk work — seed more, do not invent fiction.
5. On a report presentation, report library item, or case desk, use **Discussion & feedback** to leave feedback, request information, or propose a meeting. Given and responded times are stamped (with your plan). Meeting proposals capture a calendar item; Project+ can also create a draft Engagement.

---

## 5. Daily loop (after first seed)

```text
Meet → Engagement
Promise → Commitment
Complaint → Incident + evidence
Week / month → Report
Anytime → refine Stakeholders & Project
```

Stop batch-loading after the first seed. Put TrustLedger on the agenda of the next site meeting.

---

## 5a. Stakeholder engagement plan (Project+)

Use **Engagement plan** when the work starts as a briefing, tender, or RFP rather than as already-named people.

1. Paste or upload the extract (PDF with a text layer, or .txt / .md / .csv).  
2. Confirm or override the **sector playbook** (infrastructure, housing, mining, energy, water, education, health, agriculture, municipal, conservation, logistics, or generic).  
3. **Compose suggestion** — a seven-phase process from inception to close-out, stakeholder classes, methods, standing commitments, and a presentable document. Edit the title and purpose.  
4. **Save**, then present the document (Print / PDF) or walk the process dashboard.  
5. After the client approves the assignment, **Apply to SRM**. Prospect stakeholders, draft engagements, and open commitments land on the existing desks. Duplicate names/titles are skipped. Humans apply; the composer never writes the live desk alone.

On the **Executive dashboard** (`/app/dashboard`), **Engagement plan** is a primary button next to the page heading. The **Stakeholder engagement plans** module sits immediately under that heading (not below the empowerment KPIs). If the workspace plan does not include it, the same card stays on screen with an upgrade note. Linked plans also appear on a **project dashboard**. Plans stay in this workspace until a Cloud document type exists. Applied rows follow the same live/trial path as the rest of Stakeholder Intelligence.

---

## 6. AI Assist rules

- Pattern: **suggest → human apply → save**  
- Never claim or expect autonomous grievance closure  
- Solo has **no** AI Assist — upgrade to Practitioner for that step-up  

---

## 7. Plans (feature boxes)

| Plan | Seats | What you get |
|------|-------|----------------|
| **Solo** | 1 | Essential desk, 1 project, monthly report — no AI / SI |
| **Practitioner** | 1 (owner) | + AI Assist, light governance, more media |
| **Project** | Owner + juniors | + Capture, Stakeholders, Engagements, Commitments, SI |
| **Institutional** | Custom | Programme / board depth — sales-scoped |

Details: `docs/SOLO_PLAN.md`, `docs/ACCESS_MODEL.md`, `docs/PLATFORM_STRATEGIC_BRIEF.md`.

---

## 8. Trial vs live data

| Mode | Data lives in | Note |
|------|----------------|------|
| **Trial** | Browser org store | Empty of sample INC-*; your seed only |
| **Live** | Frappe Cloud | Empty Cloud stays empty until you create records |
| Sample `/demo` | Retired | Use `/product` then `/trial` |

---

## 9. Seats & Settings (Plan Owner)

- Only the **Plan Owner** invites juniors (not on Solo / Practitioner by default).  
- Invitees get a **lower** desk tier than the Owner.  
- **Settings** also holds media library, report pack access, and capability toggles (within your plan).  

---

## 10. Getting help

- In-app **Support** / **Feedback** drawers (shell)  
- Marketing **Contact** → Vercel form → Frappe CRM Lead  
- Operator walkthrough: book via Contact  
- Video production script: `docs/ONBOARDING_VIDEO_SCRIPT.md`  

---

## 11. What not to expect (honest limits)

- No Stats SA live certified feeds yet  
- No native offline mobile app  
- No public community portal yet  
- No auto-resolve by AI  
- Media storage is capped by plan on purpose  

---

*Resolution you can audit.*
