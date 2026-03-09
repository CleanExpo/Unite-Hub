-- Migration 151: Search Console & Analytics Cache Tables
-- Purpose: Implements cache tables for Search Console, GA4, Bing Webmaster Tools, and DataForSEO
-- Cache Rules: 24-hour expiry, brand-aware segmentation, manual refresh capability

-- ============================================================================
-- 1. SEARCH CONSOLE CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS search_console_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_slug TEXT NOT NULL,

  -- Data origin tracking (Truth Layer compliance)
  data_source TEXT NOT NULL CHECK (data_source IN ('google_search_console', 'bing_webmaster_tools')),
  site_url TEXT NOT NULL,

  -- Metrics
  query TEXT,
  page TEXT,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  ctr NUMERIC(5,4), -- Click-through rate (e.g., 0.1234 = 12.34%)
  position NUMERIC(5,2), -- Average position (e.g., 5.23)

  -- Date range
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,

  -- Cache control
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  invalidate_on_manual_refresh BOOLEAN DEFAULT TRUE,

  -- Metadata
  raw_response JSONB,
  uncertainty_notes TEXT,

  CONSTRAINT valid_ctr CHECK (ctr IS NULL OR (ctr >= 0 AND ctr <= 1)),
  CONSTRAINT valid_position CHECK (position IS NULL OR position > 0)
);

-- Indexes for performance
CREATE INDEX idx_search_console_cache_workspace ON search_console_cache(workspace_id);
CREATE INDEX idx_search_console_cache_brand ON search_console_cache(brand_slug);
CREATE INDEX idx_search_console_cache_expires ON search_console_cache(expires_at);
CREATE INDEX idx_search_console_cache_query ON search_console_cache(query) WHERE query IS NOT NULL;
CREATE INDEX idx_search_console_cache_page ON search_console_cache(page) WHERE page IS NOT NULL;
CREATE INDEX idx_search_console_cache_date_range ON search_console_cache(date_start, date_end);

-- ============================================================================
-- 2. ANALYTICS CACHE TABLE (GA4)
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_slug TEXT NOT NULL,

  -- Data origin tracking
  data_source TEXT NOT NULL CHECK (data_source = 'google_analytics_4'),
  property_id TEXT NOT NULL,

  -- Metrics
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  dimension_name TEXT,
  dimension_value TEXT,

  -- Date range
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,

  -- Cache control
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  invalidate_on_manual_refresh BOOLEAN DEFAULT TRUE,

  -- Metadata
  raw_response JSONB,
  uncertainty_notes TEXT
);

-- Indexes
CREATE INDEX idx_analytics_cache_workspace ON analytics_cache(workspace_id);
CREATE INDEX idx_analytics_cache_brand ON analytics_cache(brand_slug);
CREATE INDEX idx_analytics_cache_expires ON analytics_cache(expires_at);
CREATE INDEX idx_analytics_cache_metric ON analytics_cache(metric_name);
CREATE INDEX idx_analytics_cache_date_range ON analytics_cache(date_start, date_end);

-- ============================================================================
-- 3. DATAFORSEO CACHE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS dataforseo_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_slug TEXT NOT NULL,

  -- Data origin tracking
  data_source TEXT NOT NULL DEFAULT 'dataforseo',
  api_endpoint TEXT NOT NULL, -- e.g., 'serp/google/organic', 'keywords/google/search_volume'

  -- Query parameters
  keyword TEXT,
  location_code INTEGER,
  language_code TEXT,
  device TEXT CHECK (device IN ('desktop', 'mobile', 'tablet')),

  -- Results
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  cpc NUMERIC(10,2),
  competition NUMERIC(3,2),
  ranking_position INTEGER,
  ranking_url TEXT,

  -- Date range
  date_start DATE NOT NULL,
  date_end DATE NOT NULL,

  -- Cache control
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  invalidate_on_manual_refresh BOOLEAN DEFAULT TRUE,

  -- Metadata
  raw_response JSONB,
  uncertainty_notes TEXT,

  CONSTRAINT valid_keyword_difficulty CHECK (keyword_difficulty IS NULL OR (keyword_difficulty >= 0 AND keyword_difficulty <= 100)),
  CONSTRAINT valid_competition CHECK (competition IS NULL OR (competition >= 0 AND competition <= 1))
);

-- Indexes
CREATE INDEX idx_dataforseo_cache_workspace ON dataforseo_cache(workspace_id);
CREATE INDEX idx_dataforseo_cache_brand ON dataforseo_cache(brand_slug);
CREATE INDEX idx_dataforseo_cache_expires ON dataforseo_cache(expires_at);
CREATE INDEX idx_dataforseo_cache_keyword ON dataforseo_cache(keyword) WHERE keyword IS NOT NULL;
CREATE INDEX idx_dataforseo_cache_endpoint ON dataforseo_cache(api_endpoint);
CREATE INDEX idx_dataforseo_cache_date_range ON dataforseo_cache(date_start, date_end);

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all cache tables
ALTER TABLE search_console_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE dataforseo_cache ENABLE ROW LEVEL SECURITY;

-- Founder can read/write all cache data
CREATE POLICY search_console_cache_founder_policy ON search_console_cache
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = search_console_cache.workspace_id
    )
  );

CREATE POLICY analytics_cache_founder_policy ON analytics_cache
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = analytics_cache.workspace_id
    )
  );

CREATE POLICY dataforseo_cache_founder_policy ON dataforseo_cache
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = dataforseo_cache.workspace_id
    )
  );

-- Service role can perform all operations (for automated sync)
CREATE POLICY search_console_cache_service_policy ON search_console_cache
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

CREATE POLICY analytics_cache_service_policy ON analytics_cache
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

CREATE POLICY dataforseo_cache_service_policy ON dataforseo_cache
  FOR ALL TO service_role
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true)
  WITH CHECK (true);

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Get valid cached Search Console data (not expired)
CREATE OR REPLACE FUNCTION get_search_console_cache(
  p_workspace_id UUID,
  p_brand_slug TEXT DEFAULT NULL,
  p_data_source TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  brand_slug TEXT,
  data_source TEXT,
  site_url TEXT,
  query TEXT,
  page TEXT,
  impressions INTEGER,
  clicks INTEGER,
  ctr NUMERIC,
  position NUMERIC,
  date_start DATE,
  date_end DATE,
  created_at TIMESTAMPTZ,
  uncertainty_notes TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    scc.id,
    scc.brand_slug,
    scc.data_source,
    scc.site_url,
    scc.query,
    scc.page,
    scc.impressions,
    scc.clicks,
    scc.ctr,
    scc.position,
    scc.date_start,
    scc.date_end,
    scc.created_at,
    scc.uncertainty_notes
  FROM search_console_cache scc
  WHERE scc.workspace_id = p_workspace_id
    AND scc.expires_at > NOW()
    AND (p_brand_slug IS NULL OR scc.brand_slug = p_brand_slug)
    AND (p_data_source IS NULL OR scc.data_source = p_data_source)
  ORDER BY scc.created_at DESC;
END;
$$;

-- Get valid cached Analytics data (not expired)
CREATE OR REPLACE FUNCTION get_analytics_cache(
  p_workspace_id UUID,
  p_brand_slug TEXT DEFAULT NULL,
  p_metric_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  brand_slug TEXT,
  property_id TEXT,
  metric_name TEXT,
  metric_value NUMERIC,
  dimension_name TEXT,
  dimension_value TEXT,
  date_start DATE,
  date_end DATE,
  created_at TIMESTAMPTZ,
  uncertainty_notes TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.id,
    ac.brand_slug,
    ac.property_id,
    ac.metric_name,
    ac.metric_value,
    ac.dimension_name,
    ac.dimension_value,
    ac.date_start,
    ac.date_end,
    ac.created_at,
    ac.uncertainty_notes
  FROM analytics_cache ac
  WHERE ac.workspace_id = p_workspace_id
    AND ac.expires_at > NOW()
    AND (p_brand_slug IS NULL OR ac.brand_slug = p_brand_slug)
    AND (p_metric_name IS NULL OR ac.metric_name = p_metric_name)
  ORDER BY ac.created_at DESC;
END;
$$;

-- Get valid cached DataForSEO data (not expired)
CREATE OR REPLACE FUNCTION get_dataforseo_cache(
  p_workspace_id UUID,
  p_brand_slug TEXT DEFAULT NULL,
  p_keyword TEXT DEFAULT NULL,
  p_api_endpoint TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  brand_slug TEXT,
  api_endpoint TEXT,
  keyword TEXT,
  location_code INTEGER,
  language_code TEXT,
  device TEXT,
  search_volume INTEGER,
  keyword_difficulty INTEGER,
  cpc NUMERIC,
  competition NUMERIC,
  ranking_position INTEGER,
  ranking_url TEXT,
  date_start DATE,
  date_end DATE,
  created_at TIMESTAMPTZ,
  uncertainty_notes TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.brand_slug,
    dc.api_endpoint,
    dc.keyword,
    dc.location_code,
    dc.language_code,
    dc.device,
    dc.search_volume,
    dc.keyword_difficulty,
    dc.cpc,
    dc.competition,
    dc.ranking_position,
    dc.ranking_url,
    dc.date_start,
    dc.date_end,
    dc.created_at,
    dc.uncertainty_notes
  FROM dataforseo_cache dc
  WHERE dc.workspace_id = p_workspace_id
    AND dc.expires_at > NOW()
    AND (p_brand_slug IS NULL OR dc.brand_slug = p_brand_slug)
    AND (p_keyword IS NULL OR dc.keyword = p_keyword)
    AND (p_api_endpoint IS NULL OR dc.api_endpoint = p_api_endpoint)
  ORDER BY dc.created_at DESC;
END;
$$;

-- Invalidate all cache for a workspace (manual refresh)
CREATE OR REPLACE FUNCTION invalidate_analytics_cache(
  p_workspace_id UUID,
  p_brand_slug TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Invalidate Search Console cache
  UPDATE search_console_cache
  SET expires_at = NOW()
  WHERE workspace_id = p_workspace_id
    AND invalidate_on_manual_refresh = TRUE
    AND (p_brand_slug IS NULL OR brand_slug = p_brand_slug);

  -- Invalidate Analytics cache
  UPDATE analytics_cache
  SET expires_at = NOW()
  WHERE workspace_id = p_workspace_id
    AND invalidate_on_manual_refresh = TRUE
    AND (p_brand_slug IS NULL OR brand_slug = p_brand_slug);

  -- Invalidate DataForSEO cache
  UPDATE dataforseo_cache
  SET expires_at = NOW()
  WHERE workspace_id = p_workspace_id
    AND invalidate_on_manual_refresh = TRUE
    AND (p_brand_slug IS NULL OR brand_slug = p_brand_slug);
END;
$$;

-- Get cache status summary
CREATE OR REPLACE FUNCTION get_analytics_cache_status(
  p_workspace_id UUID
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'search_console', (
      SELECT json_build_object(
        'total_entries', COUNT(*),
        'valid_entries', COUNT(*) FILTER (WHERE expires_at > NOW()),
        'expired_entries', COUNT(*) FILTER (WHERE expires_at <= NOW()),
        'by_brand', (
          SELECT json_object_agg(brand_slug, cnt)
          FROM (
            SELECT brand_slug, COUNT(*) as cnt
            FROM search_console_cache
            WHERE workspace_id = p_workspace_id AND expires_at > NOW()
            GROUP BY brand_slug
          ) sub
        )
      )
      FROM search_console_cache
      WHERE workspace_id = p_workspace_id
    ),
    'analytics', (
      SELECT json_build_object(
        'total_entries', COUNT(*),
        'valid_entries', COUNT(*) FILTER (WHERE expires_at > NOW()),
        'expired_entries', COUNT(*) FILTER (WHERE expires_at <= NOW()),
        'by_brand', (
          SELECT json_object_agg(brand_slug, cnt)
          FROM (
            SELECT brand_slug, COUNT(*) as cnt
            FROM analytics_cache
            WHERE workspace_id = p_workspace_id AND expires_at > NOW()
            GROUP BY brand_slug
          ) sub
        )
      )
      FROM analytics_cache
      WHERE workspace_id = p_workspace_id
    ),
    'dataforseo', (
      SELECT json_build_object(
        'total_entries', COUNT(*),
        'valid_entries', COUNT(*) FILTER (WHERE expires_at > NOW()),
        'expired_entries', COUNT(*) FILTER (WHERE expires_at <= NOW()),
        'by_brand', (
          SELECT json_object_agg(brand_slug, cnt)
          FROM (
            SELECT brand_slug, COUNT(*) as cnt
            FROM dataforseo_cache
            WHERE workspace_id = p_workspace_id AND expires_at > NOW()
            GROUP BY brand_slug
          ) sub
        )
      )
      FROM dataforseo_cache
      WHERE workspace_id = p_workspace_id
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================================================
-- 6. AUTOMATIC CLEANUP TRIGGER (Remove expired cache entries)
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Delete expired entries older than 48 hours
  DELETE FROM search_console_cache
  WHERE expires_at < (NOW() - INTERVAL '48 hours');

  DELETE FROM analytics_cache
  WHERE expires_at < (NOW() - INTERVAL '48 hours');

  DELETE FROM dataforseo_cache
  WHERE expires_at < (NOW() - INTERVAL '48 hours');

  RETURN NULL;
END;
$$;

-- Create trigger to run cleanup daily
CREATE OR REPLACE FUNCTION schedule_cache_cleanup()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Note: Actual scheduled job should be configured in Supabase Dashboard
  -- This is a placeholder for documentation purposes
  -- Go to Database → Extensions → Enable pg_cron
  -- Then: SELECT cron.schedule('cleanup-analytics-cache', '0 2 * * *', 'SELECT cleanup_expired_cache()');
  RAISE NOTICE 'Cache cleanup should be scheduled via pg_cron extension';
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE search_console_cache IS 'Cache for Google Search Console and Bing Webmaster Tools data with 24-hour expiry';
COMMENT ON TABLE analytics_cache IS 'Cache for Google Analytics 4 data with 24-hour expiry';
COMMENT ON TABLE dataforseo_cache IS 'Cache for DataForSEO API results with 24-hour expiry';
COMMENT ON FUNCTION get_search_console_cache IS 'Returns valid (non-expired) Search Console cache entries';
COMMENT ON FUNCTION get_analytics_cache IS 'Returns valid (non-expired) Analytics cache entries';
COMMENT ON FUNCTION get_dataforseo_cache IS 'Returns valid (non-expired) DataForSEO cache entries';
COMMENT ON FUNCTION invalidate_analytics_cache IS 'Manually invalidates cache for refresh';
COMMENT ON FUNCTION get_analytics_cache_status IS 'Returns cache status summary as JSON';
