-- Migration 007: Paystack integration
-- Merchant's own Paystack account — money never touches Corsa.

-- Store the merchant's Paystack secret key (encrypted at rest via app-level encryption).
-- paystack_webhook_secret is the per-merchant webhook signing secret from their Paystack dashboard.
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS paystack_secret_key TEXT,
  ADD COLUMN IF NOT EXISTS paystack_public_key TEXT,
  ADD COLUMN IF NOT EXISTS paystack_connected  BOOLEAN NOT NULL DEFAULT false;

-- Orders need a PAID terminal state and a payment reference for reconciliation.
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
    CHECK (status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'PAID', 'CANCELLED', 'EXPIRED')),
  ADD COLUMN IF NOT EXISTS payment_reference TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS paid_at           TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_payment_ref ON orders (payment_reference) WHERE payment_reference IS NOT NULL;
