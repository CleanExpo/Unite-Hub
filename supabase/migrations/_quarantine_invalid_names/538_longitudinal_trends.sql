-- Phase E49: Longitudinal Founder Trend Engine
-- Migration: 538
-- Description: Tracks time-series metrics derived from governance, AI oversight, coherence, and self-evaluation.

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS founder_trend_metrics CASCADE;

DO $$ BEGIN
  CREATE TYPE trend_window AS ENUM ('hourly', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE trend_direction AS ENUM ('improving', 'stable', 'declining', 'volatile', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Founder Trend Metrics (time-series data points)
CREATE TABLE founder_trend_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_code TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  time_window trend_window NOT NULL DEFAULT 'daily',
  direction trend_direction DEFAULT 'unknown',
  change_pct NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE founder_trend_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY founder_trend_metrics_tenant_policy ON founder_trend_metrics
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_founder_trend_metrics_tenant_metric ON founder_trend_metrics (tenant_id, metric_code, recorded_at DESC);
CREATE INDEX idx_founder_trend_metrics_window ON founder_trend_metrics (tenant_id, time_window, recorded_at DESC);
CREATE INDEX idx_founder_trend_metrics_direction ON founder_trend_metrics (tenant_id, direction, recorded_at DESC);

-- Functions
DROP FUNCTION IF EXISTS record_trend_metric CASCADE;
CREATE OR REPLACE FUNCTION record_trend_metric(
  p_tenant_id UUID,
  p_metric_code TEXT,
  p_metric_name TEXT,
  p_value NUMERIC,
  p_time_window trend_window DEFAULT 'daily',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_metric_id UUID;
  v_prev_value NUMERIC;
  v_change_pct NUMERIC;
  v_direction trend_direction;
BEGIN
  -- Get previous value
  SELECT ftm.value INTO v_prev_value
  FROM founder_trend_metrics ftm
  WHERE ftm.tenant_id = p_tenant_id
    AND ftm.metric_code = p_metric_code
    AND ftm.time_window = p_time_window
  ORDER BY ftm.recorded_at DESC
  LIMIT 1;

  -- Calculate change %
  IF v_prev_value IS NOT NULL AND v_prev_value != 0 THEN
    v_change_pct := ((p_value - v_prev_value) / v_prev_value) * 100;

    -- Determine direction
    IF ABS(v_change_pct) < 1 THEN
      v_direction := 'stable';
    ELSIF v_change_pct > 0 THEN
      v_direction := 'improving';
    ELSE
      v_direction := 'declining';
    END IF;
  ELSE
    v_change_pct := NULL;
    v_direction := 'unknown';
  END IF;

  INSERT INTO founder_trend_metrics (tenant_id, metric_code, metric_name, value, time_window, direction, change_pct, metadata)
  VALUES (p_tenant_id, p_metric_code, p_metric_name, p_value, p_time_window, v_direction, v_change_pct, p_metadata)
  RETURNING id INTO v_metric_id;

  RETURN v_metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_trend_metrics CASCADE;
CREATE OR REPLACE FUNCTION list_trend_metrics(
  p_tenant_id UUID,
  p_metric_code TEXT DEFAULT NULL,
  p_time_window trend_window DEFAULT NULL,
  p_limit INTEGER DEFAULT 500
)
RETURNS SETOF founder_trend_metrics AS $$
BEGIN
  RETURN QUERY
  SELECT ftm.*
  FROM founder_trend_metrics ftm
  WHERE ftm.tenant_id = p_tenant_id
    AND (p_metric_code IS NULL OR ftm.metric_code = p_metric_code)
    AND (p_time_window IS NULL OR ftm.time_window = p_time_window)
  ORDER BY ftm.recorded_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_trend_summary CASCADE;
CREATE OR REPLACE FUNCTION get_trend_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_days || ' days')::interval;

  SELECT jsonb_build_object(
    'total_metrics', COUNT(DISTINCT ftm.metric_code),
    'total_data_points', COUNT(*),
    'improving_trends', COUNT(*) FILTER (WHERE ftm.direction = 'improving'),
    'declining_trends', COUNT(*) FILTER (WHERE ftm.direction = 'declining'),
    'stable_trends', COUNT(*) FILTER (WHERE ftm.direction = 'stable'),
    'by_metric', (
      SELECT jsonb_object_agg(ftm_metric.metric_code, ftm_metric.latest_value)
      FROM (
        SELECT DISTINCT ON (ftm2.metric_code) ftm2.metric_code, ftm2.value as latest_value
        FROM founder_trend_metrics ftm2
        WHERE ftm2.tenant_id = p_tenant_id
          AND ftm2.recorded_at >= v_since
        ORDER BY ftm2.metric_code, ftm2.recorded_at DESC
      ) ftm_metric
    )
  ) INTO v_result
  FROM founder_trend_metrics ftm
  WHERE ftm.tenant_id = p_tenant_id
    AND ftm.recorded_at >= v_since;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_metric_trend CASCADE;
CREATE OR REPLACE FUNCTION get_metric_trend(
  p_tenant_id UUID,
  p_metric_code TEXT,
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
    'latest_value', (SELECT ftm2.value FROM founder_trend_metrics ftm2 WHERE ftm2.tenant_id = p_tenant_id AND ftm2.metric_code = p_metric_code ORDER BY ftm2.recorded_at DESC LIMIT 1),
    'avg_value', AVG(ftm.value),
    'min_value', MIN(ftm.value),
    'max_value', MAX(ftm.value),
    'trend_direction', (SELECT ftm3.direction FROM founder_trend_metrics ftm3 WHERE ftm3.tenant_id = p_tenant_id AND ftm3.metric_code = p_metric_code ORDER BY ftm3.recorded_at DESC LIMIT 1)
  ) INTO v_result
  FROM founder_trend_metrics ftm
  WHERE ftm.tenant_id = p_tenant_id
    AND ftm.metric_code = p_metric_code
    AND ftm.recorded_at >= v_since;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
