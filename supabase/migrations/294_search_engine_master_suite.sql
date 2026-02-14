-- Migration: Search Engine Master Suite Tables
-- Description: Tables for search projects, keywords, SERP snapshots, competitors, and volatility alerts.
-- Created: 2025-11-28

-- ============================================================================
-- SEARCH PROJECTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT CHECK (verification_method IN ('dns', 'html_file', 'meta_tag', 'google_analytics', 'manual')),
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  search_engine TEXT NOT NULL DEFAULT 'google' CHECK (search_engine IN ('google', 'bing', 'yahoo', 'duckduckgo')),
  label TEXT,
  description TEXT,
  default_location TEXT DEFAULT 'United States',
  default_language TEXT DEFAULT 'en',
  default_device TEXT DEFAULT 'desktop' CHECK (default_device IN ('desktop', 'mobile', 'tablet')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  gsc_property_url TEXT,
  gsc_connected BOOLEAN DEFAULT FALSE,
  gsc_last_sync_at TIMESTAMPTZ,
  bing_site_url TEXT,
  bing_connected BOOLEAN DEFAULT FALSE,
  bing_last_sync_at TIMESTAMPTZ,
  total_keywords INTEGER DEFAULT 0,
  total_competitors INTEGER DEFAULT 0,
  health_score NUMERIC(5,2),
  last_audit_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, domain, search_engine)
);

-- ============================================================================
-- SEARCH KEYWORDS
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_project_id UUID NOT NULL REFERENCES search_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  location TEXT DEFAULT 'United States',
  language TEXT DEFAULT 'en',
  device TEXT DEFAULT 'desktop' CHECK (device IN ('desktop', 'mobile', 'tablet')),
  intent_label TEXT CHECK (intent_label IN ('informational', 'navigational', 'transactional', 'commercial', 'local')),
  intent_confidence NUMERIC(4,3),
  search_volume INTEGER,
  search_volume_trend NUMERIC(6,2),
  cpc NUMERIC(10,4),
  competition TEXT CHECK (competition IN ('low', 'medium', 'high')),
  competition_score NUMERIC(4,3),
  difficulty_score NUMERIC(5,2),
  current_position INTEGER,
  best_position INTEGER,
  worst_position INTEGER,
  avg_position NUMERIC(6,2),
  position_change INTEGER,
  position_change_30d INTEGER,
  current_url TEXT,
  is_featured_snippet BOOLEAN DEFAULT FALSE,
  is_local_pack BOOLEAN DEFAULT FALSE,
  serp_features TEXT[],
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  tags TEXT[],
  notes TEXT,
  last_checked_at TIMESTAMPTZ,
  tracking_started_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(search_project_id, keyword, location, device)
);

-- ============================================================================
-- SEARCH SERP SNAPSHOTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_serp_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_keyword_id UUID NOT NULL REFERENCES search_keywords(id) ON DELETE CASCADE,
  search_project_id UUID NOT NULL REFERENCES search_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  search_engine TEXT NOT NULL DEFAULT 'google',
  location TEXT,
  device TEXT DEFAULT 'desktop',
  -- Position Data
  position INTEGER,
  previous_position INTEGER,
  position_change INTEGER,
  url TEXT,
  title TEXT,
  description TEXT,
  is_own_domain BOOLEAN DEFAULT FALSE,
  -- SERP Features
  serp_features JSONB DEFAULT '[]',
  has_featured_snippet BOOLEAN DEFAULT FALSE,
  has_local_pack BOOLEAN DEFAULT FALSE,
  has_knowledge_panel BOOLEAN DEFAULT FALSE,
  has_people_also_ask BOOLEAN DEFAULT FALSE,
  has_video_carousel BOOLEAN DEFAULT FALSE,
  has_image_pack BOOLEAN DEFAULT FALSE,
  has_shopping_results BOOLEAN DEFAULT FALSE,
  -- Competition in SERP
  top_10_domains TEXT[],
  competitor_positions JSONB DEFAULT '{}',
  -- Screenshot
  screenshot_path TEXT,
  screenshot_bucket TEXT,
  screenshot_size_bytes INTEGER,
  -- Raw Data
  raw_serp_results JSONB DEFAULT '[]',
  total_results BIGINT,
  search_time_seconds NUMERIC(6,4),
  -- Metadata
  capture_method TEXT CHECK (capture_method IN ('api', 'browser', 'manual')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEARCH COMPETITORS
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_project_id UUID NOT NULL REFERENCES search_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  label TEXT,
  description TEXT,
  is_direct_competitor BOOLEAN DEFAULT TRUE,
  discovered_via TEXT CHECK (discovered_via IN ('manual', 'serp_analysis', 'import', 'suggestion')),
  -- Metrics
  total_keywords_tracked INTEGER DEFAULT 0,
  keywords_better_than_us INTEGER DEFAULT 0,
  keywords_worse_than_us INTEGER DEFAULT 0,
  avg_position NUMERIC(6,2),
  visibility_score NUMERIC(6,2),
  estimated_traffic BIGINT,
  domain_authority NUMERIC(5,2),
  -- Comparison
  overlap_keywords TEXT[],
  gap_keywords TEXT[],
  opportunity_keywords TEXT[],
  last_compared_at TIMESTAMPTZ,
  comparison_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(search_project_id, domain)
);

-- ============================================================================
-- SEARCH VOLATILITY ALERTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_volatility_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_project_id UUID NOT NULL REFERENCES search_projects(id) ON DELETE CASCADE,
  search_keyword_id UUID REFERENCES search_keywords(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'position_drop', 'position_gain', 'new_ranking', 'lost_ranking',
    'traffic_drop', 'traffic_spike', 'impression_drop', 'impression_spike',
    'new_competitor', 'competitor_gain', 'serp_feature_lost', 'serp_feature_gained',
    'algorithm_update', 'indexing_issue', 'manual_action'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  -- Metric Details
  metric_name TEXT,
  metric_previous_value NUMERIC(15,4),
  metric_current_value NUMERIC(15,4),
  metric_change_absolute NUMERIC(15,4),
  metric_change_percentage NUMERIC(10,4),
  metric_json JSONB DEFAULT '{}',
  -- Context
  affected_keywords TEXT[],
  affected_urls TEXT[],
  comparison_period TEXT,
  baseline_date DATE,
  alert_date DATE,
  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'investigating', 'resolved', 'dismissed')),
  -- Keep FK reference to auth.users (allowed in migrations)
acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  -- Keep FK reference to auth.users (allowed in migrations)
resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  -- Notifications
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_channels TEXT[],
  notification_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SEARCH AUDIT REPORTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_project_id UUID NOT NULL REFERENCES search_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  audit_type TEXT NOT NULL CHECK (audit_type IN ('technical', 'content', 'backlinks', 'full', 'quick')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  -- Scores
  overall_score NUMERIC(5,2),
  technical_score NUMERIC(5,2),
  content_score NUMERIC(5,2),
  backlink_score NUMERIC(5,2),
  ux_score NUMERIC(5,2),
  -- Counts
  issues_critical INTEGER DEFAULT 0,
  issues_high INTEGER DEFAULT 0,
  issues_medium INTEGER DEFAULT 0,
  issues_low INTEGER DEFAULT 0,
  opportunities_count INTEGER DEFAULT 0,
  -- Details
  issues JSONB DEFAULT '[]',
  opportunities JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  comparison_to_previous JSONB DEFAULT '{}',
  -- Execution
  pages_crawled INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- GSC DATA SNAPSHOTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_gsc_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_project_id UUID NOT NULL REFERENCES search_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  dimension_type TEXT NOT NULL CHECK (dimension_type IN ('query', 'page', 'country', 'device', 'searchAppearance')),
  dimension_value TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6),
  position NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(search_project_id, snapshot_date, dimension_type, dimension_value)
);

-- ============================================================================
-- BING WEBMASTER SNAPSHOTS
-- ============================================================================
CREATE TABLE IF NOT EXISTS search_bing_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_project_id UUID NOT NULL REFERENCES search_projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  dimension_type TEXT NOT NULL CHECK (dimension_type IN ('query', 'page', 'country', 'device')),
  dimension_value TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(10,6),
  position NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(search_project_id, snapshot_date, dimension_type, dimension_value)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Search Projects
CREATE INDEX IF NOT EXISTS idx_search_projects_workspace ON search_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_search_projects_domain ON search_projects(workspace_id, domain);
CREATE INDEX IF NOT EXISTS idx_search_projects_status ON search_projects(workspace_id, status);

-- Search Keywords
CREATE INDEX IF NOT EXISTS idx_search_keywords_project ON search_keywords(search_project_id);
CREATE INDEX IF NOT EXISTS idx_search_keywords_workspace ON search_keywords(workspace_id);
CREATE INDEX IF NOT EXISTS idx_search_keywords_position ON search_keywords(search_project_id, current_position);
CREATE INDEX IF NOT EXISTS idx_search_keywords_intent ON search_keywords(search_project_id, intent_label);
CREATE INDEX IF NOT EXISTS idx_search_keywords_priority ON search_keywords(search_project_id, priority);

-- SERP Snapshots
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_keyword ON search_serp_snapshots(search_keyword_id);
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_project ON search_serp_snapshots(search_project_id);
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_date ON search_serp_snapshots(search_keyword_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_workspace ON search_serp_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_serp_snapshots_own_domain ON search_serp_snapshots(search_project_id, is_own_domain) WHERE is_own_domain = TRUE;

-- Search Competitors
CREATE INDEX IF NOT EXISTS idx_search_competitors_project ON search_competitors(search_project_id);
CREATE INDEX IF NOT EXISTS idx_search_competitors_workspace ON search_competitors(workspace_id);
CREATE INDEX IF NOT EXISTS idx_search_competitors_domain ON search_competitors(search_project_id, domain);

-- Volatility Alerts
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_project ON search_volatility_alerts(search_project_id);
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_keyword ON search_volatility_alerts(search_keyword_id) WHERE search_keyword_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_workspace ON search_volatility_alerts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_status ON search_volatility_alerts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_severity ON search_volatility_alerts(workspace_id, severity);
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_detected ON search_volatility_alerts(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_volatility_alerts_open ON search_volatility_alerts(workspace_id, status, severity) WHERE status = 'open';

-- Audit Reports
CREATE INDEX IF NOT EXISTS idx_audit_reports_project ON search_audit_reports(search_project_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_workspace ON search_audit_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_reports_status ON search_audit_reports(status);

-- GSC Snapshots
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_project ON search_gsc_snapshots(search_project_id);
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_date ON search_gsc_snapshots(search_project_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_snapshots_dimension ON search_gsc_snapshots(search_project_id, dimension_type, snapshot_date DESC);

-- Bing Snapshots
CREATE INDEX IF NOT EXISTS idx_bing_snapshots_project ON search_bing_snapshots(search_project_id);
CREATE INDEX IF NOT EXISTS idx_bing_snapshots_date ON search_bing_snapshots(search_project_id, snapshot_date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE search_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_serp_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_volatility_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_gsc_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_bing_snapshots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "search_projects_workspace_isolation" ON search_projects;
  DROP POLICY IF EXISTS "search_keywords_workspace_isolation" ON search_keywords;
  DROP POLICY IF EXISTS "search_serp_workspace_isolation" ON search_serp_snapshots;
  DROP POLICY IF EXISTS "search_competitors_workspace_isolation" ON search_competitors;
  DROP POLICY IF EXISTS "search_alerts_workspace_isolation" ON search_volatility_alerts;
  DROP POLICY IF EXISTS "search_audits_workspace_isolation" ON search_audit_reports;
  DROP POLICY IF EXISTS "search_gsc_workspace_isolation" ON search_gsc_snapshots;
  DROP POLICY IF EXISTS "search_bing_workspace_isolation" ON search_bing_snapshots;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- RLS Policies
CREATE POLICY "search_projects_workspace_isolation" ON search_projects
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "search_keywords_workspace_isolation" ON search_keywords
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "search_serp_workspace_isolation" ON search_serp_snapshots
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "search_competitors_workspace_isolation" ON search_competitors
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "search_alerts_workspace_isolation" ON search_volatility_alerts
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "search_audits_workspace_isolation" ON search_audit_reports
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "search_gsc_workspace_isolation" ON search_gsc_snapshots
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

CREATE POLICY "search_bing_workspace_isolation" ON search_bing_snapshots
  FOR ALL USING (
    workspace_id IN (
      SELECT uo.org_id FROM user_organizations uo WHERE uo.user_id = auth.uid()
    )
  );

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update keyword count on project
CREATE OR REPLACE FUNCTION update_search_project_keyword_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE search_projects
    SET total_keywords = total_keywords + 1,
        updated_at = NOW()
    WHERE id = NEW.search_project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE search_projects
    SET total_keywords = total_keywords - 1,
        updated_at = NOW()
    WHERE id = OLD.search_project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_keyword_count ON search_keywords;
CREATE TRIGGER trigger_update_project_keyword_count
  AFTER INSERT OR DELETE ON search_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_search_project_keyword_count();

-- Update competitor count on project
CREATE OR REPLACE FUNCTION update_search_project_competitor_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE search_projects
    SET total_competitors = total_competitors + 1,
        updated_at = NOW()
    WHERE id = NEW.search_project_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE search_projects
    SET total_competitors = total_competitors - 1,
        updated_at = NOW()
    WHERE id = OLD.search_project_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_project_competitor_count ON search_competitors;
CREATE TRIGGER trigger_update_project_competitor_count
  AFTER INSERT OR DELETE ON search_competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_search_project_competitor_count();

-- Update timestamps
CREATE OR REPLACE FUNCTION update_search_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_search_projects_updated_at ON search_projects;
CREATE TRIGGER trigger_search_projects_updated_at
  BEFORE UPDATE ON search_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_search_updated_at();

DROP TRIGGER IF EXISTS trigger_search_keywords_updated_at ON search_keywords;
CREATE TRIGGER trigger_search_keywords_updated_at
  BEFORE UPDATE ON search_keywords
  FOR EACH ROW
  EXECUTE FUNCTION update_search_updated_at();

DROP TRIGGER IF EXISTS trigger_search_competitors_updated_at ON search_competitors;
CREATE TRIGGER trigger_search_competitors_updated_at
  BEFORE UPDATE ON search_competitors
  FOR EACH ROW
  EXECUTE FUNCTION update_search_updated_at();

DROP TRIGGER IF EXISTS trigger_volatility_alerts_updated_at ON search_volatility_alerts;
CREATE TRIGGER trigger_volatility_alerts_updated_at
  BEFORE UPDATE ON search_volatility_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_search_updated_at();
