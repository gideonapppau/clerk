-- Plan enforcement: cancellation tracking + faster reply usage queries

ALTER TABLE merchant_billing
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_conversations_merchant_id
  ON conversations (merchant_id);

CREATE INDEX IF NOT EXISTS idx_messages_clerk_created
  ON messages (conversation_id, created_at)
  WHERE sender = 'clerk';
