-- =====================================================================================
-- Migration 556: Founder Systemic Drift Detector (F17)
-- =====================================================================================
-- Purpose: Detects deviations between founder intent and execution reality
-- Dependencies: F13-F16 (migrations 551-554)
-- Tables: founder_systemic_drift, founder_drift_corrections
-- RPC Functions: calculate_systemic_drift(), record_drift_correction()
-- =====================================================================================

-- =====================================================================================
-- ENUMS
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE founder_drift_category AS ENUM (
    'alignment_loss',
    'focus_split',
    'execution_gap',
    'external_pressure',
    'resource_constraint',
    'priority_conflict'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE founder_drift_severity AS ENUM (
    'minimal',
    'moderate',
    'significant',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- TABLES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS founder_systemic_drift (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Drift metrics
  drift_score NUMERIC NOT NULL CHECK (drift_score >= 0 AND drift_score <= 100),
  drift_category founder_drift_category NOT NULL,
  drift_severity founder_drift_severity NOT NULL,

  -- Analysis
  contributing_factors JSONB NOT NULL DEFAULT '{}',
  intent_vector JSONB,              -- Intended direction
  execution_vector JSONB,            -- Actual execution
  alignment_angle NUMERIC,           -- Degrees between vectors (0-180)

  -- Context
  affected_domains TEXT[],           -- Which business domains affected
  root_causes TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_drift_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drift_id UUID NOT NULL REFERENCES founder_systemic_drift(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Correction details
  correction_type TEXT NOT NULL,     -- 'realignment', 'resource_shift', 'priority_reset'
  action_taken TEXT NOT NULL,
  impact_score NUMERIC,              -- Expected reduction in drift

  -- Results
  success BOOLEAN DEFAULT NULL,      -- Null until evaluated
  actual_impact NUMERIC,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- INDEXES
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_systemic_drift_tenant_created
  ON founder_systemic_drift (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_systemic_drift_category
  ON founder_systemic_drift (drift_category, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_systemic_drift_severity
  ON founder_systemic_drift (drift_severity, drift_score DESC);

CREATE INDEX IF NOT EXISTS idx_drift_corrections_drift
  ON founder_drift_corrections (drift_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_drift_corrections_tenant
  ON founder_drift_corrections (tenant_id, created_at DESC);

-- =====================================================================================
-- ROW LEVEL SECURITY
-- =====================================================================================

ALTER TABLE founder_systemic_drift ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_drift_corrections ENABLE ROW LEVEL SECURITY;

-- Systemic Drift policies
CREATE POLICY "Users can view own systemic drift"
  ON founder_systemic_drift FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own systemic drift"
  ON founder_systemic_drift FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update own systemic drift"
  ON founder_systemic_drift FOR UPDATE
  USING (tenant_id = auth.uid());

-- Drift Corrections policies
CREATE POLICY "Users can view own drift corrections"
  ON founder_drift_corrections FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own drift corrections"
  ON founder_drift_corrections FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================================================
-- RPC FUNCTIONS
-- =====================================================================================

-- Calculate systemic drift
CREATE OR REPLACE FUNCTION calculate_systemic_drift(
  p_tenant_id UUID,
  p_intent_vector JSONB DEFAULT NULL,
  p_execution_vector JSONB DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_drift_score NUMERIC;
  v_category founder_drift_category;
  v_severity founder_drift_severity;
  v_alignment_angle NUMERIC;
  v_factors JSONB;
  v_drift_id UUID;
BEGIN
  -- Calculate drift score (placeholder - implement real calculation)
  v_drift_score := 50.0;  -- TODO: Implement based on F13-F16 data

  -- Determine category based on dominant factor
  v_category := 'alignment_loss';  -- TODO: Implement classification

  -- Determine severity
  v_severity := CASE
    WHEN v_drift_score >= 75 THEN 'critical'::founder_drift_severity
    WHEN v_drift_score >= 50 THEN 'significant'::founder_drift_severity
    WHEN v_drift_score >= 25 THEN 'moderate'::founder_drift_severity
    ELSE 'minimal'::founder_drift_severity
  END;

  -- Calculate alignment angle if vectors provided
  v_alignment_angle := NULL;  -- TODO: Implement vector math

  -- Build contributing factors
  v_factors := jsonb_build_object(
    'calculated_at', NOW(),
    'data_sources', ARRAY['unified_state', 'health_index', 'stability_guard']
  );

  -- Insert drift record
  INSERT INTO founder_systemic_drift (
    tenant_id,
    drift_score,
    drift_category,
    drift_severity,
    contributing_factors,
    intent_vector,
    execution_vector,
    alignment_angle
  ) VALUES (
    p_tenant_id,
    v_drift_score,
    v_category,
    v_severity,
    v_factors,
    p_intent_vector,
    p_execution_vector,
    v_alignment_angle
  )
  RETURNING id INTO v_drift_id;

  -- Return result
  RETURN jsonb_build_object(
    'drift_id', v_drift_id,
    'drift_score', v_drift_score,
    'category', v_category,
    'severity', v_severity,
    'alignment_angle', v_alignment_angle
  );
END;
$$;

-- Record drift correction
CREATE OR REPLACE FUNCTION record_drift_correction(
  p_drift_id UUID,
  p_tenant_id UUID,
  p_correction_type TEXT,
  p_action_taken TEXT,
  p_impact_score NUMERIC DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_correction_id UUID;
BEGIN
  INSERT INTO founder_drift_corrections (
    drift_id,
    tenant_id,
    correction_type,
    action_taken,
    impact_score
  ) VALUES (
    p_drift_id,
    p_tenant_id,
    p_correction_type,
    p_action_taken,
    p_impact_score
  )
  RETURNING id INTO v_correction_id;

  RETURN v_correction_id;
END;
$$;

-- List systemic drift with filters
CREATE OR REPLACE FUNCTION list_systemic_drift(
  p_tenant_id UUID,
  p_category founder_drift_category DEFAULT NULL,
  p_severity founder_drift_severity DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  drift_score NUMERIC,
  drift_category TEXT,
  drift_severity TEXT,
  contributing_factors JSONB,
  intent_vector JSONB,
  execution_vector JSONB,
  alignment_angle NUMERIC,
  affected_domains TEXT[],
  root_causes TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sd.id,
    sd.drift_score,
    sd.drift_category::TEXT,
    sd.drift_severity::TEXT,
    sd.contributing_factors,
    sd.intent_vector,
    sd.execution_vector,
    sd.alignment_angle,
    sd.affected_domains,
    sd.root_causes,
    sd.created_at
  FROM founder_systemic_drift sd
  WHERE sd.tenant_id = p_tenant_id
    AND (p_category IS NULL OR sd.drift_category = p_category)
    AND (p_severity IS NULL OR sd.drift_severity = p_severity)
    AND (p_start_date IS NULL OR sd.created_at >= p_start_date)
    AND (p_end_date IS NULL OR sd.created_at <= p_end_date)
  ORDER BY sd.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Get drift summary
CREATE OR REPLACE FUNCTION get_systemic_drift_summary(
  p_tenant_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_avg_drift NUMERIC;
  v_max_drift NUMERIC;
  v_critical_count INT;
  v_by_category JSONB;
BEGIN
  -- Get aggregate metrics
  SELECT
    COALESCE(AVG(drift_score), 0),
    COALESCE(MAX(drift_score), 0),
    COUNT(*) FILTER (WHERE drift_severity = 'critical')
  INTO v_avg_drift, v_max_drift, v_critical_count
  FROM founder_systemic_drift
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Get breakdown by category
  SELECT jsonb_object_agg(drift_category::TEXT, count)
  INTO v_by_category
  FROM (
    SELECT drift_category, COUNT(*) as count
    FROM founder_systemic_drift
    WHERE tenant_id = p_tenant_id
      AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY drift_category
  ) sub;

  -- Build result
  v_result := jsonb_build_object(
    'avg_drift_score', ROUND(v_avg_drift, 2),
    'max_drift_score', v_max_drift,
    'critical_count', v_critical_count,
    'by_category', COALESCE(v_by_category, '{}'::JSONB),
    'period_days', p_days
  );

  RETURN v_result;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE founder_systemic_drift IS 'F17: Tracks deviations between founder intent and execution reality';
COMMENT ON TABLE founder_drift_corrections IS 'F17: Records corrective actions taken to address drift';
COMMENT ON FUNCTION calculate_systemic_drift IS 'F17: Calculates current systemic drift score and categorization';
COMMENT ON FUNCTION record_drift_correction IS 'F17: Records a corrective action for identified drift';
COMMENT ON FUNCTION list_systemic_drift IS 'F17: Lists systemic drift records with optional filters';
COMMENT ON FUNCTION get_systemic_drift_summary IS 'F17: Returns summary statistics for drift over specified period';
