-- =====================================================
-- Migration: 548_energy_mapping_engine.sql
-- Phase: F10 - Energy Mapping Engine
-- Description: Energy peaks/troughs and time-of-day productivity mapping
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE energy_level_category AS ENUM (
    'depleted',
    'low',
    'moderate',
    'high',
    'peak',
    'flow_state'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE energy_measurement_type AS ENUM (
    'self_reported',
    'activity_inferred',
    'productivity_score',
    'focus_depth',
    'task_completion',
    'response_time',
    'decision_quality',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Energy Level Readings
DROP TABLE IF EXISTS founder_energy_readings CASCADE;
CREATE TABLE founder_energy_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  energy_level NUMERIC CHECK (energy_level >= 0 AND energy_level <= 100) NOT NULL,
  category energy_level_category NOT NULL DEFAULT 'moderate',
  measurement_type energy_measurement_type NOT NULL DEFAULT 'self_reported',
  time_of_day TIME NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  contributing_factors JSONB DEFAULT '[]'::jsonb,
  activity_context TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Energy Patterns (derived insights)
DROP TABLE IF EXISTS founder_energy_patterns CASCADE;
CREATE TABLE founder_energy_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  avg_energy_level NUMERIC CHECK (avg_energy_level >= 0 AND avg_energy_level <= 100),
  peak_category energy_level_category,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
  data_points INTEGER DEFAULT 0,
  recommendation TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_energy_readings_tenant;
CREATE INDEX idx_energy_readings_tenant ON founder_energy_readings(tenant_id, created_at DESC);

DROP INDEX IF EXISTS idx_energy_readings_time;
CREATE INDEX idx_energy_readings_time ON founder_energy_readings(tenant_id, time_of_day);

DROP INDEX IF EXISTS idx_energy_readings_day;
CREATE INDEX idx_energy_readings_day ON founder_energy_readings(tenant_id, day_of_week);

DROP INDEX IF EXISTS idx_energy_readings_category;
CREATE INDEX idx_energy_readings_category ON founder_energy_readings(tenant_id, category);

DROP INDEX IF EXISTS idx_energy_readings_level;
CREATE INDEX idx_energy_readings_level ON founder_energy_readings(tenant_id, energy_level DESC);

DROP INDEX IF EXISTS idx_energy_patterns_tenant;
CREATE INDEX idx_energy_patterns_tenant ON founder_energy_patterns(tenant_id, pattern_type);

DROP INDEX IF EXISTS idx_energy_patterns_time;
CREATE INDEX idx_energy_patterns_time ON founder_energy_patterns(tenant_id, time_start, time_end);

DROP INDEX IF EXISTS idx_energy_patterns_confidence;
CREATE INDEX idx_energy_patterns_confidence ON founder_energy_patterns(tenant_id, confidence DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE founder_energy_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_energy_patterns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS energy_readings_tenant_isolation ON founder_energy_readings;
CREATE POLICY energy_readings_tenant_isolation ON founder_energy_readings
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

DROP POLICY IF EXISTS energy_patterns_tenant_isolation ON founder_energy_patterns;
CREATE POLICY energy_patterns_tenant_isolation ON founder_energy_patterns
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record energy reading
DROP FUNCTION IF EXISTS record_energy_reading CASCADE;
CREATE OR REPLACE FUNCTION record_energy_reading(
  p_tenant_id UUID,
  p_energy_level NUMERIC,
  p_measurement_type energy_measurement_type,
  p_category energy_level_category DEFAULT NULL,
  p_activity_context TEXT DEFAULT NULL,
  p_contributing_factors JSONB DEFAULT '[]'::jsonb,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_reading_id UUID;
  v_category energy_level_category;
  v_time_of_day TIME;
  v_day_of_week INTEGER;
BEGIN
  -- Auto-detect category if not provided
  IF p_category IS NULL THEN
    IF p_energy_level >= 90 THEN
      v_category := 'flow_state';
    ELSIF p_energy_level >= 75 THEN
      v_category := 'peak';
    ELSIF p_energy_level >= 50 THEN
      v_category := 'high';
    ELSIF p_energy_level >= 30 THEN
      v_category := 'moderate';
    ELSIF p_energy_level >= 15 THEN
      v_category := 'low';
    ELSE
      v_category := 'depleted';
    END IF;
  ELSE
    v_category := p_category;
  END IF;

  -- Extract time components
  v_time_of_day := CURRENT_TIME;
  v_day_of_week := EXTRACT(DOW FROM CURRENT_TIMESTAMP)::INTEGER;

  INSERT INTO founder_energy_readings (
    tenant_id,
    energy_level,
    category,
    measurement_type,
    time_of_day,
    day_of_week,
    contributing_factors,
    activity_context,
    notes,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_energy_level,
    v_category,
    p_measurement_type,
    v_time_of_day,
    v_day_of_week,
    p_contributing_factors,
    p_activity_context,
    p_notes,
    p_metadata
  )
  RETURNING id INTO v_reading_id;

  RETURN v_reading_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List energy readings
DROP FUNCTION IF EXISTS list_energy_readings CASCADE;
CREATE OR REPLACE FUNCTION list_energy_readings(
  p_tenant_id UUID,
  p_category energy_level_category DEFAULT NULL,
  p_measurement_type energy_measurement_type DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF founder_energy_readings AS $$
BEGIN
  RETURN QUERY
  SELECT er.*
  FROM founder_energy_readings er
  WHERE er.tenant_id = p_tenant_id
    AND (p_category IS NULL OR er.category = p_category)
    AND (p_measurement_type IS NULL OR er.measurement_type = p_measurement_type)
    AND (p_start_date IS NULL OR er.created_at >= p_start_date)
    AND (p_end_date IS NULL OR er.created_at <= p_end_date)
  ORDER BY er.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get energy summary
DROP FUNCTION IF EXISTS get_energy_summary CASCADE;
CREATE OR REPLACE FUNCTION get_energy_summary(
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
    'total_readings', COUNT(*),
    'avg_energy', ROUND(AVG(energy_level), 2),
    'max_energy', MAX(energy_level),
    'min_energy', MIN(energy_level),
    'peak_count', COUNT(*) FILTER (WHERE category IN ('peak', 'flow_state')),
    'low_count', COUNT(*) FILTER (WHERE category IN ('depleted', 'low')),
    'by_category', (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*)::integer as count
        FROM founder_energy_readings
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY category
      ) category_counts
    ),
    'by_measurement_type', (
      SELECT jsonb_object_agg(measurement_type, count)
      FROM (
        SELECT measurement_type, COUNT(*)::integer as count
        FROM founder_energy_readings
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY measurement_type
      ) type_counts
    ),
    'by_day_of_week', (
      SELECT jsonb_object_agg(day_of_week, avg_energy)
      FROM (
        SELECT day_of_week, ROUND(AVG(energy_level), 2) as avg_energy
        FROM founder_energy_readings
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY day_of_week
        ORDER BY day_of_week
      ) day_averages
    ),
    'hourly_pattern', (
      SELECT jsonb_object_agg(hour, avg_energy)
      FROM (
        SELECT EXTRACT(HOUR FROM time_of_day)::TEXT as hour, ROUND(AVG(energy_level), 2) as avg_energy
        FROM founder_energy_readings
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY EXTRACT(HOUR FROM time_of_day)
        ORDER BY EXTRACT(HOUR FROM time_of_day)
      ) hourly_averages
    )
  ) INTO v_summary
  FROM founder_energy_readings
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Detect energy patterns
DROP FUNCTION IF EXISTS detect_energy_patterns CASCADE;
CREATE OR REPLACE FUNCTION detect_energy_patterns(
  p_tenant_id UUID,
  p_min_confidence NUMERIC DEFAULT 70.0
)
RETURNS SETOF founder_energy_patterns AS $$
BEGIN
  -- Clear old patterns
  DELETE FROM founder_energy_patterns WHERE tenant_id = p_tenant_id;

  -- Detect peak energy windows (2-hour blocks)
  INSERT INTO founder_energy_patterns (
    tenant_id,
    pattern_type,
    time_start,
    time_end,
    avg_energy_level,
    peak_category,
    confidence,
    data_points,
    recommendation
  )
  SELECT
    p_tenant_id,
    'peak_window',
    hour_start,
    hour_end,
    avg_energy,
    CASE
      WHEN avg_energy >= 75 THEN 'peak'::energy_level_category
      WHEN avg_energy >= 50 THEN 'high'::energy_level_category
      ELSE 'moderate'::energy_level_category
    END,
    LEAST(100, (data_count::NUMERIC / 10) * 100),
    data_count,
    CASE
      WHEN avg_energy >= 75 THEN 'Schedule high-priority deep work during this window'
      WHEN avg_energy >= 50 THEN 'Good window for focused work and meetings'
      ELSE 'Consider administrative tasks during this time'
    END
  FROM (
    SELECT
      (EXTRACT(HOUR FROM time_of_day) || ':00:00')::TIME as hour_start,
      ((EXTRACT(HOUR FROM time_of_day) + 2) || ':00:00')::TIME as hour_end,
      ROUND(AVG(energy_level), 2) as avg_energy,
      COUNT(*)::INTEGER as data_count
    FROM founder_energy_readings
    WHERE tenant_id = p_tenant_id
      AND created_at >= now() - INTERVAL '30 days'
    GROUP BY EXTRACT(HOUR FROM time_of_day)
    HAVING COUNT(*) >= 5
  ) windows
  WHERE (data_count::NUMERIC / 10) * 100 >= p_min_confidence;

  RETURN QUERY
  SELECT * FROM founder_energy_patterns
  WHERE tenant_id = p_tenant_id
  ORDER BY confidence DESC, avg_energy_level DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get optimal work windows
DROP FUNCTION IF EXISTS get_optimal_work_windows CASCADE;
CREATE OR REPLACE FUNCTION get_optimal_work_windows(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_windows JSONB;
BEGIN
  SELECT jsonb_build_object(
    'peak_windows', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'time_start', time_start,
          'time_end', time_end,
          'avg_energy', avg_energy_level,
          'recommendation', recommendation
        ) ORDER BY avg_energy_level DESC
      )
      FROM founder_energy_patterns
      WHERE tenant_id = p_tenant_id
        AND pattern_type = 'peak_window'
        AND confidence >= 70
      LIMIT 3
    ),
    'best_focus_time', (
      SELECT time_start
      FROM founder_energy_patterns
      WHERE tenant_id = p_tenant_id
        AND pattern_type = 'peak_window'
      ORDER BY avg_energy_level DESC
      LIMIT 1
    )
  ) INTO v_windows;

  RETURN v_windows;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE founder_energy_readings IS 'F10: Energy level readings with time-of-day tracking';
COMMENT ON TABLE founder_energy_patterns IS 'F10: Derived energy patterns and optimal work windows';
COMMENT ON FUNCTION record_energy_reading IS 'F10: Record energy reading with auto-category detection';
COMMENT ON FUNCTION list_energy_readings IS 'F10: List energy readings with filters';
COMMENT ON FUNCTION get_energy_summary IS 'F10: Get aggregated energy summary with hourly/daily patterns';
COMMENT ON FUNCTION detect_energy_patterns IS 'F10: Detect peak energy windows from historical data';
COMMENT ON FUNCTION get_optimal_work_windows IS 'F10: Get recommended work windows based on energy patterns';
