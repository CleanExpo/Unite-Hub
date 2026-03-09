-- ============================================================================
-- Synthex.social SEO Self-Monitoring System
-- Migration 256: SEO Metrics Tracking for synthex.social
-- Date: 2025-11-26
-- ============================================================================
-- Purpose: Track Synthex.social's own SEO performance using DataForSEO + Semrush
--          Enable "No Bluff" content policies with verifiable data
-- ============================================================================

-- ============================================================================
-- 1. Synthex SEO Metrics Table (Daily Keyword Tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_seo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_date DATE NOT NULL,
  keyword TEXT NOT NULL,
  position INTEGER CHECK (position >= 0 AND position <= 200),
  search_volume INTEGER CHECK (search_volume >= 0),
  difficulty_score INTEGER CHECK (difficulty_score >= 0 AND difficulty_score <= 100),
  provider TEXT NOT NULL CHECK (provider IN ('dataforseo', 'semrush', 'consensus')),
  confidence_score INTEGER CHECK (confidence_score >= 50 AND confidence_score <= 100),
  trend TEXT CHECK (trend IN ('up', 'down', 'stable')),
  trend_days INTEGER DEFAULT 0,
  visibility_score INTEGER CHECK (visibility_score >= 0 AND visibility_score <= 100),
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(metric_date, keyword, provider)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_synthex_seo_metrics_date ON synthex_seo_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_seo_metrics_keyword ON synthex_seo_metrics(keyword);
CREATE INDEX IF NOT EXISTS idx_synthex_seo_metrics_provider ON synthex_seo_metrics(provider);
CREATE INDEX IF NOT EXISTS idx_synthex_seo_metrics_position ON synthex_seo_metrics(position);
CREATE INDEX IF NOT EXISTS idx_synthex_seo_metrics_trend ON synthex_seo_metrics(trend);

-- ============================================================================
-- 2. Synthex SEO Daily Summary Table (Dashboard Aggregates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_seo_daily_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  summary_date DATE UNIQUE NOT NULL,
  total_keywords_tracked INTEGER NOT NULL DEFAULT 0,
  average_position NUMERIC(4, 2) CHECK (average_position >= 0),
  top_10_count INTEGER NOT NULL DEFAULT 0,
  top_20_count INTEGER NOT NULL DEFAULT 0,
  visibility_score INTEGER CHECK (visibility_score >= 0 AND visibility_score <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 50 AND confidence_score <= 100),
  updated_keywords INTEGER NOT NULL DEFAULT 0,
  new_keywords INTEGER NOT NULL DEFAULT 0,
  lost_keywords INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_synthex_seo_daily_summary_date ON synthex_seo_daily_summary(summary_date DESC);

-- ============================================================================
-- 3. Content Policy Violations Table (No Bluff Enforcement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_policy_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID, -- References generatedContent table
  content_type TEXT NOT NULL CHECK (content_type IN ('email', 'social', 'blog', 'landing_page', 'ad_copy', 'other')),
  content_preview TEXT NOT NULL, -- First 500 chars
  violated_policies TEXT[] NOT NULL, -- Array of policy names
  violation_severity TEXT NOT NULL CHECK (violation_severity IN ('warning', 'error')),
  validation_score INTEGER CHECK (validation_score >= 0 AND validation_score <= 100),
  blocked_publication BOOLEAN NOT NULL DEFAULT FALSE,
  -- Keep FK reference to auth.users (allowed in migrations)
reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  resolution TEXT CHECK (resolution IN ('approved', 'rejected', 'revised', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_policy_violations_type ON content_policy_violations(content_type);
CREATE INDEX IF NOT EXISTS idx_content_policy_violations_severity ON content_policy_violations(violation_severity);
CREATE INDEX IF NOT EXISTS idx_content_policy_violations_blocked ON content_policy_violations(blocked_publication);
CREATE INDEX IF NOT EXISTS idx_content_policy_violations_resolution ON content_policy_violations(resolution);
CREATE INDEX IF NOT EXISTS idx_content_policy_violations_created ON content_policy_violations(created_at DESC);

-- ============================================================================
-- 4. SEO Provider Audit Log (Track API Usage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seo_provider_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('dataforseo', 'semrush')),
  operation TEXT NOT NULL CHECK (operation IN ('get_rankings', 'get_keyword_data', 'get_serp_data')),
  domain TEXT NOT NULL,
  keywords_requested INTEGER,
  keywords_returned INTEGER,
  api_cost_usd NUMERIC(10, 4),
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  request_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seo_provider_audit_provider ON seo_provider_audit(provider);
CREATE INDEX IF NOT EXISTS idx_seo_provider_audit_created ON seo_provider_audit(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_provider_audit_success ON seo_provider_audit(success);

-- ============================================================================
-- 5. Helper Functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_synthex_seo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_synthex_seo_daily_summary_updated_at
  BEFORE UPDATE ON synthex_seo_daily_summary
  FOR EACH ROW
  EXECUTE FUNCTION update_synthex_seo_updated_at();

-- Function to calculate daily summary from metrics
CREATE OR REPLACE FUNCTION calculate_daily_seo_summary(target_date DATE)
RETURNS JSONB AS $$
DECLARE
  summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_keywords_tracked', COUNT(*),
    'average_position', ROUND(AVG(position)::numeric, 2),
    'top_10_count', COUNT(*) FILTER (WHERE position <= 10),
    'top_20_count', COUNT(*) FILTER (WHERE position <= 20),
    'visibility_score', ROUND(AVG(visibility_score)::numeric),
    'confidence_score', ROUND(AVG(confidence_score)::numeric)
  ) INTO summary
  FROM synthex_seo_metrics
  WHERE metric_date = target_date
    AND provider = 'consensus'; -- Use consensus data for summary

  RETURN summary;
END;
$$ LANGUAGE plpgsql;

-- Function to detect keyword trends
CREATE OR REPLACE FUNCTION detect_keyword_trend(
  p_keyword TEXT,
  p_current_date DATE,
  p_lookback_days INTEGER DEFAULT 7
)
RETURNS TEXT AS $$
DECLARE
  current_position INTEGER;
  previous_position INTEGER;
  trend TEXT;
BEGIN
  -- Get current position
  SELECT position INTO current_position
  FROM synthex_seo_metrics
  WHERE keyword = p_keyword
    AND metric_date = p_current_date
    AND provider = 'consensus'
  LIMIT 1;

  -- Get previous position (lookback days ago)
  SELECT position INTO previous_position
  FROM synthex_seo_metrics
  WHERE keyword = p_keyword
    AND metric_date = p_current_date - p_lookback_days
    AND provider = 'consensus'
  LIMIT 1;

  -- Determine trend
  IF current_position IS NULL OR previous_position IS NULL THEN
    trend := 'stable';
  ELSIF current_position < previous_position THEN
    trend := 'up'; -- Lower position number = higher rank
  ELSIF current_position > previous_position THEN
    trend := 'down';
  ELSE
    trend := 'stable';
  END IF;

  RETURN trend;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE synthex_seo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_seo_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_policy_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_provider_audit ENABLE ROW LEVEL SECURITY;

-- Synthex SEO Metrics Policies (Founder-only access)
CREATE POLICY "Founders can view SEO metrics"
  ON synthex_seo_metrics
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE role IN ('owner', 'admin')
        AND org_id = (SELECT org_id FROM organizations WHERE name = 'Synthex' LIMIT 1)
    )
  );

CREATE POLICY "System can insert SEO metrics"
  ON synthex_seo_metrics
  FOR INSERT
  WITH CHECK (true); -- Allow cron jobs to insert

-- Synthex SEO Daily Summary Policies (Founder-only access)
CREATE POLICY "Founders can view daily summary"
  ON synthex_seo_daily_summary
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE role IN ('owner', 'admin')
        AND org_id = (SELECT org_id FROM organizations WHERE name = 'Synthex' LIMIT 1)
    )
  );

CREATE POLICY "System can upsert daily summary"
  ON synthex_seo_daily_summary
  FOR ALL
  USING (true)
  WITH CHECK (true); -- Allow cron jobs to upsert

-- Content Policy Violations Policies (All authenticated users can view)
CREATE POLICY "Users can view content policy violations"
  ON content_policy_violations
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can log policy violations"
  ON content_policy_violations
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can review violations"
  ON content_policy_violations
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations WHERE role IN ('owner', 'admin')
    )
  );

-- SEO Provider Audit Policies (Founder-only access)
CREATE POLICY "Founders can view provider audit"
  ON seo_provider_audit
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE role IN ('owner', 'admin')
        AND org_id = (SELECT org_id FROM organizations WHERE name = 'Synthex' LIMIT 1)
    )
  );

CREATE POLICY "System can log provider audit"
  ON seo_provider_audit
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 7. Seed Data (Primary Keywords for Synthex.social)
-- ============================================================================

-- Note: This will be populated by the initial sync job
-- Primary keywords tracked:
-- 1. SEO intelligence
-- 2. local search rankings
-- 3. keyword research
-- 4. competitor analysis
-- 5. DataForSEO alternative
-- 6. Semrush alternative
-- 7. keyword tracking
-- 8. SERP tracking
-- 9. local SEO tool
-- 10. ranking tracker
-- 11. SEO monitoring
-- 12. domain authority

-- ============================================================================
-- 8. Comments for Documentation
-- ============================================================================

COMMENT ON TABLE synthex_seo_metrics IS 'Track Synthex.social SEO performance using DataForSEO + Semrush (daily snapshots)';
COMMENT ON TABLE synthex_seo_daily_summary IS 'Aggregated daily SEO metrics for dashboard (calculated from synthex_seo_metrics)';
COMMENT ON TABLE content_policy_violations IS 'No Bluff content policy violation tracking and review workflow';
COMMENT ON TABLE seo_provider_audit IS 'Audit trail for DataForSEO and Semrush API calls';

COMMENT ON COLUMN synthex_seo_metrics.provider IS 'DataForSEO, Semrush, or consensus (averaged)';
COMMENT ON COLUMN synthex_seo_metrics.confidence_score IS '50-100 (50=uncertain, 75=one provider, 95=both agree)';
COMMENT ON COLUMN synthex_seo_metrics.visibility_score IS 'Weighted ranking visibility (0-100)';
COMMENT ON COLUMN synthex_seo_metrics.trend IS 'up/down/stable based on 7-day comparison';

COMMENT ON COLUMN content_policy_violations.violated_policies IS 'Array of policy names (e.g., NO_FAKE_SCARCITY, NO_UNVERIFIABLE_CLAIMS)';
COMMENT ON COLUMN content_policy_violations.validation_score IS '0-100 (100=pass, 50=1 error, 0=2+ errors)';
COMMENT ON COLUMN content_policy_violations.blocked_publication IS 'true if content was blocked from publication';

COMMENT ON FUNCTION calculate_daily_seo_summary IS 'Calculate daily summary from consensus metrics for a specific date';
COMMENT ON FUNCTION detect_keyword_trend IS 'Detect trend (up/down/stable) by comparing positions over N days';

-- ============================================================================
-- 9. Initial Setup Complete
-- ============================================================================

-- Migration complete
-- Next steps:
-- 1. Configure DATAFORSEO_API_KEY and SEMRUSH_API_KEY in .env
-- 2. Run initial sync: POST /api/seo/sync-rankings
-- 3. Set up daily cron job (Vercel Cron or similar)
-- 4. Access founder dashboard at /founder/synthex-seo;
