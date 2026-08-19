-- Migration 021: merchant business scope (inventory/category context for sales brain).

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS business_scope TEXT NOT NULL DEFAULT '';
