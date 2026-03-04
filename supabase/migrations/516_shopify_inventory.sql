-- Migration 516: Shopify inventory tracking for restoration industry integration
-- Part of UNI-1236

CREATE TABLE IF NOT EXISTS shopify_inventory (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       uuid,
  shop_domain        text        NOT NULL,
  inventory_item_id  bigint      NOT NULL,
  location_id        bigint,
  available          integer     DEFAULT 0,
  product_id         bigint,
  product_title      text,
  sku                text,
  variant_price      numeric(10,2),
  metafields         jsonb       DEFAULT '{}',
  updated_at         timestamptz DEFAULT now(),
  created_at         timestamptz DEFAULT now(),
  UNIQUE(shop_domain, inventory_item_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_shopify_inventory_shop     ON shopify_inventory(shop_domain);
CREATE INDEX IF NOT EXISTS idx_shopify_inventory_workspace ON shopify_inventory(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_inventory_sku      ON shopify_inventory(sku);
CREATE INDEX IF NOT EXISTS idx_shopify_inventory_product  ON shopify_inventory(product_id);

ALTER TABLE shopify_inventory ENABLE ROW LEVEL SECURITY;

-- Service role only — webhook writes bypass user auth
CREATE POLICY shopify_inventory_service ON shopify_inventory
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Workspace members can read their inventory
CREATE POLICY shopify_inventory_read ON shopify_inventory
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM contacts WHERE workspace_id IS NOT NULL LIMIT 1
    )
    OR workspace_id IS NULL
  );
