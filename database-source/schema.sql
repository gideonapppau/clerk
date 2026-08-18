-- Clerk schema — PostgreSQL is the source of truth.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS merchants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL DEFAULT '',
  business_scope TEXT NOT NULL DEFAULT '',
  email          TEXT,
  password_hash TEXT NOT NULL DEFAULT '',
  plan          TEXT NOT NULL DEFAULT 'starter',
  phone         TEXT,
  connected     BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_merchants_email ON merchants (email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS inventory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  product_name    TEXT NOT NULL,
  price           INT NOT NULL CHECK (price >= 0),
  stock           INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category        TEXT NOT NULL DEFAULT '',
  description     TEXT NOT NULL DEFAULT '',
  is_service      BOOLEAN NOT NULL DEFAULT false,
  unit            TEXT NOT NULL DEFAULT '',
  unlimited_stock BOOLEAN NOT NULL DEFAULT false,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_merchant_product_ci
  ON inventory (merchant_id, LOWER(product_name));

CREATE TABLE IF NOT EXISTS conversations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id    UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  mode           TEXT NOT NULL DEFAULT 'BOT' CHECK (mode IN ('BOT', 'HUMAN', 'CLOSED')),
  state          TEXT NOT NULL DEFAULT 'idle',
  status         TEXT NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE', 'WAITING_MERCHANT', 'MERCHANT_ENGAGED', 'RESOLVED')),
  context        JSONB NOT NULL DEFAULT '{}',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (merchant_id, customer_phone)
);

CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender          TEXT NOT NULL CHECK (sender IN ('customer', 'clerk', 'merchant')),
  body            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id     UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  customer_phone  TEXT NOT NULL,
  product_name    TEXT,
  quantity        INT CHECK (quantity IS NULL OR quantity > 0),
  unit_price      INT CHECK (unit_price IS NULL OR unit_price >= 0),
  total_amount    INT CHECK (total_amount IS NULL OR total_amount >= 0),
  status          TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION'
                    CHECK (status IN ('PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED', 'EXPIRED')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_inventory_merchant ON inventory (merchant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_merchant ON conversations (merchant_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON orders (merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_reservations_expires ON inventory_reservations (expires_at) WHERE released = false;

CREATE TABLE IF NOT EXISTS conversation_intents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id      UUID REFERENCES messages(id) ON DELETE SET NULL,
  intent          TEXT NOT NULL,
  customer_text   TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_intents_conv
  ON conversation_intents (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_orders_conversation ON orders (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_merchant_events_merchant ON merchant_events (merchant_id, created_at DESC);
