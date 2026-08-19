# Clerk

WhatsApp-based sales assistant for Ghanaian merchants. Customers message a WhatsApp number, Clerk's AI handles product inquiries, takes orders, processes payments, and escalates to the merchant when needed.

## Architecture

```
WhatsApp → Gateway (Baileys) → Core (Go) → PostgreSQL
                                  ↕
                          Dashboard (Next.js)
```

| Service | Stack | Path | Purpose |
|---------|-------|------|---------|
| **Core** | Go / Gin | `core/` | API server, conversation engine, payments, LLM integration |
| **Dashboard** | Next.js / React | `dashboard/` | Merchant admin panel, founder analytics |
| **Gateway** | Node.js / Baileys | `gateway/` | WhatsApp session management, message routing |
| **Database** | PostgreSQL | `database/` | Schema, migrations |

## Quick Start

### Docker Compose (recommended)

```bash
cp .env.example .env   # fill in values
docker-compose up --build
```

This starts all four services:

| Service | URL |
|---------|-----|
| **Core** | http://localhost:8080 |
| **Gateway** | http://localhost:3000 |
| **Dashboard** | http://localhost:3001 |
| **PostgreSQL** | localhost:5432 |

### Manual Setup

#### 1. Database
```bash
psql -U postgres -d clerk -f database/schema.sql
# Then run migrations in order:
psql -U postgres -d clerk -f database/migrations/001_initial.sql
# ... through 026
```

#### 2. Core (Go API)
```bash
cd core
cp .env.example .env   # fill in values
go run ./cmd/server
# Runs on :8080
```

#### 3. Dashboard (Next.js)
```bash
cd dashboard/app
npm install
npm run dev
# Runs on :3001
```

#### 4. Gateway (WhatsApp)
```bash
cd gateway/app
npm install
npm run dev
# Runs on :3000
```

## Environment Variables

See `core/.env.example` for the full list. The critical ones:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for auth tokens |
| `GROQ_API_KEY` | LLM provider (primary) |
| `OPENAI_API_KEY` | LLM provider (fallback) |
| `GATEWAY_URL` | Gateway service URL |
| `CORE_URL` | Core service public URL |
| `APP_URL` | Dashboard URL |
| `PAYSTACK_SECRET_KEY` | Paystack payments |
| `MOOLRE_PRIVATE_KEY` | Moolre mobile money |

## API Documentation

Full OpenAPI 3.0 spec at [`docs/openapi.yaml`](docs/openapi.yaml). View it at:

```bash
# Using Docker (no install needed)
docker run -p 8081:8080 -e SWAGGER_JSON=/api/openapi.yaml -v $(pwd)/docs:/api swaggerapi/swagger-ui
# Then open http://localhost:8081
```

## Deployment

Each service has its own `fly.toml` and `Dockerfile`:
- `core-solitary-pinecone-9230.fly.dev` — Go core
- `dashboard-clerk-amber-4821.fly.dev` — Next.js dashboard
- `gateway-faithful-sound-1832.fly.dev` — WhatsApp gateway
