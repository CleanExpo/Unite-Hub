-- Migration 404: Google Merchant Center Integration Tables
-- Description: Create tables for Google Merchant Center product feed synchronization
-- Dependencies: Migration 403 (shopify_products, shopify_product_variants)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- GMC PRODUCT SYNC TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.gmc_product_sync (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.shopify_products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.shopify_product_variants(id) ON DELETE CASCADE,
  gmc_product_id TEXT NOT NULL, -- Format: online:en:AU:SKU123
  merchant_id TEXT NOT NULL, -- Google Merchant Center ID
  status TEXT CHECK (status IN ('synced', 'pending', 'failed', 'deleted')),
  synced_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, variant_id, merchant_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gmc_sync_workspace ON public.gmc_product_sync(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gmc_sync_variant ON public.gmc_product_sync(variant_id);
CREATE INDEX IF NOT EXISTS idx_gmc_sync_merchant ON public.gmc_product_sync(merchant_id);
CREATE INDEX IF NOT EXISTS idx_gmc_sync_status ON public.gmc_product_sync(status);
CREATE INDEX IF NOT EXISTS idx_gmc_sync_synced_at ON public.gmc_product_sync(synced_at);

-- RLS Policies
ALTER TABLE public.gmc_product_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GMC syncs in their workspace"
  ON public.gmc_product_sync
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert GMC syncs in their workspace"
  ON public.gmc_product_sync
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update GMC syncs in their workspace"
  ON public.gmc_product_sync
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete GMC syncs in their workspace"
  ON public.gmc_product_sync
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- GMC PRODUCT STATUS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.gmc_product_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  sync_id UUID REFERENCES public.gmc_product_sync(id) ON DELETE CASCADE,
  gmc_product_id TEXT NOT NULL,
  merchant_id TEXT NOT NULL,
  destination TEXT, -- e.g., "Shopping", "Free listings"
  destination_status TEXT CHECK (destination_status IN ('approved', 'disapproved', 'pending')),
  approved_countries TEXT[],
  disapproved_countries TEXT[],
  pending_countries TEXT[],
  issues JSONB, -- Array of item-level issues
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, gmc_product_id, merchant_id, destination)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gmc_status_workspace ON public.gmc_product_status(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gmc_status_sync ON public.gmc_product_status(sync_id);
CREATE INDEX IF NOT EXISTS idx_gmc_status_merchant ON public.gmc_product_status(merchant_id);
CREATE INDEX IF NOT EXISTS idx_gmc_status_destination_status ON public.gmc_product_status(destination_status);

-- RLS Policies
ALTER TABLE public.gmc_product_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GMC statuses in their workspace"
  ON public.gmc_product_status
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert GMC statuses in their workspace"
  ON public.gmc_product_status
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update GMC statuses in their workspace"
  ON public.gmc_product_status
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete GMC statuses in their workspace"
  ON public.gmc_product_status
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- GMC FEED CONFIG TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.gmc_feed_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  merchant_id TEXT NOT NULL,
  target_country TEXT NOT NULL, -- AU, NZ, US, GB
  content_language TEXT NOT NULL, -- en, en-AU, en-NZ
  currency TEXT NOT NULL, -- AUD, NZD, USD, GBP
  base_url TEXT NOT NULL, -- Website base URL
  auto_sync BOOLEAN DEFAULT FALSE,
  sync_frequency_hours INTEGER DEFAULT 24,
  include_shipping BOOLEAN DEFAULT FALSE,
  google_product_category TEXT, -- Default category for all products
  brand TEXT, -- Default brand for all products
  custom_label_0 TEXT,
  custom_label_1 TEXT,
  custom_label_2 TEXT,
  custom_label_3 TEXT,
  custom_label_4 TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (workspace_id, merchant_id, target_country)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gmc_config_workspace ON public.gmc_feed_config(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gmc_config_merchant ON public.gmc_feed_config(merchant_id);
CREATE INDEX IF NOT EXISTS idx_gmc_config_auto_sync ON public.gmc_feed_config(auto_sync);

-- RLS Policies
ALTER TABLE public.gmc_feed_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view GMC configs in their workspace"
  ON public.gmc_feed_config
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert GMC configs in their workspace"
  ON public.gmc_feed_config
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update GMC configs in their workspace"
  ON public.gmc_feed_config
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM public.user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete GMC configs in their workspace"
  ON public.gmc_feed_config
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

-- Function to get GMC sync statistics
CREATE OR REPLACE FUNCTION public.get_gmc_sync_stats(p_workspace_id UUID, p_merchant_id TEXT)
RETURNS TABLE (
  total_synced BIGINT,
  synced_today BIGINT,
  pending_sync BIGINT,
  failed_sync BIGINT,
  last_sync_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE status = 'synced') AS total_synced,
    COUNT(*) FILTER (WHERE status = 'synced' AND synced_at >= NOW() - INTERVAL '24 hours') AS synced_today,
    COUNT(*) FILTER (WHERE status = 'pending') AS pending_sync,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_sync,
    MAX(synced_at) AS last_sync_at
  FROM public.gmc_product_sync
  WHERE workspace_id = p_workspace_id
    AND merchant_id = p_merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get GMC product status summary
CREATE OR REPLACE FUNCTION public.get_gmc_status_summary(p_workspace_id UUID, p_merchant_id TEXT)
RETURNS TABLE (
  approved_products BIGINT,
  disapproved_products BIGINT,
  pending_products BIGINT,
  total_issues BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT gmc_product_id) FILTER (WHERE destination_status = 'approved') AS approved_products,
    COUNT(DISTINCT gmc_product_id) FILTER (WHERE destination_status = 'disapproved') AS disapproved_products,
    COUNT(DISTINCT gmc_product_id) FILTER (WHERE destination_status = 'pending') AS pending_products,
    COUNT(*) FILTER (WHERE issues IS NOT NULL AND jsonb_array_length(issues) > 0) AS total_issues
  FROM public.gmc_product_status
  WHERE workspace_id = p_workspace_id
    AND merchant_id = p_merchant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get products needing sync
CREATE OR REPLACE FUNCTION public.get_gmc_products_needing_sync(p_workspace_id UUID, p_merchant_id TEXT)
RETURNS TABLE (
  product_id UUID,
  variant_id UUID,
  sku TEXT,
  title TEXT,
  last_updated TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS product_id,
    v.id AS variant_id,
    v.sku,
    p.title,
    p.updated_at AS last_updated
  FROM public.shopify_products p
  INNER JOIN public.shopify_product_variants v ON v.product_id = p.id
  LEFT JOIN public.gmc_product_sync s ON s.variant_id = v.id AND s.merchant_id = p_merchant_id
  WHERE p.workspace_id = p_workspace_id
    AND p.status = 'active'
    AND (
      s.id IS NULL -- Never synced
      OR s.synced_at < p.updated_at -- Product updated since last sync
      OR s.status = 'failed' -- Previous sync failed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_gmc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gmc_product_sync_updated_at
  BEFORE UPDATE ON public.gmc_product_sync
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gmc_updated_at();

CREATE TRIGGER update_gmc_feed_config_updated_at
  BEFORE UPDATE ON public.gmc_feed_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_gmc_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.gmc_product_sync IS 'Google Merchant Center product synchronization tracking';
COMMENT ON TABLE public.gmc_product_status IS 'Google Merchant Center product approval status and issues';
COMMENT ON TABLE public.gmc_feed_config IS 'Google Merchant Center feed configuration per merchant and country';
COMMENT ON FUNCTION public.get_gmc_sync_stats IS 'Get synchronization statistics for a merchant';
COMMENT ON FUNCTION public.get_gmc_status_summary IS 'Get product status summary (approved/disapproved/pending)';
COMMENT ON FUNCTION public.get_gmc_products_needing_sync IS 'Get products that need to be synced to GMC';
