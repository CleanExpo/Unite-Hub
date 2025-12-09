-- =====================================================================================
-- Migration 557: Founder Resilience Engine (F18)
-- =====================================================================================
-- Purpose: Measures founder resilience in presence of stressors, drift, and instability
-- Dependencies: F13-F17 (migrations 551-556)
-- Tables: founder_resilience_metrics, founder_resilience_factors
-- RPC Functions: calculate_resilience_score(), list_resilience_metrics()
-- =====================================================================================

-- =====================================================================================
-- ENUMS
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE founder_resilience_level AS ENUM (
    'exceptional',
    'strong',
    'adequate',
    'vulnerable',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- TABLES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS founder_resilience_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Resilience scores
  resilience_score NUMERIC NOT NULL CHECK (resilience_score >= 0 AND resilience_score <= 100),
  resilience_level founder_resilience_level NOT NULL,

  -- Component scores
  pressure_factors JSONB NOT NULL DEFAULT '{}',      -- Negative factors
  stabilising_factors JSONB NOT NULL DEFAULT '{}',  -- Positive factors
  net_resilience NUMERIC NOT NULL,                   -- stabilisers - pressures

  -- Analysis
  pressure_score NUMERIC,        -- 0-100 (higher = more pressure)
  stability_score NUMERIC,       -- 0-100 (higher = more stable)
  recovery_capacity NUMERIC,     -- Ability to bounce back
  adaptation_speed NUMERIC,      -- How quickly founder adapts

  -- Context
  stressor_types TEXT[],         -- Types of stressors present
  coping_mechanisms TEXT[],      -- Active coping strategies

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_resilience_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resilience_id UUID NOT NULL REFERENCES founder_resilience_metrics(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  factor_type TEXT NOT NULL,     -- 'pressure' or 'stabiliser'
  factor_name TEXT NOT NULL,
  factor_score NUMERIC NOT NULL,
  impact_weight NUMERIC DEFAULT 1.0,
  description TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- INDEXES
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_resilience_metrics_tenant_created
  ON founder_resilience_metrics (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resilience_metrics_level
  ON founder_resilience_metrics (resilience_level, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resilience_metrics_score
  ON founder_resilience_metrics (resilience_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_resilience_factors_resilience
  ON founder_resilience_factors (resilience_id);

CREATE INDEX IF NOT EXISTS idx_resilience_factors_tenant
  ON founder_resilience_factors (tenant_id, created_at DESC);

-- =====================================================================================
-- ROW LEVEL SECURITY
-- =====================================================================================

ALTER TABLE founder_resilience_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_resilience_factors ENABLE ROW LEVEL SECURITY;

-- Resilience Metrics policies
CREATE POLICY "Users can view own resilience metrics"
  ON founder_resilience_metrics FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own resilience metrics"
  ON founder_resilience_metrics FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Resilience Factors policies
CREATE POLICY "Users can view own resilience factors"
  ON founder_resilience_factors FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own resilience factors"
  ON founder_resilience_factors FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================================================
-- RPC FUNCTIONS
-- =====================================================================================

-- Calculate resilience score
CREATE OR REPLACE FUNCTION calculate_resilience_score(
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_resilience_score NUMERIC;
  v_resilience_level founder_resilience_level;
  v_pressure_score NUMERIC;
  v_stability_score NUMERIC;
  v_net_resilience NUMERIC;
  v_pressure_factors JSONB;
  v_stabilising_factors JSONB;
  v_resilience_id UUID;
BEGIN
  -- Calculate component scores (placeholder - implement real calculation)
  v_pressure_score := 40.0;     -- TODO: Calculate from F13-F17 data
  v_stability_score := 70.0;    -- TODO: Calculate from stability guard

  -- Calculate net resilience
  v_net_resilience := v_stability_score - v_pressure_score;

  -- Calculate overall resilience score
  v_resilience_score := GREATEST(0, LEAST(100, 50 + v_net_resilience));

  -- Determine resilience level
  v_resilience_level := CASE
    WHEN v_resilience_score >= 90 THEN 'exceptional'::founder_resilience_level
    WHEN v_resilience_score >= 70 THEN 'strong'::founder_resilience_level
    WHEN v_resilience_score >= 50 THEN 'adequate'::founder_resilience_level
    WHEN v_resilience_score >= 30 THEN 'vulnerable'::founder_resilience_level
    ELSE 'critical'::founder_resilience_level
  END;

  -- Build factor JSONs
  v_pressure_factors := jsonb_build_object(
    'cognitive_load', v_pressure_score,
    'data_sources', ARRAY['unified_state', 'drift_detector']
  );

  v_stabilising_factors := jsonb_build_object(
    'recovery_capacity', v_stability_score,
    'data_sources', ARRAY['stability_guard', 'health_index']
  );

  -- Insert resilience record
  INSERT INTO founder_resilience_metrics (
    tenant_id,
    resilience_score,
    resilience_level,
    pressure_factors,
    stabilising_factors,
    net_resilience,
    pressure_score,
    stability_score
  ) VALUES (
    p_tenant_id,
    v_resilience_score,
    v_resilience_level,
    v_pressure_factors,
    v_stabilising_factors,
    v_net_resilience,
    v_pressure_score,
    v_stability_score
  )
  RETURNING id INTO v_resilience_id;

  -- Return result
  RETURN jsonb_build_object(
    'resilience_id', v_resilience_id,
    'resilience_score', v_resilience_score,
    'resilience_level', v_resilience_level,
    'net_resilience', v_net_resilience,
    'pressure_score', v_pressure_score,
    'stability_score', v_stability_score
  );
END;
$$;

-- List resilience metrics
CREATE OR REPLACE FUNCTION list_resilience_metrics(
  p_tenant_id UUID,
  p_level founder_resilience_level DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  resilience_score NUMERIC,
  resilience_level TEXT,
  pressure_factors JSONB,
  stabilising_factors JSONB,
  net_resilience NUMERIC,
  pressure_score NUMERIC,
  stability_score NUMERIC,
  recovery_capacity NUMERIC,
  adaptation_speed NUMERIC,
  stressor_types TEXT[],
  coping_mechanisms TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rm.id,
    rm.resilience_score,
    rm.resilience_level::TEXT,
    rm.pressure_factors,
    rm.stabilising_factors,
    rm.net_resilience,
    rm.pressure_score,
    rm.stability_score,
    rm.recovery_capacity,
    rm.adaptation_speed,
    rm.stressor_types,
    rm.coping_mechanisms,
    rm.created_at
  FROM founder_resilience_metrics rm
  WHERE rm.tenant_id = p_tenant_id
    AND (p_level IS NULL OR rm.resilience_level = p_level)
    AND (p_start_date IS NULL OR rm.created_at >= p_start_date)
    AND (p_end_date IS NULL OR rm.created_at <= p_end_date)
  ORDER BY rm.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Get resilience summary
CREATE OR REPLACE FUNCTION get_resilience_summary(
  p_tenant_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_avg_resilience NUMERIC;
  v_min_resilience NUMERIC;
  v_max_resilience NUMERIC;
  v_current_level TEXT;
  v_vulnerable_count INT;
BEGIN
  -- Get aggregate metrics
  SELECT
    COALESCE(AVG(resilience_score), 0),
    COALESCE(MIN(resilience_score), 0),
    COALESCE(MAX(resilience_score), 0),
    COUNT(*) FILTER (WHERE resilience_level IN ('vulnerable', 'critical'))
  INTO v_avg_resilience, v_min_resilience, v_max_resilience, v_vulnerable_count
  FROM founder_resilience_metrics
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Get current level
  SELECT resilience_level::TEXT
  INTO v_current_level
  FROM founder_resilience_metrics
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Build result
  v_result := jsonb_build_object(
    'avg_resilience', ROUND(v_avg_resilience, 2),
    'min_resilience', v_min_resilience,
    'max_resilience', v_max_resilience,
    'current_level', COALESCE(v_current_level, 'unknown'),
    'vulnerable_count', v_vulnerable_count,
    'period_days', p_days
  );

  RETURN v_result;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE founder_resilience_metrics IS 'F18: Measures founder resilience in presence of stressors';
COMMENT ON TABLE founder_resilience_factors IS 'F18: Individual factors contributing to resilience score';
COMMENT ON FUNCTION calculate_resilience_score IS 'F18: Calculates current resilience score from pressure and stability factors';
COMMENT ON FUNCTION list_resilience_metrics IS 'F18: Lists resilience metrics with optional filters';
COMMENT ON FUNCTION get_resilience_summary IS 'F18: Returns summary statistics for resilience over specified period';
