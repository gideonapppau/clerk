-- Migration 009: multi-rail payment methods
-- Every merchant gets a manual rail by default (auto-inserted below).
-- Paystack config stays on the merchants table for backwards compat but is
-- also reflected as a payment_methods row when connected.

CREATE TABLE IF NOT EXISTS merchant_payment_methods (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK (type IN ('manual', 'momo', 'paystack')),
    provider    TEXT,           -- mtn | vodafone | airteltigo  (momo only)
    number      TEXT,           -- MoMo number (momo only)
    is_default  BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_merchant_payment_type
    ON merchant_payment_methods (merchant_id, type);

CREATE INDEX IF NOT EXISTS idx_payment_methods_merchant
    ON merchant_payment_methods (merchant_id);

-- Every existing merchant gets a manual rail as their default.
INSERT INTO merchant_payment_methods (merchant_id, type, is_default)
SELECT id, 'manual', true
FROM merchants
ON CONFLICT (merchant_id, type) DO NOTHING;
