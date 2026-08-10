# Newsletter personalization (first name)

## Why you saw “Hello there”

Frappe **Newsletter** renders Jinja **once** for the whole blast (`doc` = the Newsletter), then queues the **same HTML** to every recipient.  
`{{ first_name or "there" }}` therefore always becomes **there** (including **Send Test**).

That is a platform limitation — not a bad Email Group.

## What we changed

1. Greeting is now:

   `Hello{% if tl_first_name %} {{ tl_first_name }}{% endif %},`

   - Desk Newsletter / Send Test → **`Hello,`** (no awkward “there”)
   - Personalized sender (below) → **`Hello Lunga,`** when a first name exists

2. **`custom_first_name`** on **Email Group Member** (filled for ICP people; left blank for `info@` / `marketing@` role mailboxes).

## How to send personalized segment intros

Use the agent/ops script (per-recipient Communication send):

```bash
# Preview greetings only
npx tsx scripts/send-personalized-segment-email.mts \
  --template "TL Intro Construction" \
  --group "TL Segment Construction" \
  --sender-name "TrustLedger Construction" \
  --dry-run

# Send only to yourself first
npx tsx scripts/send-personalized-segment-email.mts \
  --template "TL Intro Construction" \
  --group "TL Segment Construction" \
  --sender-name "TrustLedger Construction" \
  --only you@yourdomain.co.za

# Send to the whole segment
npx tsx scripts/send-personalized-segment-email.mts \
  --template "TL Intro Construction" \
  --group "TL Segment Construction" \
  --sender-name "TrustLedger Construction"
```

Requires `.env.local` with `FRAPPE_BASE_URL` + API key/secret (same as Desk API user).

| Segment group | Template | Sender name |
|---------------|----------|-------------|
| TL Segment Construction | TL Intro Construction | TrustLedger Construction |
| TL Segment Government | TL Intro Government | TrustLedger Municipal |
| TL Segment Architects | TL Intro Architects | TrustLedger for Architects |
| TL Segment Engineers | TL Intro Engineers | TrustLedger Engineering |
| TL Segment Social Facilitators | TL Intro Social Facilitators | TrustLedger Community Practice |
| TL Segment Related Industries | TL Intro Related Industries | TrustLedger Practice |

## Desk Newsletter

Still fine for non-personalized or “Hello,” blasts. Prefer the script for named greetings.

## Maintaining names

Desk → **Email Group Member** → set **First Name**.  
Org mailboxes (`info@`, `hello@`, `marketing@`) should stay blank → `Hello,`.
