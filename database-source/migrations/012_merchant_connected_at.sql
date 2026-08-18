-- First WhatsApp link timestamp (for TTFV and quota velocity).
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ;

-- Backfill merchants already linked before this migration.
UPDATE merchants
SET connected_at = updated_at
WHERE connected = true AND connected_at IS NULL;
