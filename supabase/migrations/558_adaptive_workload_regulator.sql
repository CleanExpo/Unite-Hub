-- =====================================================================================
-- Migration 558: Adaptive Workload Regulator (F19)
-- =====================================================================================
-- Purpose: Dynamically adjusts system workload recommendations based on founder state
-- Dependencies: F13-F18 (migrations 551-557)
-- Tables: founder_workload_regulator, founder_workload_adjustments
-- RPC Functions: calculate_workload_recommendation(), list_workload_recommendations()
-- =====================================================================================

-- =====================================================================================
-- ENUMS
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE workload_recommendation_type AS ENUM (
    'increase',
    'maintain',
    'reduce',
    'pause',
    'halt'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- TABLES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS founder_workload_regulator (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Recommendation
  recommended_load workload_recommendation_type NOT NULL,
  load_score NUMERIC NOT NULL CHECK (load_score >= 0 AND load_score <= 100),

  -- Analysis factors
  factors JSONB NOT NULL DEFAULT '{}',
  current_capacity NUMERIC,          -- 0-100 available capacity
  current_utilization NUMERIC,       -- 0-100 current usage
  optimal_load NUMERIC,              -- Recommended load level
  safety_margin NUMERIC,             -- Buffer before overload

  -- Context
  limiting_factors TEXT[],           -- What's constraining capacity
  suggested_actions TEXT[],          -- Concrete recommendations

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_workload_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workload_id UUID NOT NULL REFERENCES founder_workload_regulator(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  adjustment_type TEXT NOT NULL,
  adjustment_description TEXT,
  expected_impact NUMERIC,
  actual_impact NUMERIC,
  success BOOLEAN DEFAULT NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- INDEXES
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_workload_regulator_tenant_created
  ON founder_workload_regulator (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workload_regulator_recommendation
  ON founder_workload_regulator (recommended_load, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_workload_adjustments_workload
  ON founder_workload_adjustments (workload_id);

CREATE INDEX IF NOT EXISTS idx_workload_adjustments_tenant
  ON founder_workload_adjustments (tenant_id, created_at DESC);

-- =====================================================================================
-- ROW LEVEL SECURITY
-- =====================================================================================

ALTER TABLE founder_workload_regulator ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_workload_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workload regulator"
  ON founder_workload_regulator FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own workload regulator"
  ON founder_workload_regulator FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can view own workload adjustments"
  ON founder_workload_adjustments FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own workload adjustments"
  ON founder_workload_adjustments FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================================================
-- RPC FUNCTIONS
-- =====================================================================================

-- Calculate workload recommendation
CREATE OR REPLACE FUNCTION calculate_workload_recommendation(
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_load_score NUMERIC;
  v_recommendation workload_recommendation_type;
  v_capacity NUMERIC;
  v_utilization NUMERIC;
  v_factors JSONB;
  v_workload_id UUID;
BEGIN
  -- Calculate capacity from health/resilience data (placeholder)
  v_capacity := 70.0;      -- TODO: Calculate from F14, F18
  v_utilization := 60.0;   -- TODO: Calculate from F13

  -- Calculate load score
  v_load_score := (v_capacity - v_utilization);

  -- Determine recommendation
  v_recommendation := CASE
    WHEN v_load_score > 30 THEN 'increase'::workload_recommendation_type
    WHEN v_load_score > 10 THEN 'maintain'::workload_recommendation_type
    WHEN v_load_score > -10 THEN 'reduce'::workload_recommendation_type
    WHEN v_load_score > -30 THEN 'pause'::workload_recommendation_type
    ELSE 'halt'::workload_recommendation_type
  END;

  -- Build factors
  v_factors := jsonb_build_object(
    'capacity', v_capacity,
    'utilization', v_utilization,
    'calculated_at', NOW()
  );

  -- Insert workload record
  INSERT INTO founder_workload_regulator (
    tenant_id,
    recommended_load,
    load_score,
    factors,
    current_capacity,
    current_utilization
  ) VALUES (
    p_tenant_id,
    v_recommendation,
    v_load_score,
    v_factors,
    v_capacity,
    v_utilization
  )
  RETURNING id INTO v_workload_id;

  -- Return result
  RETURN jsonb_build_object(
    'workload_id', v_workload_id,
    'recommendation', v_recommendation,
    'load_score', v_load_score,
    'capacity', v_capacity,
    'utilization', v_utilization
  );
END;
$$;

-- List workload recommendations
CREATE OR REPLACE FUNCTION list_workload_recommendations(
  p_tenant_id UUID,
  p_recommendation workload_recommendation_type DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  recommended_load TEXT,
  load_score NUMERIC,
  factors JSONB,
  current_capacity NUMERIC,
  current_utilization NUMERIC,
  optimal_load NUMERIC,
  safety_margin NUMERIC,
  limiting_factors TEXT[],
  suggested_actions TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    wr.id,
    wr.recommended_load::TEXT,
    wr.load_score,
    wr.factors,
    wr.current_capacity,
    wr.current_utilization,
    wr.optimal_load,
    wr.safety_margin,
    wr.limiting_factors,
    wr.suggested_actions,
    wr.created_at
  FROM founder_workload_regulator wr
  WHERE wr.tenant_id = p_tenant_id
    AND (p_recommendation IS NULL OR wr.recommended_load = p_recommendation)
    AND (p_start_date IS NULL OR wr.created_at >= p_start_date)
    AND (p_end_date IS NULL OR wr.created_at <= p_end_date)
  ORDER BY wr.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Get workload summary
CREATE OR REPLACE FUNCTION get_workload_summary(
  p_tenant_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_avg_load NUMERIC;
  v_current_recommendation TEXT;
  v_recommendation_distribution JSONB;
BEGIN
  -- Get average load score
  SELECT COALESCE(AVG(load_score), 0)
  INTO v_avg_load
  FROM founder_workload_regulator
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Get current recommendation
  SELECT recommended_load::TEXT
  INTO v_current_recommendation
  FROM founder_workload_regulator
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get recommendation distribution
  SELECT jsonb_object_agg(recommended_load::TEXT, count)
  INTO v_recommendation_distribution
  FROM (
    SELECT recommended_load, COUNT(*) as count
    FROM founder_workload_regulator
    WHERE tenant_id = p_tenant_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY recommended_load
  ) sub;

  v_result := jsonb_build_object(
    'avg_load_score', ROUND(v_avg_load, 2),
    'current_recommendation', COALESCE(v_current_recommendation, 'unknown'),
    'recommendation_distribution', COALESCE(v_recommendation_distribution, '{}'::JSONB),
    'period_days', p_days
  );

  RETURN v_result;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE founder_workload_regulator IS 'F19: Dynamically adjusts workload recommendations based on founder state';
COMMENT ON TABLE founder_workload_adjustments IS 'F19: Records workload adjustments and their impacts';
COMMENT ON FUNCTION calculate_workload_recommendation IS 'F19: Calculates recommended workload based on capacity and utilization';
COMMENT ON FUNCTION list_workload_recommendations IS 'F19: Lists workload recommendations with optional filters';
COMMENT ON FUNCTION get_workload_summary IS 'F19: Returns summary statistics for workload over specified period';
