# WordPress CTA → TrustLedger Demo

Paste these into the Webway WordPress site (`trustledger.co.za`) so visitors reach the Vercel Demo.

## Recommended URLs

Replace the host if your Vercel production domain differs:

| CTA | URL |
|-----|-----|
| Primary | `https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=try_demo` |
| Home | `https://trustledger-frontend-pi.vercel.app/?utm_source=wordpress&utm_medium=cta&utm_campaign=home` |

When custom domain is ready: `https://app.trustledger.co.za/demo?...`

## Button block (HTML)

```html
<p class="tl-cta">
  <a class="tl-cta__btn"
     href="https://trustledger-frontend-pi.vercel.app/demo?utm_source=wordpress&utm_medium=cta&utm_campaign=try_demo"
     target="_blank"
     rel="noopener noreferrer">
    Try the interactive demo
  </a>
</p>
```

## Optional CSS (Customizer → Additional CSS)

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
.tl-cta__btn:hover { background: #085f4d; }
```

## Where to place

1. Homepage hero — primary CTA  
2. Pricing / Pilot page — “See it first”  
3. Assessment thank-you — “Explore the product”  

## Tracking

UTM params above show up in Vercel/analytics. Lead emails from the in-app soft-gate are stored in browser `localStorage` until a CRM endpoint is wired.
