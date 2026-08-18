-- Migration 006: channel identity separation + checkout token table

-- Add channel column to conversations (defaults to 'whatsapp' for all existing rows)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'whatsapp';

-- Short-lived checkout tokens issued by Go Core, consumed by the payment web-view.
-- customer_id is the hashed/opaque identity passed from the gateway (never a raw phone).
CREATE TABLE IF NOT EXISTS checkout_tokens (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id    UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  order_id       UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  customer_id    TEXT NOT NULL,
  token_hash     TEXT NOT NULL UNIQUE,
  expires_at     TIMESTAMPTZ NOT NULL,
  used           BOOLEAN NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checkout_tokens_order
  ON checkout_tokens (order_id);
CREATE INDEX IF NOT EXISTS idx_checkout_tokens_expires
  ON checkout_tokens (expires_at) WHERE used = false;
