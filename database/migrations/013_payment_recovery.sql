-- Abandoned payment recovery: one follow-up WhatsApp per unpaid Paystack checkout.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_checkout_url TEXT,
  ADD COLUMN IF NOT EXISTS payment_recovery_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_payment_recovery
  ON orders (updated_at)
  WHERE payment_reference IS NOT NULL
    AND paid_at IS NULL
    AND payment_recovery_sent_at IS NULL
    AND status NOT IN ('CANCELLED', 'EXPIRED', 'PAID');
