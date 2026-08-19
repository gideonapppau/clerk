-- LLM token usage per API call (for founder unit economics)

CREATE TABLE IF NOT EXISTS llm_usage_calls (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id       UUID REFERENCES merchants(id) ON DELETE SET NULL,
  call_type         TEXT NOT NULL DEFAULT 'classify',
  provider          TEXT NOT NULL,
  model             TEXT NOT NULL,
  prompt_tokens     INT NOT NULL DEFAULT 0,
  completion_tokens INT NOT NULL DEFAULT 0,
  total_tokens      INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_llm_usage_merchant_created
  ON llm_usage_calls (merchant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_llm_usage_created
  ON llm_usage_calls (created_at DESC);
