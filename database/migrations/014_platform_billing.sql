-- Clerk platform billing (merchant subscriptions to Clerk via Paystack)

CREATE TABLE IF NOT EXISTS merchant_billing (
  merchant_id              UUID PRIMARY KEY REFERENCES merchants(id) ON DELETE CASCADE,
  plan_slug                TEXT NOT NULL DEFAULT 'trial',
  status                   TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'cancelled')),
  paystack_customer_code   TEXT,
  paystack_subscription_code TEXT,
  current_period_end       TIMESTAMPTZ,
  last_reference           TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_billing_transactions (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id        UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  plan_slug          TEXT NOT NULL,
  amount_pesewas     INT NOT NULL,
  paystack_reference TEXT NOT NULL UNIQUE,
  status             TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed')),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_billing_tx_merchant
  ON platform_billing_transactions (merchant_id, created_at DESC);
