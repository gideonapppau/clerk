-- Migration 022: merchant-agnostic catalog fields (category, services, unlimited stock).

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_service BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unit TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS unlimited_stock BOOLEAN NOT NULL DEFAULT false;
