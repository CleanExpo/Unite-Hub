-- Phase E48: Autonomous Self-Evaluation Loop v1
-- Migration: 537
-- Description: Stores periodic self-assessments of system posture across multiple dimensions.

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS self_evaluation_factors CASCADE;
DROP TABLE IF EXISTS self_evaluation_cycles CASCADE;

DO $$ BEGIN
  CREATE TYPE evaluation_status AS ENUM ('running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE evaluation_factor_type AS ENUM (
    'stability',
    'risk',
    'coherence',
    'performance',
    'security',
    'compliance',
    'quality',
    'efficiency',
    'reliability',
    'scalability',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Self-Evaluation Cycles (evaluation runs)
CREATE TABLE self_evaluation_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_code TEXT NOT NULL,
  status evaluation_status NOT NULL DEFAULT 'running',
  score NUMERIC CHECK (score >= 0 AND score <= 100),
  summary TEXT,
  recommendations TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, cycle_code)
);

-- Self-Evaluation Factors (factor scores per cycle)
CREATE TABLE self_evaluation_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_code TEXT NOT NULL,
  factor evaluation_factor_type NOT NULL,
  value NUMERIC CHECK (value >= 0 AND value <= 100),
  weight NUMERIC DEFAULT 1.0,
  details TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE self_evaluation_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_evaluation_factors ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY self_evaluation_cycles_tenant_policy ON self_evaluation_cycles
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY self_evaluation_factors_tenant_policy ON self_evaluation_factors
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_self_evaluation_cycles_tenant ON self_evaluation_cycles (tenant_id, created_at DESC);
CREATE INDEX idx_self_evaluation_cycles_status ON self_evaluation_cycles (tenant_id, status, created_at DESC);
CREATE INDEX idx_self_evaluation_factors_tenant_cycle ON self_evaluation_factors (tenant_id, cycle_code, created_at DESC);
CREATE INDEX idx_self_evaluation_factors_factor ON self_evaluation_factors (tenant_id, factor, created_at DESC);

-- Functions
DROP FUNCTION IF EXISTS start_evaluation_cycle CASCADE;
CREATE OR REPLACE FUNCTION start_evaluation_cycle(
  p_tenant_id UUID,
  p_cycle_code TEXT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_cycle_id UUID;
BEGIN
  INSERT INTO self_evaluation_cycles (tenant_id, cycle_code, metadata)
  VALUES (p_tenant_id, p_cycle_code, p_metadata)
  ON CONFLICT (tenant_id, cycle_code) DO UPDATE
  SET status = 'running',
      started_at = now(),
      completed_at = NULL,
      updated_at = now()
  RETURNING id INTO v_cycle_id;

  RETURN v_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS record_evaluation_factor CASCADE;
CREATE OR REPLACE FUNCTION record_evaluation_factor(
  p_tenant_id UUID,
  p_cycle_code TEXT,
  p_factor evaluation_factor_type,
  p_value NUMERIC,
  p_weight NUMERIC DEFAULT 1.0,
  p_details TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_factor_id UUID;
BEGIN
  INSERT INTO self_evaluation_factors (tenant_id, cycle_code, factor, value, weight, details, metadata)
  VALUES (p_tenant_id, p_cycle_code, p_factor, p_value, p_weight, p_details, p_metadata)
  RETURNING id INTO v_factor_id;

  RETURN v_factor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS complete_evaluation_cycle CASCADE;
CREATE OR REPLACE FUNCTION complete_evaluation_cycle(
  p_cycle_id UUID,
  p_summary TEXT DEFAULT NULL,
  p_recommendations TEXT[] DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_cycle_code TEXT;
  v_tenant_id UUID;
  v_weighted_score NUMERIC;
BEGIN
  -- Get cycle info
  SELECT cycle_code, tenant_id INTO v_cycle_code, v_tenant_id
  FROM self_evaluation_cycles
  WHERE id = p_cycle_id;

  -- Calculate weighted score from factors
  SELECT
    CASE
      WHEN SUM(sef.weight) > 0 THEN SUM(sef.value * sef.weight) / SUM(sef.weight)
      ELSE 0
    END
  INTO v_weighted_score
  FROM self_evaluation_factors sef
  WHERE sef.tenant_id = v_tenant_id
    AND sef.cycle_code = v_cycle_code;

  -- Update cycle
  UPDATE self_evaluation_cycles
  SET
    status = 'completed',
    score = v_weighted_score,
    summary = p_summary,
    recommendations = p_recommendations,
    completed_at = now(),
    updated_at = now()
  WHERE id = p_cycle_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_evaluation_cycles CASCADE;
CREATE OR REPLACE FUNCTION list_evaluation_cycles(
  p_tenant_id UUID,
  p_status evaluation_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS SETOF self_evaluation_cycles AS $$
BEGIN
  RETURN QUERY
  SELECT sec.*
  FROM self_evaluation_cycles sec
  WHERE sec.tenant_id = p_tenant_id
    AND (p_status IS NULL OR sec.status = p_status)
  ORDER BY sec.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_evaluation_factors CASCADE;
CREATE OR REPLACE FUNCTION list_evaluation_factors(
  p_tenant_id UUID,
  p_cycle_code TEXT
)
RETURNS SETOF self_evaluation_factors AS $$
BEGIN
  RETURN QUERY
  SELECT sef.*
  FROM self_evaluation_factors sef
  WHERE sef.tenant_id = p_tenant_id
    AND sef.cycle_code = p_cycle_code
  ORDER BY sef.weight DESC, sef.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_evaluation_summary CASCADE;
CREATE OR REPLACE FUNCTION get_evaluation_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_cycles', COUNT(*),
    'completed_cycles', COUNT(*) FILTER (WHERE sec.status = 'completed'),
    'latest_score', (SELECT sec2.score FROM self_evaluation_cycles sec2 WHERE sec2.tenant_id = p_tenant_id AND sec2.status = 'completed' ORDER BY sec2.completed_at DESC LIMIT 1),
    'avg_score', AVG(sec.score) FILTER (WHERE sec.score IS NOT NULL)
  ) INTO v_result
  FROM self_evaluation_cycles sec
  WHERE sec.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
