-- =====================================================
-- Migration: 550_founder_recovery_protocols.sql
-- Phase: F12 - Founder Recovery Protocols
-- Description: Recovery states, rest cycles, and corrective suggestions
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE recovery_state AS ENUM (
    'well_rested',
    'normal',
    'fatigued',
    'exhausted',
    'burned_out',
    'recovering'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recovery_action_type AS ENUM (
    'micro_break',
    'short_break',
    'long_break',
    'power_nap',
    'physical_activity',
    'meditation',
    'social_connection',
    'creative_activity',
    'nature_exposure',
    'sleep_optimization',
    'workload_reduction',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recovery_urgency AS ENUM (
    'low',
    'moderate',
    'high',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Recovery State Snapshots
DROP TABLE IF EXISTS founder_recovery_states CASCADE;
CREATE TABLE founder_recovery_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state recovery_state NOT NULL DEFAULT 'normal',
  recovery_score NUMERIC CHECK (recovery_score >= 0 AND recovery_score <= 100),
  fatigue_level NUMERIC CHECK (fatigue_level >= 0 AND fatigue_level <= 100),
  stress_level NUMERIC CHECK (stress_level >= 0 AND stress_level <= 100),
  sleep_quality NUMERIC CHECK (sleep_quality >= 0 AND sleep_quality <= 100),
  contributing_factors JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recovery Actions (recommended and taken)
DROP TABLE IF EXISTS founder_recovery_actions CASCADE;
CREATE TABLE founder_recovery_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type recovery_action_type NOT NULL DEFAULT 'other',
  urgency recovery_urgency NOT NULL DEFAULT 'moderate',
  description TEXT NOT NULL,
  recommended BOOLEAN DEFAULT TRUE,
  taken BOOLEAN DEFAULT FALSE,
  scheduled_for TIMESTAMPTZ,
  duration_minutes INTEGER,
  effectiveness_rating NUMERIC CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 100),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  taken_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_recovery_states_tenant;
CREATE INDEX idx_recovery_states_tenant ON founder_recovery_states(tenant_id, created_at DESC);

DROP INDEX IF EXISTS idx_recovery_states_state;
CREATE INDEX idx_recovery_states_state ON founder_recovery_states(tenant_id, state);

DROP INDEX IF EXISTS idx_recovery_states_score;
CREATE INDEX idx_recovery_states_score ON founder_recovery_states(tenant_id, recovery_score DESC NULLS LAST);

DROP INDEX IF EXISTS idx_recovery_actions_tenant;
CREATE INDEX idx_recovery_actions_tenant ON founder_recovery_actions(tenant_id, created_at DESC);

DROP INDEX IF EXISTS idx_recovery_actions_type;
CREATE INDEX idx_recovery_actions_type ON founder_recovery_actions(tenant_id, action_type);

DROP INDEX IF EXISTS idx_recovery_actions_urgency;
CREATE INDEX idx_recovery_actions_urgency ON founder_recovery_actions(tenant_id, urgency);

DROP INDEX IF EXISTS idx_recovery_actions_taken;
CREATE INDEX idx_recovery_actions_taken ON founder_recovery_actions(tenant_id, taken) WHERE taken = FALSE;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE founder_recovery_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_recovery_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS recovery_states_tenant_isolation ON founder_recovery_states;
CREATE POLICY recovery_states_tenant_isolation ON founder_recovery_states
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS recovery_actions_tenant_isolation ON founder_recovery_actions;
CREATE POLICY recovery_actions_tenant_isolation ON founder_recovery_actions
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record recovery state
DROP FUNCTION IF EXISTS record_recovery_state CASCADE;
CREATE OR REPLACE FUNCTION record_recovery_state(
  p_tenant_id UUID,
  p_recovery_score NUMERIC,
  p_fatigue_level NUMERIC DEFAULT NULL,
  p_stress_level NUMERIC DEFAULT NULL,
  p_sleep_quality NUMERIC DEFAULT NULL,
  p_state recovery_state DEFAULT NULL,
  p_contributing_factors JSONB DEFAULT '[]'::jsonb,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_state_id UUID;
  v_state recovery_state;
  v_composite_score NUMERIC;
BEGIN
  -- Calculate composite score
  v_composite_score := p_recovery_score;
  IF p_fatigue_level IS NOT NULL THEN
    v_composite_score := (v_composite_score + (100 - p_fatigue_level)) / 2;
  END IF;
  IF p_stress_level IS NOT NULL THEN
    v_composite_score := (v_composite_score + (100 - p_stress_level)) / 2;
  END IF;
  IF p_sleep_quality IS NOT NULL THEN
    v_composite_score := (v_composite_score + p_sleep_quality) / 2;
  END IF;

  -- Auto-detect state if not provided
  IF p_state IS NULL THEN
    IF v_composite_score >= 80 THEN
      v_state := 'well_rested';
    ELSIF v_composite_score >= 60 THEN
      v_state := 'normal';
    ELSIF v_composite_score >= 40 THEN
      v_state := 'fatigued';
    ELSIF v_composite_score >= 20 THEN
      v_state := 'exhausted';
    ELSE
      v_state := 'burned_out';
    END IF;
  ELSE
    v_state := p_state;
  END IF;

  INSERT INTO founder_recovery_states (
    tenant_id,
    state,
    recovery_score,
    fatigue_level,
    stress_level,
    sleep_quality,
    contributing_factors,
    notes,
    metadata
  )
  VALUES (
    p_tenant_id,
    v_state,
    v_composite_score,
    p_fatigue_level,
    p_stress_level,
    p_sleep_quality,
    p_contributing_factors,
    p_notes,
    p_metadata
  )
  RETURNING id INTO v_state_id;

  RETURN v_state_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recommend recovery action
DROP FUNCTION IF EXISTS recommend_recovery_action CASCADE;
CREATE OR REPLACE FUNCTION recommend_recovery_action(
  p_tenant_id UUID,
  p_action_type recovery_action_type,
  p_urgency recovery_urgency,
  p_description TEXT,
  p_duration_minutes INTEGER DEFAULT NULL,
  p_scheduled_for TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
BEGIN
  INSERT INTO founder_recovery_actions (
    tenant_id,
    action_type,
    urgency,
    description,
    recommended,
    duration_minutes,
    scheduled_for,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_action_type,
    p_urgency,
    p_description,
    TRUE,
    p_duration_minutes,
    p_scheduled_for,
    p_metadata
  )
  RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark recovery action as taken
DROP FUNCTION IF EXISTS mark_recovery_action_taken CASCADE;
CREATE OR REPLACE FUNCTION mark_recovery_action_taken(
  p_action_id UUID,
  p_effectiveness_rating NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE founder_recovery_actions
  SET
    taken = TRUE,
    taken_at = now(),
    effectiveness_rating = p_effectiveness_rating,
    notes = COALESCE(p_notes, notes)
  WHERE id = p_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List recovery states
DROP FUNCTION IF EXISTS list_recovery_states CASCADE;
CREATE OR REPLACE FUNCTION list_recovery_states(
  p_tenant_id UUID,
  p_state recovery_state DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF founder_recovery_states AS $$
BEGIN
  RETURN QUERY
  SELECT rs.*
  FROM founder_recovery_states rs
  WHERE rs.tenant_id = p_tenant_id
    AND (p_state IS NULL OR rs.state = p_state)
    AND (p_start_date IS NULL OR rs.created_at >= p_start_date)
    AND (p_end_date IS NULL OR rs.created_at <= p_end_date)
  ORDER BY rs.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List recovery actions
DROP FUNCTION IF EXISTS list_recovery_actions CASCADE;
CREATE OR REPLACE FUNCTION list_recovery_actions(
  p_tenant_id UUID,
  p_action_type recovery_action_type DEFAULT NULL,
  p_urgency recovery_urgency DEFAULT NULL,
  p_taken BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF founder_recovery_actions AS $$
BEGIN
  RETURN QUERY
  SELECT ra.*
  FROM founder_recovery_actions ra
  WHERE ra.tenant_id = p_tenant_id
    AND (p_action_type IS NULL OR ra.action_type = p_action_type)
    AND (p_urgency IS NULL OR ra.urgency = p_urgency)
    AND (p_taken IS NULL OR ra.taken = p_taken)
  ORDER BY ra.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recovery summary
DROP FUNCTION IF EXISTS get_recovery_summary CASCADE;
CREATE OR REPLACE FUNCTION get_recovery_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_days || ' days')::interval;

  SELECT jsonb_build_object(
    'current_state', (
      SELECT state
      FROM founder_recovery_states
      WHERE tenant_id = p_tenant_id
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'current_recovery_score', (
      SELECT recovery_score
      FROM founder_recovery_states
      WHERE tenant_id = p_tenant_id
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'avg_recovery_score', ROUND(AVG(recovery_score), 2),
    'avg_fatigue_level', ROUND(AVG(fatigue_level), 2),
    'avg_stress_level', ROUND(AVG(stress_level), 2),
    'avg_sleep_quality', ROUND(AVG(sleep_quality), 2),
    'by_state', (
      SELECT jsonb_object_agg(state, count)
      FROM (
        SELECT state, COUNT(*)::integer as count
        FROM founder_recovery_states
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY state
      ) state_counts
    ),
    'pending_actions', (
      SELECT COUNT(*)
      FROM founder_recovery_actions
      WHERE tenant_id = p_tenant_id
        AND taken = FALSE
        AND created_at >= v_since
    ),
    'critical_actions', (
      SELECT COUNT(*)
      FROM founder_recovery_actions
      WHERE tenant_id = p_tenant_id
        AND taken = FALSE
        AND urgency = 'critical'
        AND created_at >= v_since
    ),
    'completed_actions', (
      SELECT COUNT(*)
      FROM founder_recovery_actions
      WHERE tenant_id = p_tenant_id
        AND taken = TRUE
        AND created_at >= v_since
    ),
    'avg_action_effectiveness', (
      SELECT ROUND(AVG(effectiveness_rating), 2)
      FROM founder_recovery_actions
      WHERE tenant_id = p_tenant_id
        AND taken = TRUE
        AND effectiveness_rating IS NOT NULL
        AND created_at >= v_since
    )
  ) INTO v_summary
  FROM founder_recovery_states
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-recommend recovery actions based on current state
DROP FUNCTION IF EXISTS auto_recommend_recovery CASCADE;
CREATE OR REPLACE FUNCTION auto_recommend_recovery(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_current_state recovery_state;
  v_current_score NUMERIC;
  v_recommendations JSONB := '[]'::jsonb;
BEGIN
  -- Get current recovery state
  SELECT state, recovery_score INTO v_current_state, v_current_score
  FROM founder_recovery_states
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Generate recommendations based on state
  CASE v_current_state
    WHEN 'burned_out' THEN
      v_recommendations := jsonb_build_array(
        jsonb_build_object('action_type', 'workload_reduction', 'urgency', 'critical', 'description', 'Immediately reduce workload by 50% for 1 week'),
        jsonb_build_object('action_type', 'sleep_optimization', 'urgency', 'critical', 'description', 'Prioritize 8+ hours of sleep nightly'),
        jsonb_build_object('action_type', 'long_break', 'urgency', 'critical', 'description', 'Schedule 2-3 days off for recovery')
      );
    WHEN 'exhausted' THEN
      v_recommendations := jsonb_build_array(
        jsonb_build_object('action_type', 'long_break', 'urgency', 'high', 'description', 'Take extended break (4+ hours)'),
        jsonb_build_object('action_type', 'physical_activity', 'urgency', 'moderate', 'description', 'Light exercise for 20 minutes'),
        jsonb_build_object('action_type', 'power_nap', 'urgency', 'high', 'description', '20-minute power nap')
      );
    WHEN 'fatigued' THEN
      v_recommendations := jsonb_build_array(
        jsonb_build_object('action_type', 'short_break', 'urgency', 'moderate', 'description', '15-minute break from work'),
        jsonb_build_object('action_type', 'nature_exposure', 'urgency', 'low', 'description', 'Brief outdoor walk'),
        jsonb_build_object('action_type', 'meditation', 'urgency', 'moderate', 'description', '10-minute mindfulness session')
      );
    WHEN 'normal' THEN
      v_recommendations := jsonb_build_array(
        jsonb_build_object('action_type', 'micro_break', 'urgency', 'low', 'description', '5-minute stretch break every 90 minutes')
      );
    ELSE
      v_recommendations := '[]'::jsonb;
  END CASE;

  RETURN jsonb_build_object(
    'current_state', v_current_state,
    'current_score', v_current_score,
    'recommendations', v_recommendations
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE founder_recovery_states IS 'F12: Recovery state snapshots with auto-state detection';
COMMENT ON TABLE founder_recovery_actions IS 'F12: Recovery actions (recommended and taken)';
COMMENT ON FUNCTION record_recovery_state IS 'F12: Record recovery state with auto-detection';
COMMENT ON FUNCTION recommend_recovery_action IS 'F12: Recommend recovery action';
COMMENT ON FUNCTION mark_recovery_action_taken IS 'F12: Mark recovery action as taken';
COMMENT ON FUNCTION list_recovery_states IS 'F12: List recovery states with filters';
COMMENT ON FUNCTION list_recovery_actions IS 'F12: List recovery actions with filters';
COMMENT ON FUNCTION get_recovery_summary IS 'F12: Get aggregated recovery summary';
COMMENT ON FUNCTION auto_recommend_recovery IS 'F12: Auto-generate recovery recommendations based on current state';
