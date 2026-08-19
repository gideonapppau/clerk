-- Migration 017: Moolre collections (payment links) per merchant account number.
-- Platform API keys live in env (MOOLRE_USERNAME, MOOLRE_PUBLIC_KEY, etc.).

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS moolre_account_number TEXT,
  ADD COLUMN IF NOT EXISTS moolre_connected      BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS moolre_transaction_id TEXT;

ALTER TABLE merchant_payment_methods
  DROP CONSTRAINT IF EXISTS merchant_payment_methods_type_check;

ALTER TABLE merchant_payment_methods
  ADD CONSTRAINT merchant_payment_methods_type_check
    CHECK (type IN ('manual', 'momo', 'paystack', 'moolre'));
