-- =====================================================
-- Migration: 546_founder_performance_telemetry.sql
-- Phase: F08 - Founder Performance Telemetry
-- Description: Composite performance metrics aggregated from F01-F07 signals
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE telemetry_metric_code AS ENUM (
    'focus_score',
    'distraction_resistance',
    'time_block_adherence',
    'ops_efficiency',
    'load_balance',
    'priority_accuracy',
    'task_completion_rate',
    'energy_management',
    'overall_performance'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE telemetry_trend AS ENUM (
    'improving',
    'stable',
    'declining',
    'volatile'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Performance Metrics
DROP TABLE IF EXISTS founder_performance_metrics CASCADE;
CREATE TABLE founder_performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_code telemetry_metric_code NOT NULL,
  value NUMERIC CHECK (value >= 0 AND value <= 100),
  trend telemetry_trend,
  change_pct NUMERIC,
  rationale TEXT,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
  signals_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_founder_performance_tenant ON founder_performance_metrics(tenant_id, created_at DESC);
CREATE INDEX idx_founder_performance_metric ON founder_performance_metrics(tenant_id, metric_code, created_at DESC);
CREATE INDEX idx_founder_performance_value ON founder_performance_metrics(tenant_id, value DESC);
CREATE INDEX idx_founder_performance_trend ON founder_performance_metrics(tenant_id, trend);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE founder_performance_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_performance_metrics_tenant_isolation ON founder_performance_metrics;
CREATE POLICY founder_performance_metrics_tenant_isolation ON founder_performance_metrics
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record performance metric
DROP FUNCTION IF EXISTS record_performance_metric CASCADE;
CREATE OR REPLACE FUNCTION record_performance_metric(
  p_tenant_id UUID,
  p_metric_code telemetry_metric_code,
  p_value NUMERIC,
  p_trend telemetry_trend DEFAULT NULL,
  p_rationale TEXT DEFAULT NULL,
  p_confidence NUMERIC DEFAULT NULL,
  p_signals_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_period_start TIMESTAMPTZ DEFAULT NULL,
  p_period_end TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
  v_prev_value NUMERIC;
  v_change_pct NUMERIC;
  v_trend telemetry_trend;
BEGIN
  -- Get previous value for trend calculation
  SELECT value INTO v_prev_value
  FROM founder_performance_metrics
  WHERE tenant_id = p_tenant_id
    AND metric_code = p_metric_code
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate change percentage
  IF v_prev_value IS NOT NULL AND v_prev_value != 0 THEN
    v_change_pct := ((p_value - v_prev_value) / v_prev_value) * 100;
  ELSE
    v_change_pct := NULL;
  END IF;

  -- Auto-detect trend if not provided
  IF p_trend IS NULL AND v_change_pct IS NOT NULL THEN
    IF ABS(v_change_pct) < 2 THEN
      v_trend := 'stable';
    ELSIF v_change_pct > 10 THEN
      v_trend := 'improving';
    ELSIF v_change_pct < -10 THEN
      v_trend := 'declining';
    ELSE
      v_trend := 'volatile';
    END IF;
  ELSE
    v_trend := p_trend;
  END IF;

  INSERT INTO founder_performance_metrics (
    tenant_id,
    metric_code,
    value,
    trend,
    change_pct,
    rationale,
    confidence,
    signals_used,
    period_start,
    period_end,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_metric_code,
    p_value,
    v_trend,
    v_change_pct,
    p_rationale,
    p_confidence,
    p_signals_used,
    p_period_start,
    p_period_end,
    p_metadata
  )
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List performance metrics
DROP FUNCTION IF EXISTS list_performance_metrics CASCADE;
CREATE OR REPLACE FUNCTION list_performance_metrics(
  p_tenant_id UUID,
  p_metric_code telemetry_metric_code DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF founder_performance_metrics AS $$
BEGIN
  RETURN QUERY
  SELECT fpm.*
  FROM founder_performance_metrics fpm
  WHERE fpm.tenant_id = p_tenant_id
    AND (p_metric_code IS NULL OR fpm.metric_code = p_metric_code)
  ORDER BY fpm.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get performance summary
DROP FUNCTION IF EXISTS get_performance_summary CASCADE;
CREATE OR REPLACE FUNCTION get_performance_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_days || ' days')::interval;

  SELECT jsonb_build_object(
    'total_metrics', COUNT(DISTINCT metric_code),
    'total_readings', COUNT(*),
    'avg_confidence', ROUND(AVG(confidence), 2),
    'improving_metrics', COUNT(*) FILTER (WHERE trend = 'improving'),
    'declining_metrics', COUNT(*) FILTER (WHERE trend = 'declining'),
    'stable_metrics', COUNT(*) FILTER (WHERE trend = 'stable'),
    'latest_by_metric', (
      SELECT jsonb_object_agg(
        fpm_latest.metric_code,
        jsonb_build_object(
          'value', fpm_latest.value,
          'trend', fpm_latest.trend,
          'change_pct', fpm_latest.change_pct,
          'confidence', fpm_latest.confidence,
          'created_at', fpm_latest.created_at
        )
      )
      FROM (
        SELECT DISTINCT ON (fpm2.metric_code)
          fpm2.metric_code,
          fpm2.value,
          fpm2.trend,
          fpm2.change_pct,
          fpm2.confidence,
          fpm2.created_at
        FROM founder_performance_metrics fpm2
        WHERE fpm2.tenant_id = p_tenant_id
          AND fpm2.created_at >= v_since
        ORDER BY fpm2.metric_code, fpm2.created_at DESC
      ) fpm_latest
    ),
    'overall_performance', (
      SELECT ROUND(AVG(value), 2)
      FROM (
        SELECT DISTINCT ON (metric_code) value
        FROM founder_performance_metrics
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        ORDER BY metric_code, created_at DESC
      ) latest_values
    )
  ) INTO v_summary
  FROM founder_performance_metrics
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get metric history
DROP FUNCTION IF EXISTS get_metric_history CASCADE;
CREATE OR REPLACE FUNCTION get_metric_history(
  p_tenant_id UUID,
  p_metric_code telemetry_metric_code,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_days || ' days')::interval;

  SELECT jsonb_build_object(
    'metric_code', p_metric_code,
    'data_points', COUNT(*),
    'avg_value', ROUND(AVG(value), 2),
    'min_value', MIN(value),
    'max_value', MAX(value),
    'latest_value', (
      SELECT value
      FROM founder_performance_metrics
      WHERE tenant_id = p_tenant_id
        AND metric_code = p_metric_code
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'latest_trend', (
      SELECT trend
      FROM founder_performance_metrics
      WHERE tenant_id = p_tenant_id
        AND metric_code = p_metric_code
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'history', (
      SELECT json_agg(
        json_build_object(
          'value', value,
          'trend', trend,
          'change_pct', change_pct,
          'created_at', created_at
        )
        ORDER BY created_at DESC
      )
      FROM founder_performance_metrics
      WHERE tenant_id = p_tenant_id
        AND metric_code = p_metric_code
        AND created_at >= v_since
    )
  ) INTO v_result
  FROM founder_performance_metrics
  WHERE tenant_id = p_tenant_id
    AND metric_code = p_metric_code
    AND created_at >= v_since;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE founder_performance_metrics IS 'F08: Composite performance metrics from F01-F07 signals';
COMMENT ON FUNCTION record_performance_metric IS 'F08: Record performance metric with auto-trend detection';
COMMENT ON FUNCTION list_performance_metrics IS 'F08: List performance metrics with filters';
COMMENT ON FUNCTION get_performance_summary IS 'F08: Get aggregated performance summary';
COMMENT ON FUNCTION get_metric_history IS 'F08: Get historical data for specific metric';
