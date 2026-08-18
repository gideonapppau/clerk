-- Migration 008: Paystack uses the secret key to sign webhooks — no separate webhook secret.
ALTER TABLE merchants DROP COLUMN IF EXISTS paystack_webhook_secret;
