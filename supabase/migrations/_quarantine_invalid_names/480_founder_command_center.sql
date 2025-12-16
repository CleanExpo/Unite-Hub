-- =====================================================================
-- Phase D52: Founder Command Center & Cross-Business Insights
-- =====================================================================
-- Tables: founder_panels, founder_panel_widgets, founder_kpi_snapshots
--
-- Purpose:
-- - Customizable founder dashboards with widgets
-- - KPI snapshots across all businesses
-- - AI-powered cross-business insights and recommendations
--
-- Key Concepts:
-- - Panels are custom dashboard layouts per founder
-- - Widgets populate panels with specific data visualizations
-- - KPI snapshots capture metrics from all businesses at intervals
-- - No RLS - founder-scoped by founder_user_id
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08

-- =====================================================================
-- 1. Founder Panels Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS founder_panels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_user_id uuid NOT NULL,

  -- Panel identification
  slug text NOT NULL,
  name text NOT NULL,
  description text,

  -- Panel configuration
  layout jsonb, -- { "grid": { "cols": 3, "rows": 2 }, "widgets": [...] }
  default_panel boolean NOT NULL DEFAULT false,
  filters jsonb, -- { "businesses": ["uuid1", "uuid2"], "dateRange": "30d" }

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. Founder Panel Widgets Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS founder_panel_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  panel_id uuid NOT NULL REFERENCES founder_panels(id) ON DELETE CASCADE,

  -- Widget configuration
  widget_type text NOT NULL, -- 'kpi_card' | 'chart' | 'table' | 'alert_list' | 'trend_graph'
  title text,
  config jsonb, -- { "metric": "mrr", "visualization": "line", "aggregation": "sum" }
  position jsonb, -- { "x": 0, "y": 0, "w": 2, "h": 1 }

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 3. Founder KPI Snapshots Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS founder_kpi_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_user_id uuid NOT NULL,

  -- Snapshot metadata
  captured_at timestamptz NOT NULL DEFAULT now(),
  scope text NOT NULL, -- 'all_businesses' | 'business' | 'campaign' | 'channel'
  source text NOT NULL, -- Which business/entity this snapshot is from

  -- Metrics data
  metrics jsonb NOT NULL, -- { "mrr": 50000, "churn_rate": 5.2, "active_campaigns": 12, ... }
  ai_summary jsonb, -- { "insights": [...], "alerts": [...], "recommendations": [...] }
  metadata jsonb -- Additional context
);

-- =====================================================================
-- 4. Indexes
-- =====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_founder_panels_user_slug
  ON founder_panels(founder_user_id, slug);

CREATE INDEX IF NOT EXISTS idx_founder_panels_user
  ON founder_panels(founder_user_id);

CREATE INDEX IF NOT EXISTS idx_founder_panel_widgets_panel
  ON founder_panel_widgets(panel_id);

CREATE INDEX IF NOT EXISTS idx_founder_kpi_snapshots_user
  ON founder_kpi_snapshots(founder_user_id);

CREATE INDEX IF NOT EXISTS idx_founder_kpi_snapshots_captured
  ON founder_kpi_snapshots(founder_user_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_founder_kpi_snapshots_scope
  ON founder_kpi_snapshots(founder_user_id, scope, source);

-- =====================================================================
-- 5. No RLS - Founder tables are global per founder_user_id
-- =====================================================================
-- These tables do not use RLS as they are scoped by founder_user_id
-- All queries must filter by founder_user_id in application logic

-- =====================================================================
-- 6. Helper Functions
-- =====================================================================

/**
 * Get latest KPI snapshot for a scope/source
 */
CREATE OR REPLACE FUNCTION founder_get_latest_kpi_snapshot(
  p_founder_user_id uuid,
  p_scope text,
  p_source text
) RETURNS jsonb AS $$
DECLARE
  v_snapshot jsonb;
BEGIN
  SELECT jsonb_build_object(
    'metrics', metrics,
    'ai_summary', ai_summary,
    'captured_at', captured_at
  )
  INTO v_snapshot
  FROM founder_kpi_snapshots
  WHERE founder_user_id = p_founder_user_id
    AND scope = p_scope
    AND source = p_source
  ORDER BY captured_at DESC
  LIMIT 1;

  RETURN COALESCE(v_snapshot, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get KPI trend for a metric across time
 */
CREATE OR REPLACE FUNCTION founder_get_kpi_trend(
  p_founder_user_id uuid,
  p_scope text,
  p_source text,
  p_metric_key text,
  p_days integer DEFAULT 30
) RETURNS TABLE(
  captured_at timestamptz,
  value numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.captured_at,
    (s.metrics->>p_metric_key)::numeric AS value
  FROM founder_kpi_snapshots s
  WHERE s.founder_user_id = p_founder_user_id
    AND s.scope = p_scope
    AND s.source = p_source
    AND s.captured_at >= NOW() - (p_days || ' days')::interval
    AND s.metrics ? p_metric_key
  ORDER BY s.captured_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get cross-business metrics summary
 */
CREATE OR REPLACE FUNCTION founder_get_cross_business_summary(
  p_founder_user_id uuid
) RETURNS TABLE(
  total_businesses bigint,
  total_mrr numeric,
  total_active_campaigns bigint,
  avg_health_score numeric,
  critical_alerts bigint
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_snapshots AS (
    SELECT DISTINCT ON (source)
      source,
      metrics,
      ai_summary,
      captured_at
    FROM founder_kpi_snapshots
    WHERE founder_user_id = p_founder_user_id
      AND scope = 'business'
    ORDER BY source, captured_at DESC
  )
  SELECT
    COUNT(DISTINCT source)::bigint AS total_businesses,
    SUM((metrics->>'mrr')::numeric)::numeric AS total_mrr,
    SUM((metrics->>'active_campaigns')::numeric)::bigint AS total_active_campaigns,
    AVG((metrics->>'health_score')::numeric)::numeric AS avg_health_score,
    SUM(jsonb_array_length(COALESCE(ai_summary->'alerts', '[]'::jsonb)))::bigint AS critical_alerts
  FROM latest_snapshots;
END;
$$ LANGUAGE plpgsql STABLE;
