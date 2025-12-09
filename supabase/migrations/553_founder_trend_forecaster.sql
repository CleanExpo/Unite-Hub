-- Phase F15: Founder Trend Forecaster (FTF)
-- Migration: 553
-- Predictive time-series analysis from F09-F14 historical data

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Forecast category classification
DO $$ BEGIN
  CREATE TYPE founder_forecast_category AS ENUM (
    'improving',    -- Upward trend predicted
    'stable',       -- Plateau expected
    'declining',    -- Downward trend predicted
    'critical'      -- Sharp decline predicted
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Forecast window types
DO $$ BEGIN
  CREATE TYPE forecast_window AS ENUM (
    '24h',    -- 24 hour forecast
    '7d',     -- 7 day forecast
    '30d'     -- 30 day forecast
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Main trend forecast table
DROP TABLE IF EXISTS founder_trend_forecast CASCADE;
CREATE TABLE founder_trend_forecast (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  forecast_window forecast_window NOT NULL,
  forecast_category founder_forecast_category NOT NULL DEFAULT 'stable',

  -- Current baseline
  current_score NUMERIC CHECK (current_score >= 0 AND current_score <= 100) NOT NULL,

  -- Predicted values
  predicted_score NUMERIC CHECK (predicted_score >= 0 AND predicted_score <= 100) NOT NULL,
  predicted_change NUMERIC, -- Absolute change from current
  predicted_change_pct NUMERIC, -- Percentage change

  -- Confidence metrics
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100) NOT NULL,
  prediction_method TEXT, -- 'linear_regression', 'moving_average', 'exponential_smoothing'

  -- Historical basis
  data_points_count INTEGER,
  historical_window_days INTEGER,

  -- Trend indicators
  trend_direction TEXT, -- 'up', 'down', 'flat'
  trend_strength NUMERIC CHECK (trend_strength >= 0 AND trend_strength <= 100),
  volatility_factor NUMERIC,

  -- Component forecasts
  unified_state_forecast NUMERIC,
  energy_trend_forecast NUMERIC,
  cognitive_forecast NUMERIC,
  recovery_forecast NUMERIC,

  -- Risk factors
  risk_factors JSONB DEFAULT '[]'::jsonb,

  -- Recommendations
  recommended_actions TEXT[],
  urgency_level TEXT, -- 'low', 'moderate', 'high', 'critical'

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  forecast_generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  forecast_target_date TIMESTAMPTZ NOT NULL
);

-- ============================================================================
-- INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_forecast_tenant;
CREATE INDEX idx_forecast_tenant
  ON founder_trend_forecast (tenant_id, forecast_generated_at DESC);

DROP INDEX IF EXISTS idx_forecast_window;
CREATE INDEX idx_forecast_window
  ON founder_trend_forecast (tenant_id, forecast_window);

DROP INDEX IF EXISTS idx_forecast_target;
CREATE INDEX idx_forecast_target
  ON founder_trend_forecast (tenant_id, forecast_target_date);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE founder_trend_forecast ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_trend_forecast_tenant_isolation ON founder_trend_forecast;
CREATE POLICY founder_trend_forecast_tenant_isolation ON founder_trend_forecast
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- 1. Generate trend forecast using linear regression
DROP FUNCTION IF EXISTS generate_trend_forecast CASCADE;
CREATE OR REPLACE FUNCTION generate_trend_forecast(
  p_tenant_id UUID,
  p_window forecast_window DEFAULT '7d'
)
RETURNS TABLE (
  forecast_category founder_forecast_category,
  current_score NUMERIC,
  predicted_score NUMERIC,
  predicted_change NUMERIC,
  predicted_change_pct NUMERIC,
  confidence_score NUMERIC,
  prediction_method TEXT,
  data_points_count INTEGER,
  historical_window_days INTEGER,
  trend_direction TEXT,
  trend_strength NUMERIC,
  volatility_factor NUMERIC,
  unified_state_forecast NUMERIC,
  energy_trend_forecast NUMERIC,
  cognitive_forecast NUMERIC,
  recovery_forecast NUMERIC,
  risk_factors JSONB,
  recommended_actions TEXT[],
  urgency_level TEXT,
  forecast_target_date TIMESTAMPTZ
) AS $$
DECLARE
  v_current_score NUMERIC;
  v_predicted_score NUMERIC;
  v_data_points INTEGER;
  v_historical_days INTEGER;
  v_confidence NUMERIC;
  v_trend_direction TEXT;
  v_trend_strength NUMERIC;
  v_volatility NUMERIC;
  v_category founder_forecast_category;
  v_risk_factors JSONB DEFAULT '[]'::jsonb;
  v_actions TEXT[];
  v_urgency TEXT;
  v_target_date TIMESTAMPTZ;
  v_slope NUMERIC;
  v_intercept NUMERIC;
  v_change NUMERIC;
  v_change_pct NUMERIC;
  v_unified_forecast NUMERIC;
  v_energy_forecast NUMERIC;
  v_cognitive_forecast NUMERIC;
  v_recovery_forecast NUMERIC;
  v_avg_x NUMERIC;
  v_avg_y NUMERIC;
  v_sum_xy NUMERIC;
  v_sum_xx NUMERIC;
BEGIN
  -- Determine historical window based on forecast window
  v_historical_days := CASE p_window
    WHEN '24h' THEN 7
    WHEN '7d' THEN 30
    WHEN '30d' THEN 90
  END;

  -- Get current score from health index
  SELECT health_score
  INTO v_current_score
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_current_score IS NULL THEN
    v_current_score := 50; -- Default if no data
  END IF;

  -- Calculate linear regression coefficients
  WITH historical_data AS (
    SELECT
      health_score,
      EXTRACT(EPOCH FROM created_at) / 3600 AS hours_since_epoch, -- Convert to hours
      ROW_NUMBER() OVER (ORDER BY created_at) AS seq
    FROM founder_health_index
    WHERE tenant_id = p_tenant_id
      AND created_at >= now() - (v_historical_days || ' days')::INTERVAL
    ORDER BY created_at
  ),
  stats AS (
    SELECT
      COUNT(*) as n,
      AVG(seq) as avg_x,
      AVG(health_score) as avg_y,
      SUM(seq * health_score) as sum_xy,
      SUM(seq * seq) as sum_xx
    FROM historical_data
  )
  SELECT
    n,
    avg_x,
    avg_y,
    sum_xy,
    sum_xx
  INTO v_data_points, v_avg_x, v_avg_y, v_sum_xy, v_sum_xx
  FROM stats;

  -- Calculate slope and intercept for linear regression
  IF v_data_points > 1 AND v_sum_xx - v_data_points * v_avg_x * v_avg_x != 0 THEN
    v_slope := (v_sum_xy - v_data_points * v_avg_x * v_avg_y) /
               (v_sum_xx - v_data_points * v_avg_x * v_avg_x);
    v_intercept := v_avg_y - v_slope * v_avg_x;
  ELSE
    v_slope := 0;
    v_intercept := v_current_score;
  END IF;

  -- Project into future based on window
  DECLARE
    v_future_x NUMERIC;
  BEGIN
    v_future_x := v_data_points + CASE p_window
      WHEN '24h' THEN 1
      WHEN '7d' THEN 7
      WHEN '30d' THEN 30
    END;

    v_predicted_score := v_intercept + v_slope * v_future_x;
    v_predicted_score := GREATEST(0, LEAST(100, v_predicted_score)); -- Clamp to 0-100
  END;

  -- Calculate change metrics
  v_change := v_predicted_score - v_current_score;
  v_change_pct := CASE WHEN v_current_score > 0
                       THEN (v_change / v_current_score) * 100
                       ELSE 0 END;

  -- Calculate volatility
  SELECT COALESCE(STDDEV(health_score), 0)
  INTO v_volatility
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (v_historical_days || ' days')::INTERVAL;

  -- Determine trend direction and strength
  IF ABS(v_slope) < 0.1 THEN
    v_trend_direction := 'flat';
    v_trend_strength := 0;
  ELSIF v_slope > 0 THEN
    v_trend_direction := 'up';
    v_trend_strength := LEAST(100, ABS(v_slope) * 10);
  ELSE
    v_trend_direction := 'down';
    v_trend_strength := LEAST(100, ABS(v_slope) * 10);
  END IF;

  -- Calculate confidence score
  v_confidence := LEAST(100, (v_data_points::NUMERIC / 30) * 100); -- More data = more confidence
  v_confidence := v_confidence * (1 - LEAST(0.5, v_volatility / 100)); -- High volatility reduces confidence

  -- Determine forecast category
  IF v_change >= 10 THEN
    v_category := 'improving';
    v_urgency := 'low';
    v_actions := ARRAY['Maintain positive momentum', 'Document success factors'];
  ELSIF v_change >= -5 THEN
    v_category := 'stable';
    v_urgency := 'low';
    v_actions := ARRAY['Continue current practices', 'Monitor regularly'];
  ELSIF v_change >= -15 THEN
    v_category := 'declining';
    v_urgency := 'high';
    v_actions := ARRAY['Investigate decline causes', 'Implement corrective actions'];
  ELSE
    v_category := 'critical';
    v_urgency := 'critical';
    v_actions := ARRAY['Immediate intervention required', 'Escalate to support'];
  END IF;

  -- Generate component forecasts (simplified projection)
  v_unified_forecast := v_predicted_score * 0.95; -- Slightly pessimistic
  v_energy_forecast := v_predicted_score * 1.02;  -- Slightly optimistic
  v_cognitive_forecast := v_predicted_score * 0.98;
  v_recovery_forecast := v_predicted_score * 1.00;

  -- Identify risk factors
  IF v_volatility > 20 THEN
    v_risk_factors := v_risk_factors || jsonb_build_array(
      jsonb_build_object('risk', 'High score volatility', 'severity', 'moderate')
    );
  END IF;

  IF v_data_points < 10 THEN
    v_risk_factors := v_risk_factors || jsonb_build_array(
      jsonb_build_object('risk', 'Limited historical data', 'severity', 'low')
    );
  END IF;

  IF v_trend_direction = 'down' AND v_trend_strength > 50 THEN
    v_risk_factors := v_risk_factors || jsonb_build_array(
      jsonb_build_object('risk', 'Strong downward trend', 'severity', 'high')
    );
  END IF;

  -- Calculate target date
  v_target_date := now() + CASE p_window
    WHEN '24h' THEN INTERVAL '24 hours'
    WHEN '7d' THEN INTERVAL '7 days'
    WHEN '30d' THEN INTERVAL '30 days'
  END;

  RETURN QUERY SELECT
    v_category,
    v_current_score,
    v_predicted_score,
    v_change,
    v_change_pct,
    v_confidence,
    'linear_regression'::TEXT,
    v_data_points,
    v_historical_days,
    v_trend_direction,
    v_trend_strength,
    v_volatility,
    v_unified_forecast,
    v_energy_forecast,
    v_cognitive_forecast,
    v_recovery_forecast,
    v_risk_factors,
    v_actions,
    v_urgency,
    v_target_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Record trend forecast
DROP FUNCTION IF EXISTS record_trend_forecast CASCADE;
CREATE OR REPLACE FUNCTION record_trend_forecast(
  p_tenant_id UUID,
  p_window forecast_window DEFAULT '7d',
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_forecast RECORD;
  v_id UUID;
BEGIN
  -- Generate forecast
  SELECT * INTO v_forecast FROM generate_trend_forecast(p_tenant_id, p_window);

  -- Insert record
  INSERT INTO founder_trend_forecast (
    tenant_id,
    forecast_window,
    forecast_category,
    current_score,
    predicted_score,
    predicted_change,
    predicted_change_pct,
    confidence_score,
    prediction_method,
    data_points_count,
    historical_window_days,
    trend_direction,
    trend_strength,
    volatility_factor,
    unified_state_forecast,
    energy_trend_forecast,
    cognitive_forecast,
    recovery_forecast,
    risk_factors,
    recommended_actions,
    urgency_level,
    notes,
    metadata,
    forecast_target_date
  ) VALUES (
    p_tenant_id,
    p_window,
    v_forecast.forecast_category,
    v_forecast.current_score,
    v_forecast.predicted_score,
    v_forecast.predicted_change,
    v_forecast.predicted_change_pct,
    v_forecast.confidence_score,
    v_forecast.prediction_method,
    v_forecast.data_points_count,
    v_forecast.historical_window_days,
    v_forecast.trend_direction,
    v_forecast.trend_strength,
    v_forecast.volatility_factor,
    v_forecast.unified_state_forecast,
    v_forecast.energy_trend_forecast,
    v_forecast.cognitive_forecast,
    v_forecast.recovery_forecast,
    v_forecast.risk_factors,
    v_forecast.recommended_actions,
    v_forecast.urgency_level,
    p_notes,
    p_metadata,
    v_forecast.forecast_target_date
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. List trend forecasts
DROP FUNCTION IF EXISTS list_trend_forecasts CASCADE;
CREATE OR REPLACE FUNCTION list_trend_forecasts(
  p_tenant_id UUID,
  p_window forecast_window DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  forecast_window forecast_window,
  forecast_category founder_forecast_category,
  current_score NUMERIC,
  predicted_score NUMERIC,
  predicted_change NUMERIC,
  predicted_change_pct NUMERIC,
  confidence_score NUMERIC,
  prediction_method TEXT,
  data_points_count INTEGER,
  trend_direction TEXT,
  trend_strength NUMERIC,
  volatility_factor NUMERIC,
  risk_factors JSONB,
  recommended_actions TEXT[],
  urgency_level TEXT,
  notes TEXT,
  forecast_generated_at TIMESTAMPTZ,
  forecast_target_date TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ftf.id,
    ftf.forecast_window,
    ftf.forecast_category,
    ftf.current_score,
    ftf.predicted_score,
    ftf.predicted_change,
    ftf.predicted_change_pct,
    ftf.confidence_score,
    ftf.prediction_method,
    ftf.data_points_count,
    ftf.trend_direction,
    ftf.trend_strength,
    ftf.volatility_factor,
    ftf.risk_factors,
    ftf.recommended_actions,
    ftf.urgency_level,
    ftf.notes,
    ftf.forecast_generated_at,
    ftf.forecast_target_date
  FROM founder_trend_forecast ftf
  WHERE ftf.tenant_id = p_tenant_id
    AND (p_window IS NULL OR ftf.forecast_window = p_window)
    AND (p_start_date IS NULL OR ftf.forecast_generated_at >= p_start_date)
    AND (p_end_date IS NULL OR ftf.forecast_generated_at <= p_end_date)
  ORDER BY ftf.forecast_generated_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get forecast summary
DROP FUNCTION IF EXISTS get_forecast_summary CASCADE;
CREATE OR REPLACE FUNCTION get_forecast_summary(
  p_tenant_id UUID
)
RETURNS TABLE (
  forecast_24h JSONB,
  forecast_7d JSONB,
  forecast_30d JSONB,
  overall_trend TEXT,
  confidence_avg NUMERIC
) AS $$
DECLARE
  v_24h JSONB;
  v_7d JSONB;
  v_30d JSONB;
  v_overall TEXT;
  v_confidence NUMERIC;
BEGIN
  -- Get latest 24h forecast
  SELECT jsonb_build_object(
    'category', forecast_category,
    'predicted_score', predicted_score,
    'change', predicted_change,
    'confidence', confidence_score
  )
  INTO v_24h
  FROM founder_trend_forecast
  WHERE tenant_id = p_tenant_id AND forecast_window = '24h'
  ORDER BY forecast_generated_at DESC
  LIMIT 1;

  -- Get latest 7d forecast
  SELECT jsonb_build_object(
    'category', forecast_category,
    'predicted_score', predicted_score,
    'change', predicted_change,
    'confidence', confidence_score
  )
  INTO v_7d
  FROM founder_trend_forecast
  WHERE tenant_id = p_tenant_id AND forecast_window = '7d'
  ORDER BY forecast_generated_at DESC
  LIMIT 1;

  -- Get latest 30d forecast
  SELECT jsonb_build_object(
    'category', forecast_category,
    'predicted_score', predicted_score,
    'change', predicted_change,
    'confidence', confidence_score
  )
  INTO v_30d
  FROM founder_trend_forecast
  WHERE tenant_id = p_tenant_id AND forecast_window = '30d'
  ORDER BY forecast_generated_at DESC
  LIMIT 1;

  -- Determine overall trend
  SELECT trend_direction
  INTO v_overall
  FROM founder_trend_forecast
  WHERE tenant_id = p_tenant_id
  ORDER BY forecast_generated_at DESC
  LIMIT 1;

  -- Average confidence
  SELECT AVG(confidence_score)
  INTO v_confidence
  FROM founder_trend_forecast
  WHERE tenant_id = p_tenant_id
    AND forecast_generated_at >= now() - INTERVAL '7 days';

  RETURN QUERY SELECT
    v_24h,
    v_7d,
    v_30d,
    v_overall,
    v_confidence;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE founder_trend_forecast IS 'F15: Founder Trend Forecaster - predictive time-series analysis';
COMMENT ON FUNCTION generate_trend_forecast IS 'F15: Generate trend forecast using linear regression';
COMMENT ON FUNCTION record_trend_forecast IS 'F15: Record trend forecast snapshot';
COMMENT ON FUNCTION list_trend_forecasts IS 'F15: List trend forecasts with filters';
COMMENT ON FUNCTION get_forecast_summary IS 'F15: Get summary of latest forecasts across all windows';
