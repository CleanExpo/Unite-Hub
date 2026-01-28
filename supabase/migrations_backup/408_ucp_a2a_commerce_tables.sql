-- Migration 408: UCP & A2A Commerce Tables
-- Created: 2026-01-15
-- Purpose: Support Phase 8 Part 4 - MCP Shopify Sync, UCP Direct Offers, A2A Negotiation

-- =====================================================
-- Table: shopify_sync_logs
-- Purpose: Track MCP catalog sync operations
-- =====================================================
CREATE TABLE IF NOT EXISTS shopify_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,

  -- Sync details
  endpoint TEXT NOT NULL,
  products_found INTEGER DEFAULT 0,
  products_synced INTEGER DEFAULT 0,
  products_skipped INTEGER DEFAULT 0,

  -- Errors
  errors JSONB DEFAULT '[]',

  -- Timestamps
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_shopify_sync_logs_workspace
  ON shopify_sync_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_shopify_sync_logs_tenant
  ON shopify_sync_logs(workspace_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_shopify_sync_logs_synced
  ON shopify_sync_logs(workspace_id, synced_at DESC);

-- Enable RLS
ALTER TABLE shopify_sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY shopify_sync_logs_workspace_isolation ON shopify_sync_logs
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: ucp_offers
-- Purpose: Universal Commerce Protocol direct offers
-- =====================================================
CREATE TABLE IF NOT EXISTS ucp_offers (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Product reference
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL,
  title TEXT NOT NULL,

  -- Pricing
  base_price NUMERIC(10, 2) NOT NULL,
  offer_price NUMERIC(10, 2) NOT NULL,
  discount NUMERIC(10, 2) NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  currency TEXT NOT NULL DEFAULT 'AUD',

  -- Availability
  availability TEXT NOT NULL CHECK (
    availability IN ('in_stock', 'low_stock', 'out_of_stock')
  ),
  inventory INTEGER DEFAULT 0,

  -- Validity
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,

  -- URLs
  buy_now_url TEXT NOT NULL,
  terms_url TEXT,

  -- Shipping
  shipping_info JSONB DEFAULT '{}',

  -- Status
  enabled BOOLEAN DEFAULT true,
  disabled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_ucp_offers_workspace
  ON ucp_offers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ucp_offers_product
  ON ucp_offers(workspace_id, product_id);
CREATE INDEX IF NOT EXISTS idx_ucp_offers_sku
  ON ucp_offers(workspace_id, sku);
CREATE INDEX IF NOT EXISTS idx_ucp_offers_enabled
  ON ucp_offers(workspace_id, enabled);
CREATE INDEX IF NOT EXISTS idx_ucp_offers_valid
  ON ucp_offers(workspace_id, valid_until DESC) WHERE enabled = true;

-- Enable RLS
ALTER TABLE ucp_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ucp_offers_workspace_isolation ON ucp_offers
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: ucp_offer_analytics
-- Purpose: Track offer performance metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS ucp_offer_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL REFERENCES ucp_offers(id) ON DELETE CASCADE,

  -- Metrics
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  revenue NUMERIC(10, 2) DEFAULT 0,

  -- Timestamps
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Uniqueness
  UNIQUE(workspace_id, offer_id, date)
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_ucp_offer_analytics_workspace
  ON ucp_offer_analytics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ucp_offer_analytics_offer
  ON ucp_offer_analytics(workspace_id, offer_id);
CREATE INDEX IF NOT EXISTS idx_ucp_offer_analytics_date
  ON ucp_offer_analytics(workspace_id, date DESC);

-- Enable RLS
ALTER TABLE ucp_offer_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ucp_offer_analytics_workspace_isolation ON ucp_offer_analytics
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: a2a_sessions
-- Purpose: Agent-to-Agent negotiation sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS a2a_sessions (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Agents
  buyer_agent_id TEXT NOT NULL,
  seller_agent_id TEXT NOT NULL,

  -- Product
  product_id TEXT NOT NULL,
  sku TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'accepted', 'rejected', 'expired')
  ),

  -- Pricing
  final_price NUMERIC(10, 2),

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for sessions
CREATE INDEX IF NOT EXISTS idx_a2a_sessions_workspace
  ON a2a_sessions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_a2a_sessions_buyer
  ON a2a_sessions(workspace_id, buyer_agent_id);
CREATE INDEX IF NOT EXISTS idx_a2a_sessions_product
  ON a2a_sessions(workspace_id, product_id);
CREATE INDEX IF NOT EXISTS idx_a2a_sessions_status
  ON a2a_sessions(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_a2a_sessions_started
  ON a2a_sessions(workspace_id, started_at DESC);

-- Enable RLS
ALTER TABLE a2a_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY a2a_sessions_workspace_isolation ON a2a_sessions
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: a2a_offers
-- Purpose: Negotiation offers and counter-offers
-- =====================================================
CREATE TABLE IF NOT EXISTS a2a_offers (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL REFERENCES a2a_sessions(id) ON DELETE CASCADE,

  -- Agent
  agent_id TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('buyer', 'seller')),

  -- Offer
  offer_price NUMERIC(10, 2) NOT NULL,
  message TEXT,

  -- Constraints
  constraints JSONB DEFAULT '{}',

  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for offers
CREATE INDEX IF NOT EXISTS idx_a2a_offers_workspace
  ON a2a_offers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_a2a_offers_session
  ON a2a_offers(workspace_id, session_id);
CREATE INDEX IF NOT EXISTS idx_a2a_offers_agent
  ON a2a_offers(workspace_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_a2a_offers_timestamp
  ON a2a_offers(workspace_id, session_id, timestamp ASC);

-- Enable RLS
ALTER TABLE a2a_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY a2a_offers_workspace_isolation ON a2a_offers
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Update Trigger Functions
-- =====================================================
CREATE OR REPLACE FUNCTION update_ucp_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ucp_offers_timestamp
  BEFORE UPDATE ON ucp_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_ucp_offers_updated_at();

CREATE OR REPLACE FUNCTION update_ucp_offer_analytics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ucp_offer_analytics_timestamp
  BEFORE UPDATE ON ucp_offer_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_ucp_offer_analytics_updated_at();

-- =====================================================
-- Migration Complete
-- =====================================================
-- Summary:
-- - shopify_sync_logs: MCP sync history
-- - ucp_offers: Direct offers for AI search
-- - ucp_offer_analytics: Offer performance tracking
-- - a2a_sessions: Agent negotiation sessions
-- - a2a_offers: Negotiation offer history
-- - Full RLS enforcement for workspace isolation
-- - Optimized indexes for common queries
