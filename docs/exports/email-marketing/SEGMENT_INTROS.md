# Segment intro emails (platform introduction)

Thought-provoking intros for each ICP Email Group. Loaded on Cloud as **Email Templates** + **draft Newsletters**.

## Reply / From identity

Outgoing mailbox stays **`sales@trustledgersrm.co.za`** (configured Email Account).  
Each segment uses a distinct **From display name** so replies feel relevant:

| Segment | From name (Newsletter) | Reply behaviour |
|---------|------------------------|-----------------|
| Construction | `TrustLedger Construction` | Replies → `sales@` inbox |
| Government | `TrustLedger Municipal` | Replies → `sales@` inbox |
| Architects | `TrustLedger for Architects` | Replies → `sales@` inbox |
| Engineers | `TrustLedger Engineering` | Replies → `sales@` inbox |
| Social Facilitators | `TrustLedger Community Practice` | Replies → `sales@` inbox |
| Related industries | `TrustLedger Practice` | Replies → `sales@` inbox |

**Optional later (Webway):** aliases such as `construction@trustledgersrm.co.za` → forward to `sales@`, then set Newsletter `sender_email` to the alias. Do not invent mailboxes in git.

In Desk Newsletter, confirm **Sender Name** + **Sender Email** before Send. Body copy also invites a reply with a segment-specific prompt.

## Templates ↔ audiences

| File | Email Template | Newsletter audience | Sample image |
|------|----------------|---------------------|--------------|
| `10-intro-construction.html` | `TL Intro Construction` | `TL Segment Construction` | `/marketing/email/construction.png` |
| `11-intro-government.html` | `TL Intro Government` | `TL Segment Government` | `/marketing/email/government.png` |
| `12-intro-architects.html` | `TL Intro Architects` | `TL Segment Architects` | `/marketing/email/architects.png` |
| `13-intro-engineers.html` | `TL Intro Engineers` | `TL Segment Engineers` | `/marketing/email/engineers.png` |
| `14-intro-social-facilitators.html` | `TL Intro Social Facilitators` | `TL Segment Social Facilitators` | `/marketing/email/social-facilitators.png` |
| `15-intro-related.html` | `TL Intro Related Industries` | `TL Segment Related Industries` | `/marketing/email/related-industries.png` |

Images are on Cloud Files (`https://app.trustledgersrm.co.za/files/tl-email-*.png`) and in this repo under `public/marketing/email/` for Vercel.

## Angle per segment (one-line)

| Segment | Provoking idea |
|---------|----------------|
| Construction | Site promises → trust debt; prove reinstatement & dust cases |
| Government | Ward-to-board before politics; SLA risk visible early |
| Architects | Stakeholder risk in the set before tender lock |
| Engineers | Evidence faster than rumour; audit-ready between meetings |
| Social Facilitators | After the tent — where commitments live |
| Related | Practice as a system ledger, not lost spreadsheets |

## Send checklist

1. Desk → **Newsletter** → open the draft for that segment.  
2. Confirm audience = matching **`TL Segment …`** group.  
3. Confirm **Sender Name** (table above) + **`sales@trustledgersrm.co.za`**.  
4. **Send Test** to yourself (check image + reply).  
5. Send to the segment (small lists first — Government / Social Facilitators are thin).  
6. File replies in CRM Lead with the right Source / comment.
