-- Case-insensitive inventory uniqueness: "iPhone 12" and "iphone 12" are one product.
-- Merges duplicates and re-points order_items / reservations before deleting extra rows.

ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_merchant_id_product_name_key;

WITH ranked AS (
  SELECT
    id,
    merchant_id,
    LOWER(product_name) AS product_key,
    ROW_NUMBER() OVER (
      PARTITION BY merchant_id, LOWER(product_name)
      ORDER BY stock DESC, created_at ASC
    ) AS rn
  FROM inventory
),
keepers AS (
  SELECT merchant_id, product_key, id AS keeper_id
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT r.id AS dupe_id, k.keeper_id
  FROM ranked r
  JOIN keepers k
    ON k.merchant_id = r.merchant_id AND k.product_key = r.product_key
  WHERE r.rn > 1
)
UPDATE order_items oi
SET inventory_id = d.keeper_id
FROM dupes d
WHERE oi.inventory_id = d.dupe_id;

WITH ranked AS (
  SELECT
    id,
    merchant_id,
    LOWER(product_name) AS product_key,
    ROW_NUMBER() OVER (
      PARTITION BY merchant_id, LOWER(product_name)
      ORDER BY stock DESC, created_at ASC
    ) AS rn
  FROM inventory
),
keepers AS (
  SELECT merchant_id, product_key, id AS keeper_id
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT r.id AS dupe_id, k.keeper_id
  FROM ranked r
  JOIN keepers k
    ON k.merchant_id = r.merchant_id AND k.product_key = r.product_key
  WHERE r.rn > 1
)
UPDATE inventory_reservations ir
SET inventory_id = d.keeper_id
FROM dupes d
WHERE ir.inventory_id = d.dupe_id;

WITH ranked AS (
  SELECT
    id,
    merchant_id,
    LOWER(product_name) AS product_key,
    ROW_NUMBER() OVER (
      PARTITION BY merchant_id, LOWER(product_name)
      ORDER BY stock DESC, created_at ASC
    ) AS rn
  FROM inventory
),
keepers AS (
  SELECT merchant_id, product_key, id AS keeper_id
  FROM ranked
  WHERE rn = 1
),
dupes AS (
  SELECT r.id AS dupe_id, k.keeper_id
  FROM ranked r
  JOIN keepers k
    ON k.merchant_id = r.merchant_id AND k.product_key = r.product_key
  WHERE r.rn > 1
)
DELETE FROM inventory i
USING dupes d
WHERE i.id = d.dupe_id;

UPDATE inventory SET product_name = LOWER(product_name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_merchant_product_ci
  ON inventory (merchant_id, LOWER(product_name));
