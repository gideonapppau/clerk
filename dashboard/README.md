# Clerk Dashboard

Next.js admin panel for Clerk merchants. Manage inventory, view orders, configure payments, monitor conversations, and access founder analytics.

## Stack

- **Next.js** (App Router)
- **React** / TypeScript
- **Tailwind CSS**

## Running

```bash
cd app
npm install
npm run dev
# Runs on http://localhost:3001
```

## Pages

### Merchant Dashboard
- `/dashboard` — Overview with stats
- `/dashboard/inventory` — Product management
- `/dashboard/orders` — Order history
- `/dashboard/conversations` — Active conversations
- `/dashboard/payments` — Payment method setup
- `/dashboard/billing` — Subscription management
- `/dashboard/settings` — Account settings
- `/dashboard/whatsapp` — WhatsApp connection

### Onboarding
- `/onboarding` — New merchant setup flow
- `/onboarding/connect` — Connect WhatsApp
- `/onboarding/inventory` — Add first products
- `/onboarding/live` — Go live

### Checkout
- `/checkout` — Customer payment page

### Founder (Admin)
- `/founder` — Platform overview
- `/founder/merchants` — Merchant list
- `/founder/funnels` — Conversion funnels
- `/founder/insights` — Analytics
- `/founder/pipeline` — Sales pipeline
- `/founder/outreach` — Outreach tracking
- `/founder/scorecard` — Scorecards
- `/founder/reliability` — System reliability
- `/founder/health` — Onboarding health

## Environment Variables

This dashboard talks to the Core API. Set `NEXT_PUBLIC_API_URL` to point to the Core service.
