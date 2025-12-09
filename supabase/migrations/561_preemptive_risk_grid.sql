-- =====================================================================================
-- Migration 561: Pre-Emptive Risk Grid (F22)
-- =====================================================================================
-- Purpose: Identifies structural, behavioural, and temporal risks before they escalate
-- Dependencies: F13-F21 (migrations 551-560)
-- Tables: founder_preemptive_risk_grid, founder_risk_factors
-- RPC Functions: calculate_preemptive_risk(), list_preemptive_risk()
-- =====================================================================================

-- =====================================================================================
-- ENUMS
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE risk_domain_type AS ENUM (
    'cognitive',
    'emotional',
    'operational',
    'strategic',
    'social',
    'financial',
    'health'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE risk_level_type AS ENUM (
    'minimal',
    'low',
    'moderate',
    'high',
    'critical',
    'severe'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- TABLES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS founder_preemptive_risk_grid (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Risk classification
  risk_domain risk_domain_type NOT NULL,
  risk_level risk_level_type NOT NULL,
  risk_score NUMERIC NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),

  -- Risk factors
  factors JSONB NOT NULL DEFAULT '{}',
  contributing_signals JSONB,
  risk_indicators TEXT[],

  -- Impact assessment
  potential_impact TEXT,
  escalation_probability NUMERIC CHECK (escalation_probability >= 0 AND escalation_probability <= 100),
  time_to_escalation TEXT, -- '24h', '72h', '7d', '14d', '30d'

  -- Mitigation
  mitigation_strategies TEXT[],
  preventive_actions TEXT[],
  monitoring_triggers TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES founder_preemptive_risk_grid(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  factor_type TEXT NOT NULL,
  factor_severity NUMERIC NOT NULL,
  factor_description TEXT,
  factor_data JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================================
-- INDEXES
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_preemptive_risk_tenant_created
  ON founder_preemptive_risk_grid(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_preemptive_risk_domain_level
  ON founder_preemptive_risk_grid(risk_domain, risk_level);

CREATE INDEX IF NOT EXISTS idx_risk_factors_risk
  ON founder_risk_factors(risk_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_factors_tenant
  ON founder_risk_factors(tenant_id, created_at DESC);

-- =====================================================================================
-- RPC FUNCTIONS
-- =====================================================================================

/**
 * Calculate preemptive risk assessment
 */
CREATE OR REPLACE FUNCTION calculate_preemptive_risk(
  p_tenant_id UUID,
  p_risk_domain risk_domain_type DEFAULT 'operational'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_risk_id UUID;
  v_risk_score NUMERIC;
  v_risk_level risk_level_type;
  v_factors JSONB;
BEGIN
  -- TODO: Implement real calculation based on F13-F21 data
  -- Placeholder calculation
  v_risk_score := 40.0 + (RANDOM() * 40);

  -- Determine risk level
  IF v_risk_score >= 85 THEN
    v_risk_level := 'severe';
  ELSIF v_risk_score >= 75 THEN
    v_risk_level := 'critical';
  ELSIF v_risk_score >= 60 THEN
    v_risk_level := 'high';
  ELSIF v_risk_score >= 40 THEN
    v_risk_level := 'moderate';
  ELSIF v_risk_score >= 20 THEN
    v_risk_level := 'low';
  ELSE
    v_risk_level := 'minimal';
  END IF;

  v_factors := jsonb_build_object(
    'stress_level', 0,
    'workload_pressure', 0,
    'drift_magnitude', 0,
    'resilience_deficit', 0
  );

  INSERT INTO founder_preemptive_risk_grid (
    tenant_id,
    risk_domain,
    risk_level,
    risk_score,
    factors,
    escalation_probability,
    time_to_escalation
  ) VALUES (
    p_tenant_id,
    p_risk_domain,
    v_risk_level,
    v_risk_score,
    v_factors,
    v_risk_score * 0.8,
    '7d'
  )
  RETURNING id INTO v_risk_id;

  RETURN v_risk_id;
END;
$$;

/**
 * List preemptive risk grid entries
 */
CREATE OR REPLACE FUNCTION list_preemptive_risk(
  p_tenant_id UUID,
  p_risk_domain risk_domain_type DEFAULT NULL,
  p_risk_level risk_level_type DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  risk_domain risk_domain_type,
  risk_level risk_level_type,
  risk_score NUMERIC,
  factors JSONB,
  contributing_signals JSONB,
  risk_indicators TEXT[],
  potential_impact TEXT,
  escalation_probability NUMERIC,
  time_to_escalation TEXT,
  mitigation_strategies TEXT[],
  preventive_actions TEXT[],
  monitoring_triggers TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    prg.id,
    prg.risk_domain,
    prg.risk_level,
    prg.risk_score,
    prg.factors,
    prg.contributing_signals,
    prg.risk_indicators,
    prg.potential_impact,
    prg.escalation_probability,
    prg.time_to_escalation,
    prg.mitigation_strategies,
    prg.preventive_actions,
    prg.monitoring_triggers,
    prg.created_at
  FROM founder_preemptive_risk_grid prg
  WHERE prg.tenant_id = p_tenant_id
    AND (p_risk_domain IS NULL OR prg.risk_domain = p_risk_domain)
    AND (p_risk_level IS NULL OR prg.risk_level = p_risk_level)
    AND (p_start_date IS NULL OR prg.created_at >= p_start_date)
    AND (p_end_date IS NULL OR prg.created_at <= p_end_date)
  ORDER BY prg.created_at DESC
  LIMIT p_limit;
END;
$$;

/**
 * Get preemptive risk summary
 */
CREATE OR REPLACE FUNCTION get_preemptive_risk_summary(
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
    'severe_count', COUNT(*) FILTER (WHERE risk_level = 'severe'),
    'critical_count', COUNT(*) FILTER (WHERE risk_level = 'critical'),
    'high_count', COUNT(*) FILTER (WHERE risk_level = 'high'),
    'by_domain', json_object_agg(
      risk_domain,
      COUNT(*)
    ),
    'period_days', p_days
  )
  INTO v_result
  FROM founder_preemptive_risk_grid
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  RETURN v_result;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE founder_preemptive_risk_grid IS 'F22: Pre-Emptive Risk Grid - identifies risks before escalation';
COMMENT ON TABLE founder_risk_factors IS 'F22: Risk factors contributing to preemptive risk assessments';

COMMENT ON FUNCTION calculate_preemptive_risk IS 'F22: Calculate preemptive risk for given domain';
COMMENT ON FUNCTION list_preemptive_risk IS 'F22: List preemptive risk entries with filters';
COMMENT ON FUNCTION get_preemptive_risk_summary IS 'F22: Get preemptive risk summary statistics';
