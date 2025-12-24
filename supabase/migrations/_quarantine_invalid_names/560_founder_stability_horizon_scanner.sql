-- =====================================================================================
-- Migration 560: Founder Stability Horizon Scanner (F21)
-- =====================================================================================
-- Purpose: Predicts future stability risks based on multi-phase leading indicators
-- Dependencies: F13-F20 (migrations 551-559)
-- Tables: founder_stability_horizon, founder_horizon_signals
-- RPC Functions: calculate_stability_horizon(), list_stability_horizon()
-- =====================================================================================

-- =====================================================================================
-- ENUMS
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE horizon_window_type AS ENUM (
    '24h',
    '72h',
    '7d',
    '14d',
    '30d'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE predicted_risk_type AS ENUM (
    'minimal',
    'low',
    'moderate',
    'high',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- TABLES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS founder_stability_horizon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Horizon configuration
  horizon_window horizon_window_type NOT NULL,
  predicted_risk predicted_risk_type NOT NULL,
  risk_score NUMERIC NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),

  -- Leading indicators
  leading_signals JSONB NOT NULL DEFAULT '{}',
  signal_count INT DEFAULT 0,
  positive_indicators INT DEFAULT 0,
  negative_indicators INT DEFAULT 0,

  -- Probability and confidence
  probability NUMERIC CHECK (probability >= 0 AND probability <= 100),
  confidence_level NUMERIC CHECK (confidence_level >= 0 AND confidence_level <= 100),

  -- Risk factors
  risk_factors JSONB,
  protective_factors JSONB,
  intervention_suggestions TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_horizon_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  horizon_id UUID NOT NULL REFERENCES founder_stability_horizon(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  signal_type TEXT NOT NULL,
  signal_strength NUMERIC NOT NULL,
  signal_direction TEXT NOT NULL, -- 'positive', 'negative', 'neutral'
  signal_source TEXT,
  signal_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- INDEXES
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_stability_horizon_tenant_created
  ON founder_stability_horizon(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stability_horizon_window
  ON founder_stability_horizon(horizon_window, predicted_risk);

CREATE INDEX IF NOT EXISTS idx_horizon_signals_horizon
  ON founder_horizon_signals(horizon_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_horizon_signals_tenant
  ON founder_horizon_signals(tenant_id, created_at DESC);

-- =====================================================================================
-- RPC FUNCTIONS
-- =====================================================================================

/**
 * Calculate stability horizon forecast
 */
CREATE OR REPLACE FUNCTION calculate_stability_horizon(
  p_tenant_id UUID,
  p_horizon_window horizon_window_type DEFAULT '7d'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_horizon_id UUID;
  v_risk_score NUMERIC;
  v_predicted_risk predicted_risk_type;
  v_leading_signals JSONB;
BEGIN
  -- TODO: Implement real calculation based on F13-F20 data
  -- Placeholder calculation
  v_risk_score := 45.0 + (RANDOM() * 30);

  -- Determine risk level
  IF v_risk_score >= 80 THEN
    v_predicted_risk := 'critical';
  ELSIF v_risk_score >= 60 THEN
    v_predicted_risk := 'high';
  ELSIF v_risk_score >= 40 THEN
    v_predicted_risk := 'moderate';
  ELSIF v_risk_score >= 20 THEN
    v_predicted_risk := 'low';
  ELSE
    v_predicted_risk := 'minimal';
  END IF;

  v_leading_signals := jsonb_build_object(
    'drift_indicators', 0,
    'resilience_decline', false,
    'workload_spike', false,
    'momentum_loss', false
  );

  INSERT INTO founder_stability_horizon (
    tenant_id,
    horizon_window,
    predicted_risk,
    risk_score,
    leading_signals,
    signal_count,
    positive_indicators,
    negative_indicators,
    probability,
    confidence_level
  ) VALUES (
    p_tenant_id,
    p_horizon_window,
    v_predicted_risk,
    v_risk_score,
    v_leading_signals,
    0,
    0,
    0,
    v_risk_score,
    75.0
  )
  RETURNING id INTO v_horizon_id;

  RETURN v_horizon_id;
END;
$$;

/**
 * List stability horizon forecasts
 */
CREATE OR REPLACE FUNCTION list_stability_horizon(
  p_tenant_id UUID,
  p_horizon_window horizon_window_type DEFAULT NULL,
  p_risk_level predicted_risk_type DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  horizon_window horizon_window_type,
  predicted_risk predicted_risk_type,
  risk_score NUMERIC,
  leading_signals JSONB,
  signal_count INT,
  positive_indicators INT,
  negative_indicators INT,
  probability NUMERIC,
  confidence_level NUMERIC,
  risk_factors JSONB,
  protective_factors JSONB,
  intervention_suggestions TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sh.id,
    sh.horizon_window,
    sh.predicted_risk,
    sh.risk_score,
    sh.leading_signals,
    sh.signal_count,
    sh.positive_indicators,
    sh.negative_indicators,
    sh.probability,
    sh.confidence_level,
    sh.risk_factors,
    sh.protective_factors,
    sh.intervention_suggestions,
    sh.created_at
  FROM founder_stability_horizon sh
  WHERE sh.tenant_id = p_tenant_id
    AND (p_horizon_window IS NULL OR sh.horizon_window = p_horizon_window)
    AND (p_risk_level IS NULL OR sh.predicted_risk = p_risk_level)
    AND (p_start_date IS NULL OR sh.created_at >= p_start_date)
    AND (p_end_date IS NULL OR sh.created_at <= p_end_date)
  ORDER BY sh.created_at DESC
  LIMIT p_limit;
END;
$$;

/**
 * Get stability horizon summary
 */
CREATE OR REPLACE FUNCTION get_stability_horizon_summary(
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
    'avg_risk_score', COALESCE(AVG(risk_score), 0),
    'max_risk_score', COALESCE(MAX(risk_score), 0),
    'critical_count', COUNT(*) FILTER (WHERE predicted_risk = 'critical'),
    'high_count', COUNT(*) FILTER (WHERE predicted_risk = 'high'),
    'by_window', json_object_agg(
      horizon_window,
      COUNT(*)
    ),
    'period_days', p_days
  )
  INTO v_result
  FROM founder_stability_horizon
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN v_result;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE founder_stability_horizon IS 'F21: Stability Horizon Scanner - predicts future stability risks';
COMMENT ON TABLE founder_horizon_signals IS 'F21: Leading signals contributing to stability forecasts';

COMMENT ON FUNCTION calculate_stability_horizon IS 'F21: Calculate stability horizon forecast for given window';
COMMENT ON FUNCTION list_stability_horizon IS 'F21: List stability horizon forecasts with filters';
COMMENT ON FUNCTION get_stability_horizon_summary IS 'F21: Get stability horizon summary statistics';
