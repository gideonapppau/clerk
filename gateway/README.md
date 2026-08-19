# Clerk Gateway

WhatsApp session manager built on Baileys. Handles WhatsApp Web connections, message reception, and routing to the Core API.

## Stack

- **Node.js** / TypeScript
- **@whiskeysockets/baileys** (WhatsApp Web API)
- **Express** for HTTP endpoints

## Running

```bash
cd app
npm install
npm run dev
# Runs on http://localhost:3000
```

## How It Works

1. Merchant scans QR code from the dashboard
2. Gateway establishes a Baileys WebSocket session with WhatsApp
3. Incoming messages are forwarded to Core API (`/webhook/whatsapp`)
4. Core processes the message and returns a response
5. Gateway sends the response back via WhatsApp

## Project Structure

```
app/
  server.ts                 Entry point
  auth/                     Session management (connect, disconnect, restore)
  baileys/                  Baileys socket creation, message extraction
  handlers/                 Connection, message, presence, outreach handlers
  transport/                Core API client, outbound message sender
  utils/                    Normalization, scheduling, error handling
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CORE_URL` | Core API URL |
| `PORT` | Server port (default: 3000) |
| `SESSION_DIR` | Where WhatsApp session data is stored |
