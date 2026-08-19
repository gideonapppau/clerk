# Clerk Database

PostgreSQL schema and migrations for the Clerk platform.

## Setup

```bash
psql -U postgres -d clerk -f schema.sql
```

## Migrations

Run in order (filenames are numbered):

```bash
for f in migrations/*.sql; do psql -U postgres -d clerk -f "$f"; done
```

Or individually:

```bash
psql -U postgres -d clerk -f migrations/001_initial.sql
psql -U postgres -d clerk -f migrations/002_merchant_auth.sql
# ... through 026
```

## Key Tables

| Table | Purpose |
|-------|---------|
| `merchants` | Merchant accounts, plans, WhatsApp connection |
| `inventory` | Product catalog per merchant |
| `conversations` | WhatsApp conversation tracking |
| `messages` | Individual messages in conversations |
| `orders` | Customer orders |
| `inventory_reservations` | Stock held for pending orders |
| `merchant_payment_methods` | Paystack / Moolre / MoMo configs |
| `merchant_push_subscriptions` | Web push subscriptions |
| `conversation_intents` | LLM intent classification log |
| `llm_usage` | Token usage tracking |
| `merchant_events` | Event log |
| `reliability_events` | System reliability tracking |
| `founder_scorecards` | Founder scorecards |
| `founder_outreach` | Outreach tracking |
| `founder_content` | CMS content |
| `founder_pipeline` | Sales pipeline |
