-- Conversation status + merchant briefing context

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context JSONB NOT NULL DEFAULT '{}';

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_status_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_status_check
  CHECK (status IN ('ACTIVE', 'WAITING_MERCHANT', 'MERCHANT_ENGAGED', 'RESOLVED'));
