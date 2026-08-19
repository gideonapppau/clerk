-- Founder sales pipeline: track cold outreach through paid (not merchant product data).
CREATE TABLE IF NOT EXISTS founder_pipeline (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name       TEXT NOT NULL,
  contact_name    TEXT NOT NULL DEFAULT '',
  platform        TEXT NOT NULL DEFAULT 'instagram'
                    CHECK (platform IN ('instagram', 'tiktok', 'facebook', 'whatsapp', 'other')),
  contact_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status          TEXT NOT NULL DEFAULT 'contacted'
                    CHECK (status IN ('contacted', 'replied', 'demo', 'trialing', 'paid', 'churned')),
  last_action     TEXT NOT NULL DEFAULT '',
  next_action     TEXT NOT NULL DEFAULT '',
  next_action_at  DATE,
  notes           TEXT NOT NULL DEFAULT '',
  merchant_id     UUID REFERENCES merchants(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_pipeline_status
  ON founder_pipeline (status, next_action_at NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_founder_pipeline_next_action
  ON founder_pipeline (next_action_at)
  WHERE next_action_at IS NOT NULL AND status NOT IN ('paid', 'churned');

CREATE INDEX IF NOT EXISTS idx_founder_pipeline_updated
  ON founder_pipeline (updated_at DESC);
