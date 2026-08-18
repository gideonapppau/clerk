-- Reliability observability: intent bucket, grounding violations, low-confidence classifications.
CREATE TABLE IF NOT EXISTS reliability_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  conversation_id   UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id        UUID REFERENCES messages(id) ON DELETE SET NULL,
  event_type        TEXT NOT NULL,
  customer_text     TEXT NOT NULL DEFAULT '',
  classified_intent TEXT NOT NULL DEFAULT '',
  raw_llm_response  TEXT NOT NULL DEFAULT '',
  violation_type    TEXT NOT NULL DEFAULT '',
  violation_details TEXT NOT NULL DEFAULT '',
  confidence        REAL,
  reviewed          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reliability_events_created
  ON reliability_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reliability_events_merchant_created
  ON reliability_events (merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reliability_events_type_reviewed
  ON reliability_events (event_type, reviewed, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reliability_events_conversation
  ON reliability_events (conversation_id, created_at DESC);
