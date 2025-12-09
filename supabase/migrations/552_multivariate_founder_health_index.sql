-- Phase F14: Multivariate Founder Health Index (MFHI)
-- Migration: 552
-- Longitudinal health scoring from F09-F13 weighted signals

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Health category classification
DO $$ BEGIN
  CREATE TYPE founder_health_category AS ENUM (
    'optimal',      -- Sustained high performance (score >= 85)
    'stable',       -- Normal operations (score 60-84)
    'declining',    -- Downward trend (score 40-59)
    'critical'      -- Immediate intervention needed (score < 40)
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Main health index table
DROP TABLE IF EXISTS founder_health_index CASCADE;
CREATE TABLE founder_health_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  health_category founder_health_category NOT NULL DEFAULT 'stable',
  health_score NUMERIC CHECK (health_score >= 0 AND health_score <= 100) NOT NULL,

  -- Component scores from F09-F13
  unified_state_score NUMERIC CHECK (unified_state_score >= 0 AND unified_state_score <= 100),
  energy_trend_score NUMERIC CHECK (energy_trend_score >= 0 AND energy_trend_score <= 100),
  cognitive_stability_score NUMERIC CHECK (cognitive_stability_score >= 0 AND cognitive_stability_score <= 100),
  recovery_effectiveness_score NUMERIC CHECK (recovery_effectiveness_score >= 0 AND recovery_effectiveness_score <= 100),

  -- Contributing factors
  contributing_factors JSONB DEFAULT '{}'::jsonb,

  -- Health indicators
  days_in_current_category INTEGER DEFAULT 0,
  consecutive_decline_days INTEGER DEFAULT 0,
  peak_score_30d NUMERIC,
  lowest_score_30d NUMERIC,
  volatility_score NUMERIC, -- Standard deviation of scores

  -- Recommendations
  recommended_interventions TEXT[],
  urgency_level TEXT, -- 'low', 'moderate', 'high', 'critical'

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_health_index_tenant;
CREATE INDEX idx_health_index_tenant
  ON founder_health_index (tenant_id, created_at DESC);

DROP INDEX IF EXISTS idx_health_index_category;
CREATE INDEX idx_health_index_category
  ON founder_health_index (tenant_id, health_category);

DROP INDEX IF EXISTS idx_health_index_score;
CREATE INDEX idx_health_index_score
  ON founder_health_index (tenant_id, health_score DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE founder_health_index ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_health_index_tenant_isolation ON founder_health_index;
CREATE POLICY founder_health_index_tenant_isolation ON founder_health_index
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- 1. Calculate current health index from F09-F13 data
DROP FUNCTION IF EXISTS calculate_health_index CASCADE;
CREATE OR REPLACE FUNCTION calculate_health_index(
  p_tenant_id UUID
)
RETURNS TABLE (
  health_score NUMERIC,
  health_category founder_health_category,
  unified_state_score NUMERIC,
  energy_trend_score NUMERIC,
  cognitive_stability_score NUMERIC,
  recovery_effectiveness_score NUMERIC,
  contributing_factors JSONB,
  recommended_interventions TEXT[],
  urgency_level TEXT,
  days_in_current_category INTEGER,
  consecutive_decline_days INTEGER,
  volatility_score NUMERIC
) AS $$
DECLARE
  v_unified_score NUMERIC DEFAULT 50;
  v_energy_trend NUMERIC DEFAULT 50;
  v_cognitive_stability NUMERIC DEFAULT 50;
  v_recovery_effectiveness NUMERIC DEFAULT 50;
  v_health_score NUMERIC;
  v_category founder_health_category;
  v_factors JSONB DEFAULT '{}'::jsonb;
  v_interventions TEXT[];
  v_urgency TEXT;
  v_days_in_category INTEGER DEFAULT 0;
  v_consecutive_decline INTEGER DEFAULT 0;
  v_volatility NUMERIC;
  v_prev_category founder_health_category;
  v_prev_score NUMERIC;
BEGIN
  -- Get unified state score (F13)
  SELECT COALESCE(composite_score, 50)
  INTO v_unified_score
  FROM founder_unified_state
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Calculate energy trend (7-day rolling average from F10)
  SELECT COALESCE(AVG(energy_level), 50)
  INTO v_energy_trend
  FROM founder_energy_readings
  WHERE tenant_id = p_tenant_id
    AND recorded_at >= now() - INTERVAL '7 days';

  -- Calculate cognitive stability (inverse of load variance from F09)
  WITH load_stats AS (
    SELECT
      AVG(signal_value) as avg_load,
      STDDEV(signal_value) as stddev_load
    FROM founder_cognitive_load
    WHERE tenant_id = p_tenant_id
      AND recorded_at >= now() - INTERVAL '7 days'
  )
  SELECT
    CASE
      WHEN stddev_load IS NULL OR stddev_load = 0 THEN 50
      ELSE GREATEST(0, 100 - (stddev_load * 2))
    END
  INTO v_cognitive_stability
  FROM load_stats;

  -- Calculate recovery effectiveness (F12 action completion rate)
  WITH recovery_stats AS (
    SELECT
      COUNT(*) as total_actions,
      COUNT(*) FILTER (WHERE action_taken_at IS NOT NULL) as completed_actions
    FROM founder_recovery_actions
    WHERE tenant_id = p_tenant_id
      AND recommended_at >= now() - INTERVAL '7 days'
  )
  SELECT
    CASE
      WHEN total_actions = 0 THEN 50
      ELSE (completed_actions::NUMERIC / total_actions) * 100
    END
  INTO v_recovery_effectiveness
  FROM recovery_stats;

  -- Calculate weighted health score
  -- Weights: 40% unified state, 30% energy trend, 20% cognitive stability, 10% recovery effectiveness
  v_health_score := (
    (v_unified_score * 0.4) +
    (v_energy_trend * 0.3) +
    (v_cognitive_stability * 0.2) +
    (v_recovery_effectiveness * 0.1)
  );

  -- Calculate volatility (standard deviation of health scores over 30 days)
  SELECT COALESCE(STDDEV(health_score), 0)
  INTO v_volatility
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - INTERVAL '30 days';

  -- Determine health category
  IF v_health_score >= 85 THEN
    v_category := 'optimal';
    v_urgency := 'low';
    v_interventions := ARRAY['Maintain current practices', 'Document success patterns'];
  ELSIF v_health_score >= 60 THEN
    v_category := 'stable';
    v_urgency := 'low';
    v_interventions := ARRAY['Continue monitoring', 'Regular health check-ins'];
  ELSIF v_health_score >= 40 THEN
    v_category := 'declining';
    v_urgency := 'high';
    v_interventions := ARRAY['Review workload', 'Increase recovery time', 'Seek support'];
  ELSE
    v_category := 'critical';
    v_urgency := 'critical';
    v_interventions := ARRAY['Immediate intervention required', 'Stop non-essential work', 'Professional consultation'];
  END IF;

  -- Calculate days in current category
  SELECT health_category, health_score
  INTO v_prev_category, v_prev_score
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_prev_category = v_category THEN
    SELECT COALESCE(MAX(days_in_current_category), 0) + 1
    INTO v_days_in_category
    FROM founder_health_index
    WHERE tenant_id = p_tenant_id
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    v_days_in_category := 1;
  END IF;

  -- Calculate consecutive decline days
  IF v_prev_score IS NOT NULL AND v_health_score < v_prev_score THEN
    SELECT COALESCE(MAX(consecutive_decline_days), 0) + 1
    INTO v_consecutive_decline
    FROM founder_health_index
    WHERE tenant_id = p_tenant_id
    ORDER BY created_at DESC
    LIMIT 1;
  ELSE
    v_consecutive_decline := 0;
  END IF;

  -- Build contributing factors
  v_factors := jsonb_build_object(
    'unified_state_score', v_unified_score,
    'energy_trend_score', v_energy_trend,
    'cognitive_stability_score', v_cognitive_stability,
    'recovery_effectiveness_score', v_recovery_effectiveness,
    'volatility_score', v_volatility,
    'weights', jsonb_build_object(
      'unified_state', 0.4,
      'energy_trend', 0.3,
      'cognitive_stability', 0.2,
      'recovery_effectiveness', 0.1
    )
  );

  -- Adjust urgency for high volatility
  IF v_volatility > 20 THEN
    v_interventions := v_interventions || ARRAY['Address high score volatility'];
    IF v_urgency = 'low' THEN
      v_urgency := 'moderate';
    END IF;
  END IF;

  -- Adjust urgency for consecutive decline
  IF v_consecutive_decline >= 3 THEN
    v_interventions := v_interventions || ARRAY['Investigate sustained decline'];
    IF v_urgency IN ('low', 'moderate') THEN
      v_urgency := 'high';
    END IF;
  END IF;

  RETURN QUERY SELECT
    v_health_score,
    v_category,
    v_unified_score,
    v_energy_trend,
    v_cognitive_stability,
    v_recovery_effectiveness,
    v_factors,
    v_interventions,
    v_urgency,
    v_days_in_category,
    v_consecutive_decline,
    v_volatility;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Record health index snapshot
DROP FUNCTION IF EXISTS record_health_index CASCADE;
CREATE OR REPLACE FUNCTION record_health_index(
  p_tenant_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_health RECORD;
  v_id UUID;
  v_peak_30d NUMERIC;
  v_lowest_30d NUMERIC;
BEGIN
  -- Calculate current health index
  SELECT * INTO v_health FROM calculate_health_index(p_tenant_id);

  -- Get 30-day peak and lowest
  SELECT
    MAX(health_score),
    MIN(health_score)
  INTO v_peak_30d, v_lowest_30d
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - INTERVAL '30 days';

  -- Insert snapshot
  INSERT INTO founder_health_index (
    tenant_id,
    health_category,
    health_score,
    unified_state_score,
    energy_trend_score,
    cognitive_stability_score,
    recovery_effectiveness_score,
    contributing_factors,
    recommended_interventions,
    urgency_level,
    days_in_current_category,
    consecutive_decline_days,
    volatility_score,
    peak_score_30d,
    lowest_score_30d,
    notes,
    metadata
  ) VALUES (
    p_tenant_id,
    v_health.health_category,
    v_health.health_score,
    v_health.unified_state_score,
    v_health.energy_trend_score,
    v_health.cognitive_stability_score,
    v_health.recovery_effectiveness_score,
    v_health.contributing_factors,
    v_health.recommended_interventions,
    v_health.urgency_level,
    v_health.days_in_current_category,
    v_health.consecutive_decline_days,
    v_health.volatility_score,
    GREATEST(v_peak_30d, v_health.health_score),
    LEAST(v_lowest_30d, v_health.health_score),
    p_notes,
    p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. List health index snapshots
DROP FUNCTION IF EXISTS list_health_index CASCADE;
CREATE OR REPLACE FUNCTION list_health_index(
  p_tenant_id UUID,
  p_category founder_health_category DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  health_category founder_health_category,
  health_score NUMERIC,
  unified_state_score NUMERIC,
  energy_trend_score NUMERIC,
  cognitive_stability_score NUMERIC,
  recovery_effectiveness_score NUMERIC,
  contributing_factors JSONB,
  recommended_interventions TEXT[],
  urgency_level TEXT,
  days_in_current_category INTEGER,
  consecutive_decline_days INTEGER,
  volatility_score NUMERIC,
  peak_score_30d NUMERIC,
  lowest_score_30d NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    hi.id,
    hi.health_category,
    hi.health_score,
    hi.unified_state_score,
    hi.energy_trend_score,
    hi.cognitive_stability_score,
    hi.recovery_effectiveness_score,
    hi.contributing_factors,
    hi.recommended_interventions,
    hi.urgency_level,
    hi.days_in_current_category,
    hi.consecutive_decline_days,
    hi.volatility_score,
    hi.peak_score_30d,
    hi.lowest_score_30d,
    hi.notes,
    hi.created_at
  FROM founder_health_index hi
  WHERE hi.tenant_id = p_tenant_id
    AND (p_category IS NULL OR hi.health_category = p_category)
    AND (p_start_date IS NULL OR hi.created_at >= p_start_date)
    AND (p_end_date IS NULL OR hi.created_at <= p_end_date)
  ORDER BY hi.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get health index summary
DROP FUNCTION IF EXISTS get_health_summary CASCADE;
CREATE OR REPLACE FUNCTION get_health_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_snapshots INTEGER,
  current_category founder_health_category,
  current_score NUMERIC,
  avg_health_score NUMERIC,
  max_score NUMERIC,
  min_score NUMERIC,
  avg_volatility NUMERIC,
  by_category JSONB,
  score_trend TEXT, -- 'improving', 'stable', 'declining'
  critical_days INTEGER,
  longest_decline_streak INTEGER
) AS $$
DECLARE
  v_total INTEGER;
  v_current_category founder_health_category;
  v_current_score NUMERIC;
  v_avg_score NUMERIC;
  v_max_score NUMERIC;
  v_min_score NUMERIC;
  v_avg_volatility NUMERIC;
  v_by_category JSONB;
  v_trend TEXT;
  v_critical_days INTEGER;
  v_longest_decline INTEGER;
  v_recent_avg NUMERIC;
  v_older_avg NUMERIC;
BEGIN
  -- Get totals
  SELECT COUNT(*)
  INTO v_total
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL;

  -- Get current state
  SELECT health_category, health_score
  INTO v_current_category, v_current_score
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get aggregates
  SELECT
    ROUND(AVG(health_score), 2),
    MAX(health_score),
    MIN(health_score),
    ROUND(AVG(volatility_score), 2)
  INTO v_avg_score, v_max_score, v_min_score, v_avg_volatility
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL;

  -- By category
  SELECT jsonb_object_agg(health_category::TEXT, count)
  INTO v_by_category
  FROM (
    SELECT health_category, COUNT(*)::INTEGER as count
    FROM founder_health_index
    WHERE tenant_id = p_tenant_id
      AND created_at >= now() - (p_days || ' days')::INTERVAL
    GROUP BY health_category
  ) counts;

  -- Calculate trend
  SELECT AVG(health_score)
  INTO v_recent_avg
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days / 2 || ' days')::INTERVAL;

  SELECT AVG(health_score)
  INTO v_older_avg
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL
    AND created_at < now() - (p_days / 2 || ' days')::INTERVAL;

  IF v_recent_avg > v_older_avg + 5 THEN
    v_trend := 'improving';
  ELSIF v_recent_avg < v_older_avg - 5 THEN
    v_trend := 'declining';
  ELSE
    v_trend := 'stable';
  END IF;

  -- Critical days count
  SELECT COUNT(*)::INTEGER
  INTO v_critical_days
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL
    AND (health_category = 'critical' OR urgency_level = 'critical');

  -- Longest decline streak
  SELECT MAX(consecutive_decline_days)::INTEGER
  INTO v_longest_decline
  FROM founder_health_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL;

  RETURN QUERY SELECT
    v_total,
    v_current_category,
    v_current_score,
    v_avg_score,
    v_max_score,
    v_min_score,
    v_avg_volatility,
    v_by_category,
    v_trend,
    v_critical_days,
    v_longest_decline;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE founder_health_index IS 'F14: Multivariate Founder Health Index - longitudinal health scoring from F09-F13';
COMMENT ON FUNCTION calculate_health_index IS 'F14: Calculate current health index from F09-F13 weighted signals';
COMMENT ON FUNCTION record_health_index IS 'F14: Record health index snapshot';
COMMENT ON FUNCTION list_health_index IS 'F14: List health index snapshots with filters';
COMMENT ON FUNCTION get_health_summary IS 'F14: Get aggregated health index summary';
