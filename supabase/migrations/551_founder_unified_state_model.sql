-- Phase F13: Founder Unified State Model (FUSM)
-- Migration: 551
-- Aggregates F09-F12 signals into unified weighted state

-- ============================================================================
-- ENUMS
-- ============================================================================

-- State category classification
DO $$ BEGIN
  CREATE TYPE founder_state_category AS ENUM (
    'optimal',      -- All systems performing well
    'flow',         -- High productivity, low stress
    'focused',      -- Deep work mode
    'balanced',     -- Normal operations
    'stressed',     -- Elevated stress, manageable
    'overloaded',   -- High cognitive load
    'fatigued',     -- Low energy, needs recovery
    'disrupted',    -- Frequent interruptions
    'recovering',   -- In recovery mode
    'critical'      -- Immediate intervention needed
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Main unified state table
DROP TABLE IF EXISTS founder_unified_state CASCADE;
CREATE TABLE founder_unified_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_category founder_state_category NOT NULL DEFAULT 'balanced',
  composite_score NUMERIC CHECK (composite_score >= 0 AND composite_score <= 100) NOT NULL,

  -- Component scores from F09-F12
  cognitive_load_score NUMERIC CHECK (cognitive_load_score >= 0 AND cognitive_load_score <= 100),
  energy_score NUMERIC CHECK (energy_score >= 0 AND energy_score <= 100),
  recovery_score NUMERIC CHECK (recovery_score >= 0 AND recovery_score <= 100),
  intent_routing_score NUMERIC CHECK (intent_routing_score >= 0 AND intent_routing_score <= 100),

  -- Aggregated factors
  factors JSONB DEFAULT '{}'::jsonb,

  -- Recommendations
  recommended_actions TEXT[],
  priority_level TEXT, -- 'low', 'moderate', 'high', 'critical'

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_unified_state_tenant;
CREATE INDEX idx_unified_state_tenant
  ON founder_unified_state (tenant_id, created_at DESC);

DROP INDEX IF EXISTS idx_unified_state_category;
CREATE INDEX idx_unified_state_category
  ON founder_unified_state (tenant_id, state_category);

DROP INDEX IF EXISTS idx_unified_state_score;
CREATE INDEX idx_unified_state_score
  ON founder_unified_state (tenant_id, composite_score DESC);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE founder_unified_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_unified_state_tenant_isolation ON founder_unified_state;
CREATE POLICY founder_unified_state_tenant_isolation ON founder_unified_state
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- 1. Calculate unified state from F09-F12 data
DROP FUNCTION IF EXISTS calculate_unified_state CASCADE;
CREATE OR REPLACE FUNCTION calculate_unified_state(
  p_tenant_id UUID
)
RETURNS TABLE (
  composite_score NUMERIC,
  state_category founder_state_category,
  cognitive_load_score NUMERIC,
  energy_score NUMERIC,
  recovery_score NUMERIC,
  intent_routing_score NUMERIC,
  factors JSONB,
  recommended_actions TEXT[],
  priority_level TEXT
) AS $$
DECLARE
  v_cognitive_load NUMERIC DEFAULT 50;
  v_energy NUMERIC DEFAULT 50;
  v_recovery NUMERIC DEFAULT 50;
  v_intent_routing NUMERIC DEFAULT 50;
  v_composite NUMERIC;
  v_category founder_state_category;
  v_factors JSONB DEFAULT '{}'::jsonb;
  v_actions TEXT[];
  v_priority TEXT;
BEGIN
  -- Get current cognitive load (F09)
  SELECT
    COALESCE(current_avg_load, 50),
    jsonb_build_object(
      'intensity', current_intensity,
      'recovery_needed', recovery_needed
    )
  INTO v_cognitive_load, v_factors
  FROM get_current_cognitive_load(p_tenant_id, 60);

  -- Invert cognitive load (lower is better)
  v_cognitive_load := 100 - COALESCE(v_cognitive_load, 50);

  -- Get energy summary (F10)
  SELECT COALESCE(avg_energy, 50)
  INTO v_energy
  FROM get_energy_summary(p_tenant_id, 7);

  -- Get recovery summary (F12)
  SELECT COALESCE(current_score, 50)
  INTO v_recovery
  FROM get_recovery_summary(p_tenant_id, 7);

  -- Get intent routing performance (F11)
  SELECT
    CASE
      WHEN total_signals > 0 THEN (completed_count::NUMERIC / total_signals) * 100
      ELSE 50
    END
  INTO v_intent_routing
  FROM get_intent_routing_summary(p_tenant_id, 7);

  -- Calculate weighted composite (40% recovery, 30% energy, 20% cognitive, 10% routing)
  v_composite := (
    (v_recovery * 0.4) +
    (v_energy * 0.3) +
    (v_cognitive_load * 0.2) +
    (v_intent_routing * 0.1)
  );

  -- Update factors
  v_factors := jsonb_build_object(
    'cognitive_load', v_cognitive_load,
    'energy', v_energy,
    'recovery', v_recovery,
    'intent_routing', v_intent_routing,
    'weights', jsonb_build_object(
      'recovery', 0.4,
      'energy', 0.3,
      'cognitive', 0.2,
      'routing', 0.1
    )
  );

  -- Determine state category and recommendations
  IF v_composite >= 85 AND v_energy >= 80 THEN
    v_category := 'optimal';
    v_actions := ARRAY['Maintain current practices', 'Consider strategic planning'];
    v_priority := 'low';
  ELSIF v_composite >= 80 AND v_energy >= 75 THEN
    v_category := 'flow';
    v_actions := ARRAY['Leverage high productivity', 'Tackle high-priority tasks'];
    v_priority := 'low';
  ELSIF v_cognitive_load >= 70 AND v_energy >= 60 THEN
    v_category := 'focused';
    v_actions := ARRAY['Continue deep work', 'Minimize interruptions'];
    v_priority := 'low';
  ELSIF v_composite >= 50 AND v_composite < 80 THEN
    v_category := 'balanced';
    v_actions := ARRAY['Monitor energy levels', 'Take regular breaks'];
    v_priority := 'moderate';
  ELSIF v_cognitive_load < 50 THEN
    v_category := 'overloaded';
    v_actions := ARRAY['Reduce task load', 'Delegate where possible', 'Schedule recovery time'];
    v_priority := 'high';
  ELSIF v_energy < 40 THEN
    v_category := 'fatigued';
    v_actions := ARRAY['Take extended break', 'Review sleep quality', 'Reduce commitments'];
    v_priority := 'high';
  ELSIF v_recovery < 40 THEN
    v_category := 'recovering';
    v_actions := ARRAY['Continue recovery protocols', 'Avoid high-stress tasks', 'Focus on rest'];
    v_priority := 'high';
  ELSIF v_composite < 30 THEN
    v_category := 'critical';
    v_actions := ARRAY['Immediate intervention needed', 'Stop all non-essential work', 'Seek support'];
    v_priority := 'critical';
  ELSE
    v_category := 'stressed';
    v_actions := ARRAY['Implement stress management', 'Review workload', 'Schedule downtime'];
    v_priority := 'high';
  END IF;

  RETURN QUERY SELECT
    v_composite,
    v_category,
    v_cognitive_load,
    v_energy,
    v_recovery,
    v_intent_routing,
    v_factors,
    v_actions,
    v_priority;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Record unified state snapshot
DROP FUNCTION IF EXISTS record_unified_state CASCADE;
CREATE OR REPLACE FUNCTION record_unified_state(
  p_tenant_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_state RECORD;
  v_id UUID;
BEGIN
  -- Calculate current unified state
  SELECT * INTO v_state FROM calculate_unified_state(p_tenant_id);

  -- Insert snapshot
  INSERT INTO founder_unified_state (
    tenant_id,
    state_category,
    composite_score,
    cognitive_load_score,
    energy_score,
    recovery_score,
    intent_routing_score,
    factors,
    recommended_actions,
    priority_level,
    notes,
    metadata
  ) VALUES (
    p_tenant_id,
    v_state.state_category,
    v_state.composite_score,
    v_state.cognitive_load_score,
    v_state.energy_score,
    v_state.recovery_score,
    v_state.intent_routing_score,
    v_state.factors,
    v_state.recommended_actions,
    v_state.priority_level,
    p_notes,
    p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. List unified state snapshots
DROP FUNCTION IF EXISTS list_unified_state CASCADE;
CREATE OR REPLACE FUNCTION list_unified_state(
  p_tenant_id UUID,
  p_category founder_state_category DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  state_category founder_state_category,
  composite_score NUMERIC,
  cognitive_load_score NUMERIC,
  energy_score NUMERIC,
  recovery_score NUMERIC,
  intent_routing_score NUMERIC,
  factors JSONB,
  recommended_actions TEXT[],
  priority_level TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id,
    us.state_category,
    us.composite_score,
    us.cognitive_load_score,
    us.energy_score,
    us.recovery_score,
    us.intent_routing_score,
    us.factors,
    us.recommended_actions,
    us.priority_level,
    us.notes,
    us.created_at
  FROM founder_unified_state us
  WHERE us.tenant_id = p_tenant_id
    AND (p_category IS NULL OR us.state_category = p_category)
    AND (p_start_date IS NULL OR us.created_at >= p_start_date)
    AND (p_end_date IS NULL OR us.created_at <= p_end_date)
  ORDER BY us.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get unified state summary
DROP FUNCTION IF EXISTS get_unified_state_summary CASCADE;
CREATE OR REPLACE FUNCTION get_unified_state_summary(
  p_tenant_id UUID,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  total_snapshots INTEGER,
  current_state founder_state_category,
  current_score NUMERIC,
  avg_composite_score NUMERIC,
  max_score NUMERIC,
  min_score NUMERIC,
  by_category JSONB,
  score_trend TEXT, -- 'improving', 'stable', 'declining'
  critical_count INTEGER
) AS $$
DECLARE
  v_total INTEGER;
  v_current_state founder_state_category;
  v_current_score NUMERIC;
  v_avg_score NUMERIC;
  v_max_score NUMERIC;
  v_min_score NUMERIC;
  v_by_category JSONB;
  v_trend TEXT;
  v_critical INTEGER;
  v_recent_avg NUMERIC;
  v_older_avg NUMERIC;
BEGIN
  -- Get totals
  SELECT COUNT(*)
  INTO v_total
  FROM founder_unified_state
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL;

  -- Get current state
  SELECT state_category, composite_score
  INTO v_current_state, v_current_score
  FROM founder_unified_state
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Get aggregates
  SELECT
    ROUND(AVG(composite_score), 2),
    MAX(composite_score),
    MIN(composite_score)
  INTO v_avg_score, v_max_score, v_min_score
  FROM founder_unified_state
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL;

  -- By category
  SELECT jsonb_object_agg(state_category::TEXT, count)
  INTO v_by_category
  FROM (
    SELECT state_category, COUNT(*)::INTEGER as count
    FROM founder_unified_state
    WHERE tenant_id = p_tenant_id
      AND created_at >= now() - (p_days || ' days')::INTERVAL
    GROUP BY state_category
  ) counts;

  -- Calculate trend
  SELECT AVG(composite_score)
  INTO v_recent_avg
  FROM founder_unified_state
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days / 2 || ' days')::INTERVAL;

  SELECT AVG(composite_score)
  INTO v_older_avg
  FROM founder_unified_state
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

  -- Critical count
  SELECT COUNT(*)::INTEGER
  INTO v_critical
  FROM founder_unified_state
  WHERE tenant_id = p_tenant_id
    AND created_at >= now() - (p_days || ' days')::INTERVAL
    AND (state_category = 'critical' OR priority_level = 'critical');

  RETURN QUERY SELECT
    v_total,
    v_current_state,
    v_current_score,
    v_avg_score,
    v_max_score,
    v_min_score,
    v_by_category,
    v_trend,
    v_critical;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE founder_unified_state IS 'F13: Unified aggregation of F09-F12 founder intelligence signals';
COMMENT ON FUNCTION calculate_unified_state IS 'F13: Calculate current unified state from all F09-F12 data sources';
COMMENT ON FUNCTION record_unified_state IS 'F13: Record unified state snapshot';
COMMENT ON FUNCTION list_unified_state IS 'F13: List unified state snapshots with filters';
COMMENT ON FUNCTION get_unified_state_summary IS 'F13: Get aggregated unified state summary';
