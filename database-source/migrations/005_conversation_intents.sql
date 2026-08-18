-- Persist customer-turn intents for conversation timeline / memory foundation

CREATE TABLE IF NOT EXISTS conversation_intents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id      UUID REFERENCES messages(id) ON DELETE SET NULL,
  intent          TEXT NOT NULL,
  customer_text   TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_intents_conv
  ON conversation_intents (conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_orders_conversation
  ON orders (conversation_id, created_at DESC);
