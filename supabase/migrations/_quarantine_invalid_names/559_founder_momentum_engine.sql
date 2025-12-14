-- =====================================================================================
-- Migration 559: Founder Momentum Engine (F20)
-- =====================================================================================
-- Purpose: Tracks upward or downward momentum based on multi-phase trends
-- Dependencies: F13-F19 (migrations 551-558)
-- Tables: founder_momentum_index, founder_momentum_signals
-- RPC Functions: calculate_momentum(), list_momentum_index()
-- =====================================================================================

-- =====================================================================================
-- ENUMS
-- =====================================================================================

DO $$ BEGIN
  CREATE TYPE momentum_direction_type AS ENUM (
    'accelerating_up',
    'trending_up',
    'stable',
    'trending_down',
    'accelerating_down',
    'volatile'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================================
-- TABLES
-- =====================================================================================

CREATE TABLE IF NOT EXISTS founder_momentum_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Momentum metrics
  momentum_score NUMERIC NOT NULL CHECK (momentum_score >= 0 AND momentum_score <= 100),
  momentum_direction momentum_direction_type NOT NULL,

  -- Velocity and acceleration
  velocity NUMERIC,                  -- Rate of change
  acceleration NUMERIC,              -- Rate of velocity change
  trajectory_angle NUMERIC,          -- Direction angle in degrees

  -- Contributing signals
  contributing_signals JSONB NOT NULL DEFAULT '{}',
  positive_signals INT DEFAULT 0,
  negative_signals INT DEFAULT 0,
  mixed_signals INT DEFAULT 0,

  -- Confidence
  confidence_level NUMERIC CHECK (confidence_level >= 0 AND confidence_level <= 100),
  signal_strength NUMERIC,

  -- Context
  key_drivers TEXT[],
  momentum_sustainers TEXT[],
  momentum_drains TEXT[],

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS founder_momentum_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  momentum_id UUID NOT NULL REFERENCES founder_momentum_index(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  signal_type TEXT NOT NULL,         -- 'drift', 'resilience', 'workload', etc.
  signal_value NUMERIC NOT NULL,
  signal_weight NUMERIC DEFAULT 1.0,
  impact TEXT,                        -- 'positive', 'negative', 'neutral'
  description TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================================
-- INDEXES
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_momentum_index_tenant_created
  ON founder_momentum_index (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_momentum_index_direction
  ON founder_momentum_index (momentum_direction, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_momentum_index_score
  ON founder_momentum_index (momentum_score DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_momentum_signals_momentum
  ON founder_momentum_signals (momentum_id);

CREATE INDEX IF NOT EXISTS idx_momentum_signals_tenant
  ON founder_momentum_signals (tenant_id, created_at DESC);

-- =====================================================================================
-- ROW LEVEL SECURITY
-- =====================================================================================

ALTER TABLE founder_momentum_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_momentum_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own momentum index"
  ON founder_momentum_index FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own momentum index"
  ON founder_momentum_index FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can view own momentum signals"
  ON founder_momentum_signals FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert own momentum signals"
  ON founder_momentum_signals FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- =====================================================================================
-- RPC FUNCTIONS
-- =====================================================================================

-- Calculate momentum
CREATE OR REPLACE FUNCTION calculate_momentum(
  p_tenant_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_momentum_score NUMERIC;
  v_direction momentum_direction_type;
  v_velocity NUMERIC;
  v_acceleration NUMERIC;
  v_signals JSONB;
  v_momentum_id UUID;
  v_positive_count INT;
  v_negative_count INT;
BEGIN
  -- Calculate trend metrics (placeholder - implement real calculation)
  v_velocity := 5.0;       -- TODO: Calculate from F13-F19 trends
  v_acceleration := 2.0;   -- TODO: Calculate second derivative

  -- Calculate momentum score based on velocity and acceleration
  v_momentum_score := GREATEST(0, LEAST(100, 50 + (v_velocity * 5) + (v_acceleration * 2)));

  -- Determine direction
  v_direction := CASE
    WHEN v_acceleration > 5 AND v_velocity > 5 THEN 'accelerating_up'::momentum_direction_type
    WHEN v_velocity > 5 THEN 'trending_up'::momentum_direction_type
    WHEN ABS(v_velocity) <= 5 THEN 'stable'::momentum_direction_type
    WHEN v_velocity < -5 AND v_acceleration >= 0 THEN 'trending_down'::momentum_direction_type
    WHEN v_acceleration < -5 THEN 'accelerating_down'::momentum_direction_type
    ELSE 'volatile'::momentum_direction_type
  END;

  -- Count signals
  v_positive_count := CASE WHEN v_velocity > 0 THEN 1 ELSE 0 END;
  v_negative_count := CASE WHEN v_velocity < 0 THEN 1 ELSE 0 END;

  -- Build signals
  v_signals := jsonb_build_object(
    'velocity', v_velocity,
    'acceleration', v_acceleration,
    'calculated_at', NOW()
  );

  -- Insert momentum record
  INSERT INTO founder_momentum_index (
    tenant_id,
    momentum_score,
    momentum_direction,
    velocity,
    acceleration,
    contributing_signals,
    positive_signals,
    negative_signals
  ) VALUES (
    p_tenant_id,
    v_momentum_score,
    v_direction,
    v_velocity,
    v_acceleration,
    v_signals,
    v_positive_count,
    v_negative_count
  )
  RETURNING id INTO v_momentum_id;

  -- Return result
  RETURN jsonb_build_object(
    'momentum_id', v_momentum_id,
    'momentum_score', v_momentum_score,
    'direction', v_direction,
    'velocity', v_velocity,
    'acceleration', v_acceleration
  );
END;
$$;

-- List momentum index
CREATE OR REPLACE FUNCTION list_momentum_index(
  p_tenant_id UUID,
  p_direction momentum_direction_type DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  momentum_score NUMERIC,
  momentum_direction TEXT,
  velocity NUMERIC,
  acceleration NUMERIC,
  trajectory_angle NUMERIC,
  contributing_signals JSONB,
  positive_signals INT,
  negative_signals INT,
  mixed_signals INT,
  confidence_level NUMERIC,
  key_drivers TEXT[],
  momentum_sustainers TEXT[],
  momentum_drains TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mi.id,
    mi.momentum_score,
    mi.momentum_direction::TEXT,
    mi.velocity,
    mi.acceleration,
    mi.trajectory_angle,
    mi.contributing_signals,
    mi.positive_signals,
    mi.negative_signals,
    mi.mixed_signals,
    mi.confidence_level,
    mi.key_drivers,
    mi.momentum_sustainers,
    mi.momentum_drains,
    mi.created_at
  FROM founder_momentum_index mi
  WHERE mi.tenant_id = p_tenant_id
    AND (p_direction IS NULL OR mi.momentum_direction = p_direction)
    AND (p_start_date IS NULL OR mi.created_at >= p_start_date)
    AND (p_end_date IS NULL OR mi.created_at <= p_end_date)
  ORDER BY mi.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Get momentum summary
CREATE OR REPLACE FUNCTION get_momentum_summary(
  p_tenant_id UUID,
  p_days INT DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_avg_momentum NUMERIC;
  v_current_direction TEXT;
  v_avg_velocity NUMERIC;
  v_trend TEXT;
BEGIN
  -- Get average metrics
  SELECT
    COALESCE(AVG(momentum_score), 0),
    COALESCE(AVG(velocity), 0)
  INTO v_avg_momentum, v_avg_velocity
  FROM founder_momentum_index
  WHERE tenant_id = p_tenant_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Get current direction
  SELECT momentum_direction::TEXT
  INTO v_current_direction
  FROM founder_momentum_index
  WHERE tenant_id = p_tenant_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determine trend
  v_trend := CASE
    WHEN v_avg_velocity > 10 THEN 'strongly_positive'
    WHEN v_avg_velocity > 5 THEN 'positive'
    WHEN v_avg_velocity > -5 THEN 'neutral'
    WHEN v_avg_velocity > -10 THEN 'negative'
    ELSE 'strongly_negative'
  END;

  v_result := jsonb_build_object(
    'avg_momentum', ROUND(v_avg_momentum, 2),
    'avg_velocity', ROUND(v_avg_velocity, 2),
    'current_direction', COALESCE(v_current_direction, 'unknown'),
    'trend', v_trend,
    'period_days', p_days
  );

  RETURN v_result;
END;
$$;

-- =====================================================================================
-- COMMENTS
-- =====================================================================================

COMMENT ON TABLE founder_momentum_index IS 'F20: Tracks directional momentum across all founder metrics';
COMMENT ON TABLE founder_momentum_signals IS 'F20: Individual signals contributing to momentum calculation';
COMMENT ON FUNCTION calculate_momentum IS 'F20: Calculates current momentum based on velocity and acceleration';
COMMENT ON FUNCTION list_momentum_index IS 'F20: Lists momentum index records with optional filters';
COMMENT ON FUNCTION get_momentum_summary IS 'F20: Returns summary statistics for momentum over specified period';
