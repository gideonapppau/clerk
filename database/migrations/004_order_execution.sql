-- Migration 004: order execution with reservations, line items, and merchant events

-- Expand order status lifecycle
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
UPDATE orders SET status = 'PENDING_CONFIRMATION' WHERE status = 'pending';
UPDATE orders SET status = 'CONFIRMED' WHERE status = 'confirmed';
UPDATE orders SET status = 'CANCELLED' WHERE status = 'cancelled';
ALTER TABLE orders
  ALTER COLUMN product_name DROP NOT NULL,
  ALTER COLUMN quantity DROP NOT NULL,
  ALTER COLUMN unit_price DROP NOT NULL,
  ALTER COLUMN total_amount DROP NOT NULL;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'EXPIRED'));

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  qty          INT NOT NULL CHECK (qty > 0),
  price        INT NOT NULL CHECK (price >= 0)
);

CREATE TABLE IF NOT EXISTS inventory_reservations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id),
  qty          INT NOT NULL CHECK (qty > 0),
  expires_at   TIMESTAMPTZ NOT NULL,
  released     BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS merchant_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  type            TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_order ON inventory_reservations (order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON inventory_reservations (expires_at) WHERE released = false;
CREATE INDEX IF NOT EXISTS idx_merchant_events_merchant ON merchant_events (merchant_id, created_at DESC);

-- Backfill line items for legacy single-product orders
INSERT INTO order_items (order_id, inventory_id, qty, price)
SELECT o.id, i.id, o.quantity, o.unit_price
FROM orders o
JOIN inventory i ON i.merchant_id = o.merchant_id AND LOWER(i.product_name) = LOWER(o.product_name)
WHERE o.product_name IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM order_items oi WHERE oi.order_id = o.id);
