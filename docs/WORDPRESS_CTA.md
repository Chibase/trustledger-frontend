# WordPress CTA → TrustLedger product links

Marketing site: `https://trustledger.co.za`  
Product (Vercel): `https://trustledger-frontend-pi.vercel.app`  
Desk (Frappe Cloud): `https://app.trustledger.co.za`

## Link map (open trial — Jul 2026)

| CTA | URL |
|-----|-----|
| **Start 14-day trial** (no login) | `https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=trial_14day` |
| Trial · Starter lens | `https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=trial_starter` |
| Trial · Growth lens | `https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=trial_growth` |
| Subscribe / quote options | `https://trustledger-frontend-pi.vercel.app/trial?utm_source=wordpress&utm_medium=cta&utm_campaign=start_trial` |
| Open product (guest OK) | `https://trustledger-frontend-pi.vercel.app/app/dashboard?utm_source=wordpress&utm_medium=cta&utm_campaign=dashboard` |
| Sign in (staff / operators) | `https://trustledger-frontend-pi.vercel.app/login/live?utm_source=wordpress&utm_medium=cta&utm_campaign=live_login` |
| App marketing home | `https://trustledger-frontend-pi.vercel.app/?utm_source=wordpress&utm_medium=cta&utm_campaign=home` |
| SRM assessment (full page) | `https://trustledger-frontend-pi.vercel.app/assessment?utm_source=wordpress&utm_medium=cta&utm_campaign=srm_diagnostic` |
| SRM assessment (embed) | `https://trustledger-frontend-pi.vercel.app/assessment?embed=1&utm_source=wordpress&utm_medium=embed&utm_campaign=srm_diagnostic` |
| Team desk (Frappe) | `https://app.trustledger.co.za` |
| Request quote (any plan) | `https://trustledger-frontend-pi.vercel.app/quote?utm_source=wordpress&utm_medium=cta&utm_campaign=request_quote` |
| Quote Practitioner | `https://trustledger-frontend-pi.vercel.app/quote?plan=practitioner&utm_source=wordpress&utm_medium=cta&utm_campaign=quote_practitioner` |
| Quote Project | `https://trustledger-frontend-pi.vercel.app/quote?plan=project&utm_source=wordpress&utm_medium=cta&utm_campaign=quote_project` |
| Quote Institutional | `https://trustledger-frontend-pi.vercel.app/quote?plan=institutional&utm_source=wordpress&utm_medium=cta&utm_campaign=quote_institutional` |
| Buy Practitioner (Paystack) | `https://trustledger-frontend-pi.vercel.app/pay?plan=practitioner&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_practitioner` |
| Buy Project (Paystack) | `https://trustledger-frontend-pi.vercel.app/pay?plan=project&utm_source=wordpress&utm_medium=cta&utm_campaign=buy_project` |
| Institutional / contact | `https://trustledger-frontend-pi.vercel.app/contact?utm_source=wordpress&utm_medium=cta&utm_campaign=buy_institutional` |
| Chibase Consulting | `https://chibaseconsulting.co.za` |
| Contact | `mailto:info@trustledger.co.za` |

## Behaviour notes

- **Start 14-day trial** → `/demo` auto-enters `/app` as a guest. **No login / no email** to explore. Email is asked only to **print** or **save**.
- **Subscribe / quote options** → `/trial` for capture → explore **or** quote / Paystack path (keep for buyers who are ready to pay).
- **Open product** → `/app/dashboard` works for trial guests (demo mode).
- **Sign in** → staff / platform operators only (`/login/live` → Frappe Cloud).
- **Assessment** → public diagnostic; results unlock after name + work email (HubSpot when configured).
- **Request quote** → `/quote` → CRM Lead; EFT confirm in Ops → Finance.
- **Buy / Paystack** → `/pay` when KYC allows; otherwise prefer quote.

**WordPress action required:** every primary “Start trial” / “Walkthrough” button should use **`/demo?...utm_campaign=trial_14day`** (open trial). Use `/trial` only for “Subscribe / quote options”.

## WordPress Home page (conversion)

**Full-page paste:** replace the Home page Custom HTML with [`docs/wordpress/page-home.txt`](wordpress/page-home.txt).

1. Ensure Additional CSS is the latest [`docs/wordpress/additional-css.css`](wordpress/additional-css.css) (or append [`home-conversion-css-patch.css`](wordpress/home-conversion-css-patch.css)).
2. Pages → Home → paste Custom HTML from `page-home.txt` → Update.
3. Purge SpeedyCache → hard refresh `https://trustledger.co.za/`.

Primary CTA: **Start 14-day trial** → Vercel `/demo`.  
Admin login stays a utility link only.

## WordPress Assessment page

**Prefer full-page paste:** replace the Assessment page Custom HTML with [`docs/wordpress/page-assessment.txt`](wordpress/page-assessment.txt).

Embed-only snippet: [`docs/wordpress/assessment-embed.html`](wordpress/assessment-embed.html).

Purge SpeedyCache after paste.

## Button block (quick paste)

```html
<p class="tl-cta">
  <a class="tl-cta__btn"
     href="https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=trial_14day"
     target="_blank"
     rel="noopener noreferrer">
    Start 14-day trial
  </a>
</p>
```

```css
.tl-cta { margin: 1.5rem 0; }
.tl-cta__btn {
  display: inline-block;
  background: #0e7c66;
  color: #fff !important;
  text-decoration: none;
  font-weight: 600;
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
}
```
