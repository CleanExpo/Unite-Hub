/**
 * Synthex.social Autonomous Analytics Integration Schema
 *
 * Tables for managing autonomous analytics setup and monitoring:
 * - synthex_autonomous_integrations: Configuration tracking
 * - synthex_automation_schedules: Cron job scheduling
 * - synthex_ga4_metrics: GA4 data storage
 * - synthex_gsc_metrics: Google Search Console data storage
 * - synthex_core_vitals_metrics: Core Web Vitals storage
 * - synthex_sync_logs: Sync operation audit trail
 *
 * Migration Version: 260
 * Created: 2025-11-26
 */

-- ============================================================================
-- 1. Autonomous Integrations Configuration Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_autonomous_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  integration_type TEXT NOT NULL DEFAULT 'analytics_suite',

  -- Configuration details
  ga4_property_id TEXT,
  gsc_site_url TEXT,
  dataforseo_api_key_id UUID,
  semrush_api_key_id UUID,

  -- Status tracking
  ga4_status TEXT DEFAULT 'not_configured',  -- not_configured, pending_verification, verified, error
  gsc_status TEXT DEFAULT 'not_configured',
  dataforseo_status TEXT DEFAULT 'not_configured',
  semrush_status TEXT DEFAULT 'not_configured',

  -- Configuration data
  configuration JSONB DEFAULT '{}'::jsonb,  -- Stores nested config

  -- Timestamps
  setup_initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  setup_completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT domain_not_empty CHECK (domain != '')
);

CREATE INDEX idx_synthex_autonomous_integrations_domain
  ON synthex_autonomous_integrations(domain);
CREATE INDEX idx_synthex_autonomous_integrations_status
  ON synthex_autonomous_integrations(ga4_status, gsc_status);

-- ============================================================================
-- 2. Automation Schedules (Cron Job Configuration)
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_automation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  sync_type TEXT NOT NULL,  -- analytics, seo, backlinks, content, etc.

  -- Schedule configuration
  frequency TEXT DEFAULT 'daily',  -- hourly, daily, weekly, monthly
  scheduled_time TEXT DEFAULT '06:00',  -- HH:MM format (UTC)
  enabled BOOLEAN DEFAULT TRUE,

  -- Execution tracking
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  last_run_status TEXT,  -- success, error, partial
  consecutive_failures INT DEFAULT 0,

  -- Configuration
  configuration JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_domain_sync_type UNIQUE(domain, sync_type),
  CONSTRAINT sync_type_valid CHECK (sync_type IN ('analytics', 'seo', 'backlinks', 'content', 'core_vitals', 'gsc', 'ga4'))
);

CREATE INDEX idx_synthex_automation_schedules_domain_enabled
  ON synthex_automation_schedules(domain, enabled);
CREATE INDEX idx_synthex_automation_schedules_next_run
  ON synthex_automation_schedules(next_run);

-- ============================================================================
-- 3. GA4 Metrics Storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_ga4_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  property_id TEXT NOT NULL,

  -- Time period
  metric_date DATE NOT NULL,
  date_range JSONB,  -- { start, end }

  -- Aggregated metrics
  main_metrics JSONB,  -- { sessions, users, pageviews, avgSessionDuration, bounceRate, engagementRate }
  top_pages JSONB,  -- Array of { path, views, avgSessionDuration }
  traffic_sources JSONB,  -- Array of { source, sessions, users }
  devices JSONB,  -- Array of { category, sessions, bounceRate }

  -- Raw data for re-analysis
  raw_data JSONB,

  -- Metadata
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT ga4_metrics_date_domain UNIQUE(domain, property_id, metric_date)
);

CREATE INDEX idx_synthex_ga4_metrics_domain_date
  ON synthex_ga4_metrics(domain, metric_date DESC);
CREATE INDEX idx_synthex_ga4_metrics_property_date
  ON synthex_ga4_metrics(property_id, metric_date DESC);

-- ============================================================================
-- 4. Google Search Console Metrics Storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_gsc_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  site_url TEXT NOT NULL,

  -- Time period
  metric_date DATE NOT NULL,
  date_range JSONB,  -- { start, end }

  -- Aggregated metrics
  total_metrics JSONB,  -- { clicks, impressions, avgPosition, avgCTR, queriesCount }
  top_queries JSONB,  -- Array of { query, clicks, impressions, ctr, position }
  top_pages JSONB,  -- Array of { page, clicks, impressions, ctr, position }
  countries JSONB,  -- Array of { country, clicks, impressions, ctr, position }
  devices JSONB,  -- Array of { device, clicks, impressions, ctr, position }

  -- Raw data for re-analysis
  raw_data JSONB,

  -- Metadata
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT gsc_metrics_date_domain UNIQUE(domain, site_url, metric_date)
);

CREATE INDEX idx_synthex_gsc_metrics_domain_date
  ON synthex_gsc_metrics(domain, metric_date DESC);
CREATE INDEX idx_synthex_gsc_metrics_siteurl_date
  ON synthex_gsc_metrics(site_url, metric_date DESC);

-- ============================================================================
-- 5. Core Web Vitals Metrics Storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_core_vitals_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,

  -- Time period
  metric_date DATE NOT NULL,

  -- Data sources
  crux_data JSONB,  -- Chrome User Experience Report data
  pagespeed_data JSONB,  -- PageSpeed Insights data (mobile + desktop)

  -- Calculated summary
  overall_status TEXT,  -- good, needs_improvement, poor
  recommendations JSONB,  -- Array of recommendations

  -- Metadata
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT core_vitals_date_domain UNIQUE(domain, metric_date)
);

CREATE INDEX idx_synthex_core_vitals_domain_date
  ON synthex_core_vitals_metrics(domain, metric_date DESC);
CREATE INDEX idx_synthex_core_vitals_status
  ON synthex_core_vitals_metrics(domain, overall_status);

-- ============================================================================
-- 6. Sync Operation Log (Audit Trail)
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  sync_type TEXT NOT NULL,  -- ga4, gsc, core_vitals, seo, backlinks

  -- Result tracking
  status TEXT NOT NULL,  -- success, partial, error
  error_message TEXT,
  error_count INT DEFAULT 0,

  -- Data summary
  records_synced INT DEFAULT 0,
  data_summary JSONB,

  -- Performance tracking
  duration_ms INT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT sync_type_valid CHECK (sync_type IN ('ga4', 'gsc', 'core_vitals', 'seo', 'backlinks', 'analytics'))
);

CREATE INDEX idx_synthex_sync_logs_domain
  ON synthex_sync_logs(domain, synced_at DESC);
CREATE INDEX idx_synthex_sync_logs_status
  ON synthex_sync_logs(status, synced_at DESC);
CREATE INDEX idx_synthex_sync_logs_type_domain
  ON synthex_sync_logs(sync_type, domain, synced_at DESC);

-- ============================================================================
-- 7. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE synthex_autonomous_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_automation_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_ga4_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_gsc_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_core_vitals_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_sync_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS Policies - Public Read (Founder Dashboard)
-- ============================================================================

-- Founder can view autonomous integrations
CREATE POLICY "founders_view_autonomous_integrations" ON synthex_autonomous_integrations
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
      AND user_organizations.role = 'owner'
    )
  );

-- Cron jobs can read/write (via CRON_SECRET verification in endpoint)
CREATE POLICY "system_manage_automation_schedules" ON synthex_automation_schedules
  FOR ALL
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

-- Founder can view GA4 metrics
CREATE POLICY "founders_view_ga4_metrics" ON synthex_ga4_metrics
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
      AND user_organizations.role = 'owner'
    )
  );

-- Cron jobs can insert GA4 data
CREATE POLICY "system_insert_ga4_metrics" ON synthex_ga4_metrics
  FOR INSERT
  WITH CHECK (true);

-- Founder can view GSC metrics
CREATE POLICY "founders_view_gsc_metrics" ON synthex_gsc_metrics
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
      AND user_organizations.role = 'owner'
    )
  );

-- Cron jobs can insert GSC data
CREATE POLICY "system_insert_gsc_metrics" ON synthex_gsc_metrics
  FOR INSERT
  WITH CHECK (true);

-- Founder can view Core Vitals
CREATE POLICY "founders_view_core_vitals" ON synthex_core_vitals_metrics
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
      AND user_organizations.role = 'owner'
    )
  );

-- Cron jobs can insert Core Vitals data
CREATE POLICY "system_insert_core_vitals" ON synthex_core_vitals_metrics
  FOR INSERT
  WITH CHECK (true);

-- Everyone can view sync logs (non-sensitive)
CREATE POLICY "public_view_sync_logs" ON synthex_sync_logs
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

-- Cron jobs can insert sync logs
CREATE POLICY "system_insert_sync_logs" ON synthex_sync_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 9. Helper Functions
-- ============================================================================

/**
 * Get next scheduled sync time
 */
CREATE OR REPLACE FUNCTION get_next_scheduled_sync(p_domain TEXT)
RETURNS TABLE (
  sync_type TEXT,
  next_run TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    synthex_automation_schedules.sync_type,
    synthex_automation_schedules.next_run,
    synthex_automation_schedules.enabled
  FROM synthex_automation_schedules
  WHERE synthex_automation_schedules.domain = p_domain
  AND synthex_automation_schedules.enabled = true
  ORDER BY synthex_automation_schedules.next_run ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get latest sync status for domain
 */
CREATE OR REPLACE FUNCTION get_latest_sync_status(p_domain TEXT)
RETURNS TABLE (
  sync_type TEXT,
  status TEXT,
  last_run TIMESTAMP WITH TIME ZONE,
  duration_ms INT,
  error_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (synthex_sync_logs.sync_type)
    synthex_sync_logs.sync_type,
    synthex_sync_logs.status,
    synthex_sync_logs.synced_at,
    synthex_sync_logs.duration_ms,
    synthex_sync_logs.error_count
  FROM synthex_sync_logs
  WHERE synthex_sync_logs.domain = p_domain
  ORDER BY synthex_sync_logs.sync_type, synthex_sync_logs.synced_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Mark sync as completed (update schedule + log)
 */
CREATE OR REPLACE FUNCTION mark_sync_completed(
  p_domain TEXT,
  p_sync_type TEXT,
  p_status TEXT,
  p_records INT DEFAULT 0,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update next run time (add 24 hours for daily schedules)
  UPDATE synthex_automation_schedules
  SET
    last_run = NOW(),
    next_run = NOW() + INTERVAL '24 hours',
    last_run_status = p_status,
    consecutive_failures = CASE
      WHEN p_status = 'error' THEN consecutive_failures + 1
      ELSE 0
    END,
    updated_at = NOW()
  WHERE domain = p_domain
  AND sync_type = p_sync_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. Indexes for Performance
-- ============================================================================

-- Speed up common queries
CREATE INDEX IF NOT EXISTS idx_synthex_ga4_metrics_synced_at
  ON synthex_ga4_metrics(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_gsc_metrics_synced_at
  ON synthex_gsc_metrics(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_core_vitals_synced_at
  ON synthex_core_vitals_metrics(synced_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_sync_logs_started_at
  ON synthex_sync_logs(started_at DESC);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Insert initial configuration for synthex.social
DO $$
BEGIN
  INSERT INTO synthex_autonomous_integrations (
    domain,
    integration_type,
    ga4_status,
    gsc_status
  ) VALUES (
    'synthex.social',
    'analytics_suite',
    'pending',
    'pending'
  )
  ON CONFLICT (domain) DO NOTHING;
END;
$$;

-- Insert initial automation schedules for synthex.social
DO $$
BEGIN
  INSERT INTO synthex_automation_schedules (domain, sync_type, frequency, scheduled_time)
  VALUES
    ('synthex.social', 'ga4', 'daily', '06:00'),
    ('synthex.social', 'gsc', 'daily', '06:15'),
    ('synthex.social', 'core_vitals', 'daily', '06:30')
  ON CONFLICT (domain, sync_type) DO NOTHING;
END;
$$;

-- ============================================================================
-- VERIFICATION SCRIPT (Run after migration)
-- ============================================================================

/*
SELECT
  COUNT(CASE WHEN relname = 'synthex_autonomous_integrations' THEN 1 END) as autonomous_integrations,
  COUNT(CASE WHEN relname = 'synthex_automation_schedules' THEN 1 END) as automation_schedules,
  COUNT(CASE WHEN relname = 'synthex_ga4_metrics' THEN 1 END) as ga4_metrics,
  COUNT(CASE WHEN relname = 'synthex_gsc_metrics' THEN 1 END) as gsc_metrics,
  COUNT(CASE WHEN relname = 'synthex_core_vitals_metrics' THEN 1 END) as core_vitals_metrics,
  COUNT(CASE WHEN relname = 'synthex_sync_logs' THEN 1 END) as sync_logs
FROM pg_class
WHERE relname LIKE 'synthex_%';
*/;
