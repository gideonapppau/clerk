# Clerk Core

Go API server for the Clerk WhatsApp sales assistant. Handles conversation state management, intent classification, product matching, order processing, payment integration, and LLM-powered responses.

## Stack

- **Go 1.22** / Gin web framework
- **PostgreSQL** via `database/sql` + `lib/pq`
- **Groq / OpenAI** for LLM chat completions
- **Paystack** + **Moolre** for payments
- **Web Push** (VAPID) for merchant notifications

## Project Structure

```
cmd/server/main.go          Entry point, route wiring
internal/
  api/
    v1/                     All API handlers (auth, billing, checkout,
                            conversations, events, founder, inventory,
                            orders, payments, push, simulate)
    middleware/              JWT auth, CORS, rate limiting, webhook validation
    webhooks/               WhatsApp, Paystack, Moolre webhook handlers
  auth/                     JWT token signing and parsing
  billing/                  Plan limits, usage tracking
  commerce/                 Orders, inventory, events, messages
  config/                   Environment variable loading
  conversations/            State machine (idle→browsing→ordering→confirming→payment)
  database/                 PostgreSQL connection
  intents/                  Intent classification (regex + LLM), prompt injection detection
  inventory/                CSV import, fuzzy product matching
  llm/                      Groq/OpenAI client, prompt construction
  merchants/                Merchant CRUD
  moolre/                   Moolre mobile money API client
  notify/                   SMS alerts to merchants
  payment/                  Checkout orchestration, payment recovery worker
  paystack/                 Paystack API client
  platform/                 Analytics, forecasting, metrics
  push/                     Web push notifications
  reliability/              Reliability tracking
  response/                 Message templates, conversation context builder
  utils/                    Formatting helpers
```

## Running

```bash
cp .env.example .env   # fill in values
go run ./cmd/server
```

## Building

```bash
go build -o clerk-core ./cmd/server
```

## API Endpoints

All routes are under `/api`:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Phone-based login |
| POST | `/auth/register` | No | Create merchant account |
| GET | `/auth/me` | Yes | Current merchant profile |
| PATCH | `/auth/me` | Yes | Update profile |
| GET | `/inventory` | Yes | List inventory |
| POST | `/inventory` | Yes | Add inventory item |
| POST | `/inventory/import` | Yes | Bulk import |
| GET | `/orders` | Yes | List orders |
| POST | `/orders/:id/confirm` | Yes | Confirm order |
| POST | `/orders/:id/cancel` | Yes | Cancel order |
| GET | `/conversations` | Yes | List conversations |
| GET | `/conversations/:id` | Yes | Get conversation + messages |
| POST | `/conversations/:id/resume` | Yes | Resume bot |
| POST | `/conversations/:id/takeover` | Yes | Take over (human mode) |
| GET/POST | `/payments/*` | Yes | Payment method management |
| POST | `/checkout/complete` | Yes | Complete checkout |
| GET/POST | `/billing/*` | Yes | Subscription management |
| GET/POST | `/push/*` | Yes | Push notification management |
| POST | `/simulate` | Yes | Simulate a WhatsApp message |
| POST | `/intent` | No | Classify intent |
| GET | `/founder/*` | Yes | Founder analytics |

## Webhooks

| Path | Source | Description |
|------|--------|-------------|
| `/webhook/whatsapp` | Gateway | Inbound WhatsApp messages |
| `/webhook/paystack` | Paystack | Payment confirmations |
| `/webhook/moolre` | Moolre | Mobile money confirmations |

## Conversation State Machine

```
idle → browsing → ordering → confirming → payment_pending → closed
  ↓        ↓          ↓
escalated (human takeover at any point)
```
