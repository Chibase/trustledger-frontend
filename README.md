This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Role-based dashboard (dev)

The dashboard requires a signed-in user. Without a session, `/dashboard` redirects to `/login?next=/dashboard`.

Use the login page to pick a role (`client`, `contractor`, `community`, `admin`). That sets a `session-role` cookie and sends you back to the dashboard.

Alternatively, set a default role via environment variable (skips login when middleware sees a valid dev role):

```bash
# .env.local
NEXT_PUBLIC_DEV_ROLE=client
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_AI_MOCK=true
```

Restart the dev server after changing env values.

## AI assist hooks (Grok-ready)

Continuous AI UI is sketched against future `srm-core` methods. The browser never calls xAI directly — `src/services/aiService.ts` either mocks responses or posts to Frappe.

| Route | Role focus | AI hook |
|-------|------------|---------|
| `/issues/report` | community, contractor | Triage suggestion (category, area, priority) |
| `/incidents/[id]` | all signed-in roles | Draft community reply + sentiment estimate |
| `/dashboard` | client, admin | Compliance / board brief draft |

Flow: **suggest → human apply/confirm → save**. Mock mode is on by default (`NEXT_PUBLIC_AI_MOCK=true`).

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
