-- Migration 403: Shopify Integration Tables
-- Description: Create tables for Shopify product and order synchronization
-- Dependencies: Migration 402 (synthex_tenants, credential_registry)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- SHOPIFY PRODUCTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.shopify_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  handle TEXT,
  product_type TEXT,
  vendor TEXT,
  tags TEXT[],
  status TEXT CHECK (status IN ('active', 'draft', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, shopify_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shopify_products_workspace ON public.shopify_products(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_products_shopify_id ON public.shopify_products(shopify_id);
CREATE INDEX IF NOT EXISTS idx_shopify_products_status ON public.shopify_products(status);

-- RLS Policies
ALTER TABLE public.shopify_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products in their workspace"
  ON public.shopify_products
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert products in their workspace"
  ON public.shopify_products
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update products in their workspace"
  ON public.shopify_products
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete products in their workspace"
  ON public.shopify_products
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- SHOPIFY PRODUCT VARIANTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.shopify_product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shopify_products(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  title TEXT,
  sku TEXT,
  price DECIMAL(10, 2) NOT NULL,
  compare_at_price DECIMAL(10, 2),
  inventory_quantity INTEGER DEFAULT 0,
  weight DECIMAL(10, 2),
  weight_unit TEXT,
  barcode TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, shopify_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopify_variants_workspace ON public.shopify_product_variants(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_variants_product ON public.shopify_product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_shopify_variants_sku ON public.shopify_product_variants(sku);

-- RLS Policies
ALTER TABLE public.shopify_product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view variants in their workspace"
  ON public.shopify_product_variants
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert variants in their workspace"
  ON public.shopify_product_variants
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update variants in their workspace"
  ON public.shopify_product_variants
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete variants in their workspace"
  ON public.shopify_product_variants
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- SHOPIFY PRODUCT IMAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.shopify_product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.shopify_products(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  src TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, shopify_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopify_images_workspace ON public.shopify_product_images(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_images_product ON public.shopify_product_images(product_id);

-- RLS Policies
ALTER TABLE public.shopify_product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view images in their workspace"
  ON public.shopify_product_images
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert images in their workspace"
  ON public.shopify_product_images
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update images in their workspace"
  ON public.shopify_product_images
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete images in their workspace"
  ON public.shopify_product_images
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- SHOPIFY ORDERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.shopify_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  order_number INTEGER NOT NULL,
  email TEXT,
  phone TEXT,
  financial_status TEXT CHECK (financial_status IN ('pending', 'authorized', 'paid', 'partially_paid', 'refunded', 'voided')),
  fulfillment_status TEXT CHECK (fulfillment_status IN ('fulfilled', 'partial', 'unfulfilled')),
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  currency TEXT NOT NULL,
  subtotal_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  total_tax DECIMAL(10, 2) DEFAULT 0,
  total_discounts DECIMAL(10, 2) DEFAULT 0,
  total_shipping DECIMAL(10, 2) DEFAULT 0,
  shipping_address JSONB,
  billing_address JSONB,
  customer JSONB,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (workspace_id, shopify_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopify_orders_workspace ON public.shopify_orders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_shopify_id ON public.shopify_orders(shopify_id);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_email ON public.shopify_orders(email);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_financial_status ON public.shopify_orders(financial_status);
CREATE INDEX IF NOT EXISTS idx_shopify_orders_created_at ON public.shopify_orders(created_at);

-- RLS Policies
ALTER TABLE public.shopify_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orders in their workspace"
  ON public.shopify_orders
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert orders in their workspace"
  ON public.shopify_orders
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update orders in their workspace"
  ON public.shopify_orders
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete orders in their workspace"
  ON public.shopify_orders
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- SHOPIFY ORDER LINE ITEMS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.shopify_order_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.shopify_orders(id) ON DELETE CASCADE,
  shopify_id TEXT NOT NULL,
  product_id TEXT,
  variant_id TEXT,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  sku TEXT,
  vendor TEXT,
  fulfillment_status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, shopify_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shopify_line_items_workspace ON public.shopify_order_line_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_line_items_order ON public.shopify_order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shopify_line_items_sku ON public.shopify_order_line_items(sku);

-- RLS Policies
ALTER TABLE public.shopify_order_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view line items in their workspace"
  ON public.shopify_order_line_items
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert line items in their workspace"
  ON public.shopify_order_line_items
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update line items in their workspace"
  ON public.shopify_order_line_items
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete line items in their workspace"
  ON public.shopify_order_line_items
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get product stats for a workspace
CREATE OR REPLACE FUNCTION public.get_shopify_product_stats(p_workspace_id UUID)
RETURNS TABLE (
  total_products BIGINT,
  active_products BIGINT,
  draft_products BIGINT,
  archived_products BIGINT,
  total_variants BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT p.id) AS total_products,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') AS active_products,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'draft') AS draft_products,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'archived') AS archived_products,
    COUNT(v.id) AS total_variants
  FROM public.shopify_products p
  LEFT JOIN public.shopify_product_variants v ON v.product_id = p.id
  WHERE p.workspace_id = p_workspace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get order stats for a workspace
CREATE OR REPLACE FUNCTION public.get_shopify_order_stats(p_workspace_id UUID, p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
  total_orders BIGINT,
  total_revenue DECIMAL,
  average_order_value DECIMAL,
  paid_orders BIGINT,
  pending_orders BIGINT,
  fulfilled_orders BIGINT,
  unfulfilled_orders BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.total_price), 0) AS total_revenue,
    COALESCE(AVG(o.total_price), 0) AS average_order_value,
    COUNT(o.id) FILTER (WHERE o.financial_status = 'paid') AS paid_orders,
    COUNT(o.id) FILTER (WHERE o.financial_status = 'pending') AS pending_orders,
    COUNT(o.id) FILTER (WHERE o.fulfillment_status = 'fulfilled') AS fulfilled_orders,
    COUNT(o.id) FILTER (WHERE o.fulfillment_status = 'unfulfilled') AS unfulfilled_orders
  FROM public.shopify_orders o
  WHERE o.workspace_id = p_workspace_id
    AND (p_start_date IS NULL OR o.created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE public.shopify_products IS 'Shopify products synchronized from Shopify stores';
COMMENT ON TABLE public.shopify_product_variants IS 'Shopify product variants with SKU and pricing';
COMMENT ON TABLE public.shopify_product_images IS 'Product images from Shopify';
COMMENT ON TABLE public.shopify_orders IS 'Shopify orders with financial and fulfillment status';
COMMENT ON TABLE public.shopify_order_line_items IS 'Line items for Shopify orders';
COMMENT ON FUNCTION public.get_shopify_product_stats IS 'Get product statistics for a workspace';
COMMENT ON FUNCTION public.get_shopify_order_stats IS 'Get order statistics for a workspace with optional date range';
