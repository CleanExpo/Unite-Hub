-- =====================================================================================
-- Migration 562: Founder Performance Envelope (F23)
-- =====================================================================================
-- Purpose: Defines operating limits, ideal bands, and overload thresholds
-- Dependencies: F13-F22 (migrations 551-561)
-- Tables: founder_performance_envelope, founder_envelope_bands
-- RPC Functions: calculate_performance_envelope(), list_performance_envelope()
-- =====================================================================================

-- =====================================================================================
-- ENUMS
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE envelope_state_type AS ENUM (
    'optimal',
    'stable',
    'strained',
    'overloaded',
    'critical',
    'recovery'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- TABLES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS founder_performance_envelope (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Envelope state
  envelope_state envelope_state_type NOT NULL,
  load_index NUMERIC NOT NULL CHECK (load_index >= 0 AND load_index <= 100),
  efficiency_index NUMERIC NOT NULL CHECK (efficiency_index >= 0 AND efficiency_index <= 100),

  -- Performance metrics
  capacity_utilization NUMERIC,
  performance_score NUMERIC,
  overhead_ratio NUMERIC,

  -- Envelope factors
  envelope_factors JSONB NOT NULL DEFAULT '{}',
  limiting_factors TEXT[],
  enhancing_factors TEXT[],

  -- Thresholds
  optimal_range_min NUMERIC,
  optimal_range_max NUMERIC,
  overload_threshold NUMERIC,
  recovery_threshold NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_envelope_tenant
  ON founder_performance_envelope(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_performance_envelope_state
  ON founder_performance_envelope(envelope_state, load_index);

-- =====================================================================================
-- RPC FUNCTIONS
-- =====================================================================================

/**
 * Calculate performance envelope
 */
CREATE OR REPLACE FUNCTION calculate_performance_envelope(
  p_tenant_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_envelope_id UUID;
  v_load_index NUMERIC;
  v_efficiency_index NUMERIC;
  v_envelope_state envelope_state_type;
BEGIN
  -- TODO: Implement real calculation based on F13-F22 data
  v_load_index := 50.0 + (RANDOM() * 40);
  v_efficiency_index := 60.0 + (RANDOM() * 30);

  -- Determine state
  IF v_load_index >= 90 THEN
    v_envelope_state := 'critical';
  ELSIF v_load_index >= 75 THEN
    v_envelope_state := 'overloaded';
  ELSIF v_load_index >= 60 THEN
    v_envelope_state := 'strained';
  ELSIF v_load_index >= 40 AND v_efficiency_index >= 70 THEN
    v_envelope_state := 'optimal';
  ELSE
    v_envelope_state := 'stable';
  END IF;

  INSERT INTO founder_performance_envelope (
    tenant_id,
    envelope_state,
    load_index,
    efficiency_index,
    envelope_factors,
    capacity_utilization,
    performance_score,
    optimal_range_min,
    optimal_range_max,
    overload_threshold
  ) VALUES (
    p_tenant_id,
    v_envelope_state,
    v_load_index,
    v_efficiency_index,
    jsonb_build_object('workload', v_load_index, 'efficiency', v_efficiency_index),
    v_load_index * 0.8,
    (v_load_index + v_efficiency_index) / 2,
    40.0,
    70.0,
    85.0
  )
  RETURNING id INTO v_envelope_id;

  RETURN v_envelope_id;
END;
$$;

/**
 * List performance envelopes
 */
CREATE OR REPLACE FUNCTION list_performance_envelope(
  p_tenant_id UUID,
  p_envelope_state envelope_state_type DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  envelope_state envelope_state_type,
  load_index NUMERIC,
  efficiency_index NUMERIC,
  capacity_utilization NUMERIC,
  performance_score NUMERIC,
  overhead_ratio NUMERIC,
  envelope_factors JSONB,
  limiting_factors TEXT[],
  enhancing_factors TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.id,
    pe.envelope_state,
    pe.load_index,
    pe.efficiency_index,
    pe.capacity_utilization,
    pe.performance_score,
    pe.overhead_ratio,
    pe.envelope_factors,
    pe.limiting_factors,
    pe.enhancing_factors,
    pe.created_at
  FROM founder_performance_envelope pe
  WHERE pe.tenant_id = p_tenant_id
    AND (p_envelope_state IS NULL OR pe.envelope_state = p_envelope_state)
    AND (p_start_date IS NULL OR pe.created_at >= p_start_date)
    AND (p_end_date IS NULL OR pe.created_at <= p_end_date)
  ORDER BY pe.created_at DESC
  LIMIT p_limit;
END;
$$;

/**
 * Get performance envelope summary
 */
CREATE OR REPLACE FUNCTION get_performance_envelope_summary(
  p_tenant_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'avg_load_index', COALESCE(AVG(load_index), 0),
    'avg_efficiency_index', COALESCE(AVG(efficiency_index), 0),
    'current_state', (SELECT envelope_state FROM founder_performance_envelope WHERE tenant_id = p_tenant_id ORDER BY created_at DESC LIMIT 1),
    'critical_count', COUNT(*) FILTER (WHERE envelope_state = 'critical'),
    'overloaded_count', COUNT(*) FILTER (WHERE envelope_state = 'overloaded'),
    'optimal_count', COUNT(*) FILTER (WHERE envelope_state = 'optimal'),
    'period_days', p_days
  )
  INTO v_result
  FROM founder_performance_envelope
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN v_result;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE founder_performance_envelope IS 'F23: Performance Envelope - operating limits and optimal ranges';
COMMENT ON FUNCTION calculate_performance_envelope IS 'F23: Calculate current performance envelope';
COMMENT ON FUNCTION list_performance_envelope IS 'F23: List performance envelope history';
COMMENT ON FUNCTION get_performance_envelope_summary IS 'F23: Get performance envelope summary statistics';
