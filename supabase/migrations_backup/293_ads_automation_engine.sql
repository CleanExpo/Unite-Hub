-- Migration: Ads Automation Engine Tables
-- Description: Tables for ad accounts, campaigns, performance snapshots, and optimization suggestions.
-- Created: 2025-11-28

-- ============================================================================
-- AD ACCOUNTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'meta', 'tiktok')),
  external_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_iv TEXT,
  token_auth_tag TEXT,
  token_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'disabled', 'error')),
  account_type TEXT CHECK (account_type IN ('standard', 'mcc', 'manager', 'business')),
  parent_account_id UUID REFERENCES ad_accounts(id),
  last_sync_at TIMESTAMPTZ,
  sync_cursor TEXT,
  permissions TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, provider, external_account_id)
);

-- ============================================================================
-- AD CAMPAIGNS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  external_campaign_id TEXT NOT NULL,
  name TEXT NOT NULL,
  objective TEXT CHECK (objective IN (
    'awareness', 'reach', 'traffic', 'engagement', 'app_installs',
    'video_views', 'lead_generation', 'messages', 'conversions',
    'catalog_sales', 'store_traffic', 'brand_awareness'
  )),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted', 'archived', 'draft', 'pending')),
  buying_type TEXT CHECK (buying_type IN ('auction', 'reserved', 'fixed_price')),
  daily_budget NUMERIC(15,2),
  lifetime_budget NUMERIC(15,2),
  budget_remaining NUMERIC(15,2),
  spend_cap NUMERIC(15,2),
  start_date DATE,
  end_date DATE,
  bid_strategy TEXT,
  bid_amount NUMERIC(15,4),
  targeting JSONB DEFAULT '{}',
  placements JSONB DEFAULT '[]',
  optimization_goal TEXT,
  attribution_setting TEXT,
  ad_sets_count INTEGER DEFAULT 0,
  ads_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_account_id, external_campaign_id)
);

-- ============================================================================
-- AD SETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  external_adset_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted', 'archived', 'draft')),
  daily_budget NUMERIC(15,2),
  lifetime_budget NUMERIC(15,2),
  bid_amount NUMERIC(15,4),
  bid_strategy TEXT,
  targeting JSONB DEFAULT '{}',
  placements JSONB DEFAULT '[]',
  schedule JSONB DEFAULT '{}',
  optimization_goal TEXT,
  billing_event TEXT,
  ads_count INTEGER DEFAULT 0,
  last_sync_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_campaign_id, external_adset_id)
);

-- ============================================================================
-- AD PERFORMANCE SNAPSHOTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_performance_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  ad_set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  granularity TEXT DEFAULT 'daily' CHECK (granularity IN ('hourly', 'daily', 'weekly', 'monthly')),
  -- Reach & Impressions
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  frequency NUMERIC(10,4),
  -- Engagement
  clicks BIGINT DEFAULT 0,
  ctr NUMERIC(10,6),
  cpc NUMERIC(15,4),
  cpm NUMERIC(15,4),
  -- Conversions
  conversions BIGINT DEFAULT 0,
  conversion_rate NUMERIC(10,6),
  cost_per_conversion NUMERIC(15,4),
  conversion_value NUMERIC(15,2),
  -- Cost & Revenue
  cost NUMERIC(15,2) DEFAULT 0,
  revenue NUMERIC(15,2) DEFAULT 0,
  roas NUMERIC(10,4),
  profit NUMERIC(15,2),
  -- Video Metrics (if applicable)
  video_views BIGINT DEFAULT 0,
  video_views_p25 BIGINT DEFAULT 0,
  video_views_p50 BIGINT DEFAULT 0,
  video_views_p75 BIGINT DEFAULT 0,
  video_views_p100 BIGINT DEFAULT 0,
  video_avg_watch_time NUMERIC(10,2),
  -- Social Metrics
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  saves BIGINT DEFAULT 0,
  -- App Metrics
  app_installs BIGINT DEFAULT 0,
  app_opens BIGINT DEFAULT 0,
  -- Lead Metrics
  leads BIGINT DEFAULT 0,
  cost_per_lead NUMERIC(15,4),
  -- Quality Scores
  quality_score NUMERIC(5,2),
  relevance_score NUMERIC(5,2),
  -- Raw data
  raw_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ad_campaign_id, ad_set_id, snapshot_date, granularity)
);

-- ============================================================================
-- AD OPTIMIZATION OPPORTUNITIES
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_optimization_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  ad_set_id UUID REFERENCES ad_sets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN (
    'budget_increase', 'budget_decrease', 'bid_adjustment',
    'targeting_expansion', 'targeting_refinement', 'placement_change',
    'creative_refresh', 'schedule_optimization', 'audience_overlap',
    'underperforming_ad', 'high_performer_scale', 'cost_efficiency',
    'conversion_opportunity', 'quality_improvement', 'trend_alert'
  )),
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT,
  estimated_impact_score NUMERIC(5,2),
  estimated_impact_value NUMERIC(15,2),
  confidence_score NUMERIC(4,3),
  supporting_data JSONB DEFAULT '{}',
  comparison_period TEXT,
  baseline_metrics JSONB DEFAULT '{}',
  current_metrics JSONB DEFAULT '{}',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'approved', 'rejected', 'applied', 'expired')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AD SYNC LOGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('full', 'incremental', 'manual', 'scheduled')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  campaigns_synced INTEGER DEFAULT 0,
  ad_sets_synced INTEGER DEFAULT 0,
  snapshots_created INTEGER DEFAULT 0,
  opportunities_detected INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- AD CHANGE HISTORY (Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ad_change_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('account', 'campaign', 'ad_set', 'ad')),
  entity_id UUID NOT NULL,
  external_entity_id TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'status_change', 'budget_change', 'bid_change', 'targeting_change')),
  field_changed TEXT,
  old_value JSONB,
  new_value JSONB,
  change_source TEXT CHECK (change_source IN ('user', 'api', 'automation', 'platform')),
  triggered_by_opportunity_id UUID REFERENCES ad_optimization_opportunities(id),
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Ad Accounts
CREATE INDEX IF NOT EXISTS idx_ad_accounts_workspace ON ad_accounts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_provider ON ad_accounts(workspace_id, provider);
CREATE INDEX IF NOT EXISTS idx_ad_accounts_status ON ad_accounts(workspace_id, status);

-- Ad Campaigns
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_account ON ad_campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_workspace ON ad_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_status ON ad_campaigns(ad_account_id, status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_dates ON ad_campaigns(start_date, end_date);

-- Ad Sets
CREATE INDEX IF NOT EXISTS idx_ad_sets_campaign ON ad_sets(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_sets_workspace ON ad_sets(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_sets_status ON ad_sets(ad_campaign_id, status);

-- Ad Performance Snapshots
CREATE INDEX IF NOT EXISTS idx_ad_snapshots_campaign ON ad_performance_snapshots(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_snapshots_date ON ad_performance_snapshots(ad_campaign_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_ad_snapshots_workspace ON ad_performance_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_snapshots_adset_date ON ad_performance_snapshots(ad_set_id, snapshot_date DESC) WHERE ad_set_id IS NOT NULL;

-- Ad Optimization Opportunities
CREATE INDEX IF NOT EXISTS idx_ad_opportunities_campaign ON ad_optimization_opportunities(ad_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_opportunities_workspace ON ad_optimization_opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_opportunities_status ON ad_optimization_opportunities(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_ad_opportunities_type ON ad_optimization_opportunities(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_ad_opportunities_detected ON ad_optimization_opportunities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_opportunities_open ON ad_optimization_opportunities(workspace_id, status, severity) WHERE status = 'open';

-- Ad Sync Logs
CREATE INDEX IF NOT EXISTS idx_ad_sync_logs_account ON ad_sync_logs(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_ad_sync_logs_status ON ad_sync_logs(status);

-- Ad Change History
CREATE INDEX IF NOT EXISTS idx_ad_change_history_workspace ON ad_change_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ad_change_history_entity ON ad_change_history(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ad_change_history_performed ON ad_change_history(performed_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_performance_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_optimization_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_change_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "ad_accounts_workspace_isolation" ON ad_accounts;
  DROP POLICY IF EXISTS "ad_campaigns_workspace_isolation" ON ad_campaigns;
  DROP POLICY IF EXISTS "ad_sets_workspace_isolation" ON ad_sets;
  DROP POLICY IF EXISTS "ad_snapshots_workspace_isolation" ON ad_performance_snapshots;
  DROP POLICY IF EXISTS "ad_opportunities_workspace_isolation" ON ad_optimization_opportunities;
  DROP POLICY IF EXISTS "ad_sync_logs_workspace_isolation" ON ad_sync_logs;
  DROP POLICY IF EXISTS "ad_change_history_workspace_isolation" ON ad_change_history;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- RLS Policies
CREATE POLICY "ad_accounts_workspace_isolation" ON ad_accounts
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "ad_campaigns_workspace_isolation" ON ad_campaigns
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "ad_sets_workspace_isolation" ON ad_sets
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "ad_snapshots_workspace_isolation" ON ad_performance_snapshots
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "ad_opportunities_workspace_isolation" ON ad_optimization_opportunities
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "ad_sync_logs_workspace_isolation" ON ad_sync_logs
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "ad_change_history_workspace_isolation" ON ad_change_history
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_ads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ad_accounts_updated_at ON ad_accounts;
CREATE TRIGGER trigger_ad_accounts_updated_at
  BEFORE UPDATE ON ad_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_updated_at();

DROP TRIGGER IF EXISTS trigger_ad_campaigns_updated_at ON ad_campaigns;
CREATE TRIGGER trigger_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_updated_at();

DROP TRIGGER IF EXISTS trigger_ad_sets_updated_at ON ad_sets;
CREATE TRIGGER trigger_ad_sets_updated_at
  BEFORE UPDATE ON ad_sets
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_updated_at();

DROP TRIGGER IF EXISTS trigger_ad_opportunities_updated_at ON ad_optimization_opportunities;
CREATE TRIGGER trigger_ad_opportunities_updated_at
  BEFORE UPDATE ON ad_optimization_opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_ads_updated_at();
