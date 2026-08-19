-- One WhatsApp number per Clerk merchant account.
-- Clears duplicate phone assignments (keeps the oldest merchant row per number).
UPDATE merchants m1
SET phone = '', connected = false, updated_at = NOW()
WHERE COALESCE(m1.phone, '') <> ''
  AND EXISTS (
    SELECT 1
    FROM merchants m2
    WHERE m2.id < m1.id
      AND regexp_replace(COALESCE(m2.phone, ''), '[^0-9]', '', 'g') = regexp_replace(m1.phone, '[^0-9]', '', 'g')
      AND regexp_replace(COALESCE(m2.phone, ''), '[^0-9]', '', 'g') <> ''
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_whatsapp_phone_digits
ON merchants ((regexp_replace(phone, '[^0-9]', '', 'g')))
WHERE phone <> '' AND regexp_replace(phone, '[^0-9]', '', 'g') <> '';
