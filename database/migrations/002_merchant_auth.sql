-- Merchant auth fields for /api/v1/auth/*

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'starter';

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_email ON merchants (email) WHERE email IS NOT NULL;
