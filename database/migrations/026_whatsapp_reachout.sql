-- Persist WhatsApp reachout / throttle state for merchant health alerts.
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS whatsapp_reachout_reason TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_reachout_message TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS whatsapp_reachout_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_reachout_ends_at TIMESTAMPTZ;

-- Reachout events are merchant-level (no conversation).
ALTER TABLE reliability_events
  ALTER COLUMN conversation_id DROP NOT NULL;
