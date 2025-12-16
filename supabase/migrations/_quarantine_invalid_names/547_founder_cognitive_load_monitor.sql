-- =====================================================
-- Migration: 547_founder_cognitive_load_monitor.sql
-- Phase: F09 - Founder Cognitive Load Monitor
-- Description: Mental load tracking from multi-source signals
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE cognitive_load_intensity AS ENUM (
    'minimal',
    'low',
    'moderate',
    'high',
    'extreme',
    'overload'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE cognitive_load_signal_type AS ENUM (
    'task_count',
    'decision_count',
    'context_switch',
    'interruption',
    'time_pressure',
    'complexity',
    'uncertainty',
    'novelty',
    'multitasking',
    'cognitive_fatigue',
    'information_overload',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Cognitive Load Events
DROP TABLE IF EXISTS founder_cognitive_load_events CASCADE;
CREATE TABLE founder_cognitive_load_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intensity cognitive_load_intensity NOT NULL DEFAULT 'moderate',
  calculated_load NUMERIC CHECK (calculated_load >= 0 AND calculated_load <= 100),
  signal_type cognitive_load_signal_type NOT NULL DEFAULT 'other',
  signal_value NUMERIC,
  context TEXT,
  contributing_factors JSONB DEFAULT '[]'::jsonb,
  recovery_recommended BOOLEAN DEFAULT FALSE,
  recovery_action TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_cognitive_load_tenant;
CREATE INDEX idx_cognitive_load_tenant ON founder_cognitive_load_events(tenant_id, created_at DESC);

DROP INDEX IF EXISTS idx_cognitive_load_intensity;
CREATE INDEX idx_cognitive_load_intensity ON founder_cognitive_load_events(tenant_id, intensity);

DROP INDEX IF EXISTS idx_cognitive_load_signal_type;
CREATE INDEX idx_cognitive_load_signal_type ON founder_cognitive_load_events(tenant_id, signal_type);

DROP INDEX IF EXISTS idx_cognitive_load_value;
CREATE INDEX idx_cognitive_load_value ON founder_cognitive_load_events(tenant_id, calculated_load DESC NULLS LAST);

DROP INDEX IF EXISTS idx_cognitive_load_recovery;
CREATE INDEX idx_cognitive_load_recovery ON founder_cognitive_load_events(tenant_id, recovery_recommended) WHERE recovery_recommended = TRUE;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE founder_cognitive_load_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cognitive_load_tenant_isolation ON founder_cognitive_load_events;
CREATE POLICY cognitive_load_tenant_isolation ON founder_cognitive_load_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record cognitive load event
DROP FUNCTION IF EXISTS record_cognitive_load CASCADE;
CREATE OR REPLACE FUNCTION record_cognitive_load(
  p_tenant_id UUID,
  p_signal_type cognitive_load_signal_type,
  p_signal_value NUMERIC,
  p_intensity cognitive_load_intensity DEFAULT NULL,
  p_context TEXT DEFAULT NULL,
  p_contributing_factors JSONB DEFAULT '[]'::jsonb,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_load_id UUID;
  v_calculated_load NUMERIC;
  v_intensity cognitive_load_intensity;
  v_recovery_recommended BOOLEAN := FALSE;
  v_recovery_action TEXT := NULL;
BEGIN
  -- Auto-calculate load score if not provided
  v_calculated_load := LEAST(p_signal_value, 100);

  -- Auto-detect intensity if not provided
  IF p_intensity IS NULL THEN
    IF v_calculated_load >= 90 THEN
      v_intensity := 'overload';
    ELSIF v_calculated_load >= 75 THEN
      v_intensity := 'extreme';
    ELSIF v_calculated_load >= 60 THEN
      v_intensity := 'high';
    ELSIF v_calculated_load >= 40 THEN
      v_intensity := 'moderate';
    ELSIF v_calculated_load >= 20 THEN
      v_intensity := 'low';
    ELSE
      v_intensity := 'minimal';
    END IF;
  ELSE
    v_intensity := p_intensity;
  END IF;

  -- Determine recovery recommendation
  IF v_intensity IN ('extreme', 'overload') THEN
    v_recovery_recommended := TRUE;
    v_recovery_action := 'Immediate break recommended - 15+ minutes';
  ELSIF v_intensity = 'high' THEN
    v_recovery_recommended := TRUE;
    v_recovery_action := 'Short break recommended - 5-10 minutes';
  END IF;

  INSERT INTO founder_cognitive_load_events (
    tenant_id,
    intensity,
    calculated_load,
    signal_type,
    signal_value,
    context,
    contributing_factors,
    recovery_recommended,
    recovery_action,
    metadata
  )
  VALUES (
    p_tenant_id,
    v_intensity,
    v_calculated_load,
    p_signal_type,
    p_signal_value,
    p_context,
    p_contributing_factors,
    v_recovery_recommended,
    v_recovery_action,
    p_metadata
  )
  RETURNING id INTO v_load_id;

  RETURN v_load_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List cognitive load events
DROP FUNCTION IF EXISTS list_cognitive_load_events CASCADE;
CREATE OR REPLACE FUNCTION list_cognitive_load_events(
  p_tenant_id UUID,
  p_intensity cognitive_load_intensity DEFAULT NULL,
  p_signal_type cognitive_load_signal_type DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF founder_cognitive_load_events AS $$
BEGIN
  RETURN QUERY
  SELECT cle.*
  FROM founder_cognitive_load_events cle
  WHERE cle.tenant_id = p_tenant_id
    AND (p_intensity IS NULL OR cle.intensity = p_intensity)
    AND (p_signal_type IS NULL OR cle.signal_type = p_signal_type)
    AND (p_start_date IS NULL OR cle.created_at >= p_start_date)
    AND (p_end_date IS NULL OR cle.created_at <= p_end_date)
  ORDER BY cle.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get cognitive load summary
DROP FUNCTION IF EXISTS get_cognitive_load_summary CASCADE;
CREATE OR REPLACE FUNCTION get_cognitive_load_summary(
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
    'total_events', COUNT(*),
    'avg_load', ROUND(AVG(calculated_load), 2),
    'max_load', MAX(calculated_load),
    'overload_events', COUNT(*) FILTER (WHERE intensity = 'overload'),
    'high_load_events', COUNT(*) FILTER (WHERE intensity IN ('extreme', 'high')),
    'recovery_recommended_count', COUNT(*) FILTER (WHERE recovery_recommended = TRUE),
    'by_intensity', (
      SELECT jsonb_object_agg(intensity, count)
      FROM (
        SELECT intensity, COUNT(*)::integer as count
        FROM founder_cognitive_load_events
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY intensity
      ) intensity_counts
    ),
    'by_signal_type', (
      SELECT jsonb_object_agg(signal_type, count)
      FROM (
        SELECT signal_type, COUNT(*)::integer as count
        FROM founder_cognitive_load_events
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY signal_type
      ) signal_counts
    ),
    'load_trend', (
      SELECT jsonb_agg(
        jsonb_build_object(
          'hour', hour,
          'avg_load', avg_load
        ) ORDER BY hour DESC
      )
      FROM (
        SELECT
          DATE_TRUNC('hour', created_at) as hour,
          ROUND(AVG(calculated_load), 2) as avg_load
        FROM founder_cognitive_load_events
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY DATE_TRUNC('hour', created_at)
        ORDER BY hour DESC
        LIMIT 24
      ) hourly_trend
    )
  ) INTO v_summary
  FROM founder_cognitive_load_events
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get current cognitive load level
DROP FUNCTION IF EXISTS get_current_cognitive_load CASCADE;
CREATE OR REPLACE FUNCTION get_current_cognitive_load(
  p_tenant_id UUID,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
  v_load JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_window_minutes || ' minutes')::interval;

  SELECT jsonb_build_object(
    'current_avg_load', ROUND(AVG(calculated_load), 2),
    'current_max_load', MAX(calculated_load),
    'current_intensity', (
      SELECT intensity
      FROM founder_cognitive_load_events
      WHERE tenant_id = p_tenant_id
        AND created_at >= v_since
      ORDER BY created_at DESC
      LIMIT 1
    ),
    'recent_events', COUNT(*),
    'recovery_needed', (
      COUNT(*) FILTER (WHERE recovery_recommended = TRUE) > 0
    ),
    'latest_recovery_action', (
      SELECT recovery_action
      FROM founder_cognitive_load_events
      WHERE tenant_id = p_tenant_id
        AND created_at >= v_since
        AND recovery_recommended = TRUE
      ORDER BY created_at DESC
      LIMIT 1
    )
  ) INTO v_load
  FROM founder_cognitive_load_events
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_since;

  RETURN v_load;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE founder_cognitive_load_events IS 'F09: Mental load tracking from multi-source signals';
COMMENT ON FUNCTION record_cognitive_load IS 'F09: Record cognitive load event with auto-intensity detection';
COMMENT ON FUNCTION list_cognitive_load_events IS 'F09: List cognitive load events with filters';
COMMENT ON FUNCTION get_cognitive_load_summary IS 'F09: Get aggregated cognitive load summary';
COMMENT ON FUNCTION get_current_cognitive_load IS 'F09: Get current cognitive load level within time window';
