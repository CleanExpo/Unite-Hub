-- Phase E41: Predictive Governance Forecaster
-- Migration: 530
-- Purpose: Forecast governance trends using heuristics and AI
-- Tables: governance_forecast, forecast_models
-- Functions: record_forecast, get_latest_forecasts
-- RLS: Tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE forecast_type AS ENUM (
    'compliance_score',
    'risk_score',
    'incident_rate',
    'debt_accumulation',
    'remediation_backlog',
    'system_load',
    'user_satisfaction',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE forecast_horizon AS ENUM ('1_day', '7_days', '30_days', '90_days', '1_year');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE forecast_method AS ENUM ('heuristic', 'linear_regression', 'time_series', 'ml_model', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES (Idempotent - drop if exists)
-- =====================================================

DROP TABLE IF EXISTS forecast_models CASCADE;
DROP TABLE IF EXISTS governance_forecast CASCADE;

-- Governance Forecast
CREATE TABLE governance_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_type forecast_type NOT NULL,
  forecast_horizon forecast_horizon NOT NULL,
  forecast_method forecast_method NOT NULL,
  forecast_value NUMERIC NOT NULL,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  lower_bound NUMERIC,
  upper_bound NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_governance_forecast_tenant ON governance_forecast(tenant_id);
CREATE INDEX idx_governance_forecast_type ON governance_forecast(tenant_id, forecast_type, valid_from DESC);
CREATE INDEX idx_governance_forecast_valid ON governance_forecast(tenant_id, valid_until DESC);

-- Forecast Models (AI model metadata)
CREATE TABLE forecast_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_type TEXT NOT NULL,
  forecast_types forecast_type[] NOT NULL,
  accuracy_score NUMERIC,
  training_data_points INTEGER,
  last_trained_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_forecast_models_tenant ON forecast_models(tenant_id);
CREATE INDEX idx_forecast_models_active ON forecast_models(tenant_id, is_active);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE governance_forecast ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_models ENABLE ROW LEVEL SECURITY;

-- Governance Forecast: Tenant-scoped
DROP POLICY IF EXISTS governance_forecast_tenant_isolation ON governance_forecast;
CREATE POLICY governance_forecast_tenant_isolation ON governance_forecast
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Forecast Models: Tenant-scoped
DROP POLICY IF EXISTS forecast_models_tenant_isolation ON forecast_models;
CREATE POLICY forecast_models_tenant_isolation ON forecast_models
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================
-- 4. TRIGGERS (updated_at)
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_forecast_models ON forecast_models;
CREATE TRIGGER set_updated_at_forecast_models BEFORE UPDATE ON forecast_models
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Record forecast
DO $$
BEGIN
  DROP FUNCTION IF EXISTS record_forecast CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION record_forecast(
  p_tenant_id UUID,
  p_forecast_type forecast_type,
  p_forecast_horizon forecast_horizon,
  p_forecast_method forecast_method,
  p_forecast_value NUMERIC,
  p_confidence NUMERIC DEFAULT NULL,
  p_lower_bound NUMERIC DEFAULT NULL,
  p_upper_bound NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_forecast_id UUID;
  v_valid_until TIMESTAMPTZ;
BEGIN
  -- Calculate valid_until based on horizon
  v_valid_until := CASE p_forecast_horizon
    WHEN '1_day' THEN now() + interval '1 day'
    WHEN '7_days' THEN now() + interval '7 days'
    WHEN '30_days' THEN now() + interval '30 days'
    WHEN '90_days' THEN now() + interval '90 days'
    WHEN '1_year' THEN now() + interval '1 year'
    ELSE now() + interval '7 days'
  END;

  INSERT INTO governance_forecast (
    tenant_id, forecast_type, forecast_horizon, forecast_method,
    forecast_value, confidence, lower_bound, upper_bound, metadata, valid_until
  )
  VALUES (
    p_tenant_id, p_forecast_type, p_forecast_horizon, p_forecast_method,
    p_forecast_value, p_confidence, p_lower_bound, p_upper_bound, p_metadata, v_valid_until
  )
  RETURNING id INTO v_forecast_id;

  RETURN v_forecast_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get latest forecasts
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_latest_forecasts CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_latest_forecasts(
  p_tenant_id UUID,
  p_forecast_type forecast_type DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  forecast_type forecast_type,
  forecast_horizon forecast_horizon,
  forecast_method forecast_method,
  forecast_value NUMERIC,
  confidence NUMERIC,
  lower_bound NUMERIC,
  upper_bound NUMERIC,
  metadata JSONB,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (gf.forecast_type, gf.forecast_horizon)
    gf.id,
    gf.forecast_type,
    gf.forecast_horizon,
    gf.forecast_method,
    gf.forecast_value,
    gf.confidence,
    gf.lower_bound,
    gf.upper_bound,
    gf.metadata,
    gf.valid_from,
    gf.valid_until,
    gf.created_at
  FROM governance_forecast gf
  WHERE gf.tenant_id = p_tenant_id
    AND (p_forecast_type IS NULL OR gf.forecast_type = p_forecast_type)
    AND gf.valid_until > now()
  ORDER BY gf.forecast_type, gf.forecast_horizon, gf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get forecast accuracy
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_forecast_accuracy CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_forecast_accuracy(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_forecasts', COUNT(*),
    'active_forecasts', COUNT(*) FILTER (WHERE gf.valid_until > now()),
    'expired_forecasts', COUNT(*) FILTER (WHERE gf.valid_until <= now()),
    'avg_confidence', AVG(gf.confidence) FILTER (WHERE gf.confidence IS NOT NULL),
    'by_method', jsonb_object_agg(
      gf.forecast_method::text,
      COUNT(*)
    )
  ) INTO v_result
  FROM governance_forecast gf
  WHERE gf.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List all forecasts
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_forecasts CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_forecasts(
  p_tenant_id UUID,
  p_include_expired BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  forecast_type forecast_type,
  forecast_horizon forecast_horizon,
  forecast_value NUMERIC,
  confidence NUMERIC,
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gf.id,
    gf.forecast_type,
    gf.forecast_horizon,
    gf.forecast_value,
    gf.confidence,
    gf.valid_until,
    gf.created_at
  FROM governance_forecast gf
  WHERE gf.tenant_id = p_tenant_id
    AND (p_include_expired = TRUE OR gf.valid_until > now())
  ORDER BY gf.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE governance_forecast IS 'E41: Predictive forecasts for governance metrics';
COMMENT ON TABLE forecast_models IS 'E41: AI model metadata for forecasting';

-- Migration complete
