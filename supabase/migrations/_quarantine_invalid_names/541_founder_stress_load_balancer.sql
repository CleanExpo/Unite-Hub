-- =====================================================
-- Migration: 541_founder_stress_load_balancer.sql
-- Phase: F03 - Founder Stress Load Balancer
-- Description: Perceived and calculated load tracking on founder and key streams
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE load_source AS ENUM (
    'task_volume',
    'decision_complexity',
    'time_pressure',
    'cognitive_load',
    'external_interrupt',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Founder Load Events
DROP TABLE IF EXISTS founder_load_events CASCADE;
CREATE TABLE founder_load_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stream_code TEXT,
  load_source load_source NOT NULL DEFAULT 'other',
  perceived_load NUMERIC CHECK (perceived_load >= 0 AND perceived_load <= 100),
  calculated_load NUMERIC CHECK (calculated_load >= 0 AND calculated_load <= 100),
  load_delta NUMERIC,
  resolution TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_founder_load_events_tenant ON founder_load_events(tenant_id, recorded_at DESC);
CREATE INDEX idx_founder_load_events_stream ON founder_load_events(tenant_id, stream_code, recorded_at DESC);
CREATE INDEX idx_founder_load_events_source ON founder_load_events(tenant_id, load_source);
CREATE INDEX idx_founder_load_events_high_load ON founder_load_events(tenant_id, calculated_load DESC) WHERE calculated_load >= 70;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE founder_load_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_load_events_tenant_isolation ON founder_load_events;
CREATE POLICY founder_load_events_tenant_isolation ON founder_load_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record load event
DROP FUNCTION IF EXISTS record_load_event CASCADE;
CREATE OR REPLACE FUNCTION record_load_event(
  p_tenant_id UUID,
  p_stream_code TEXT DEFAULT NULL,
  p_load_source load_source DEFAULT 'other',
  p_perceived_load NUMERIC DEFAULT NULL,
  p_calculated_load NUMERIC DEFAULT NULL,
  p_resolution TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_load_delta NUMERIC;
BEGIN
  -- Calculate delta if both values present
  IF p_perceived_load IS NOT NULL AND p_calculated_load IS NOT NULL THEN
    v_load_delta := p_perceived_load - p_calculated_load;
  ELSE
    v_load_delta := NULL;
  END IF;

  INSERT INTO founder_load_events (
    tenant_id,
    stream_code,
    load_source,
    perceived_load,
    calculated_load,
    load_delta,
    resolution,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_stream_code,
    p_load_source,
    p_perceived_load,
    p_calculated_load,
    v_load_delta,
    p_resolution,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List load events
DROP FUNCTION IF EXISTS list_load_events CASCADE;
CREATE OR REPLACE FUNCTION list_load_events(
  p_tenant_id UUID,
  p_stream_code TEXT DEFAULT NULL,
  p_load_source load_source DEFAULT NULL,
  p_hours INTEGER DEFAULT 24,
  p_limit INTEGER DEFAULT 500
)
RETURNS SETOF founder_load_events AS $$
DECLARE
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_hours || ' hours')::interval;

  RETURN QUERY
  SELECT fle.*
  FROM founder_load_events fle
  WHERE fle.tenant_id = p_tenant_id
    AND fle.recorded_at >= v_since
    AND (p_stream_code IS NULL OR fle.stream_code = p_stream_code)
    AND (p_load_source IS NULL OR fle.load_source = p_load_source)
  ORDER BY fle.recorded_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get load summary
DROP FUNCTION IF EXISTS get_load_summary CASCADE;
CREATE OR REPLACE FUNCTION get_load_summary(
  p_tenant_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_hours || ' hours')::interval;

  SELECT jsonb_build_object(
    'total_events', COUNT(*),
    'avg_perceived_load', ROUND(AVG(perceived_load), 2),
    'avg_calculated_load', ROUND(AVG(calculated_load), 2),
    'avg_load_delta', ROUND(AVG(load_delta), 2),
    'high_load_events', COUNT(*) FILTER (WHERE calculated_load >= 70),
    'by_source', (
      SELECT jsonb_object_agg(load_source, count)
      FROM (
        SELECT load_source, COUNT(*)::integer as count
        FROM founder_load_events
        WHERE tenant_id = p_tenant_id
          AND recorded_at >= v_since
        GROUP BY load_source
      ) source_counts
    ),
    'by_stream', (
      SELECT jsonb_object_agg(stream_code, avg_load)
      FROM (
        SELECT stream_code, ROUND(AVG(calculated_load), 2) as avg_load
        FROM founder_load_events
        WHERE tenant_id = p_tenant_id
          AND recorded_at >= v_since
          AND stream_code IS NOT NULL
        GROUP BY stream_code
      ) stream_loads
    )
  ) INTO v_summary
  FROM founder_load_events
  WHERE tenant_id = p_tenant_id
    AND recorded_at >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get stream load (specific stream stats)
DROP FUNCTION IF EXISTS get_stream_load CASCADE;
CREATE OR REPLACE FUNCTION get_stream_load(
  p_tenant_id UUID,
  p_stream_code TEXT,
  p_hours INTEGER DEFAULT 24
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_hours || ' hours')::interval;

  SELECT jsonb_build_object(
    'stream_code', p_stream_code,
    'event_count', COUNT(*),
    'avg_perceived_load', ROUND(AVG(perceived_load), 2),
    'avg_calculated_load', ROUND(AVG(calculated_load), 2),
    'max_calculated_load', MAX(calculated_load),
    'latest_load', (
      SELECT calculated_load
      FROM founder_load_events
      WHERE tenant_id = p_tenant_id
        AND stream_code = p_stream_code
      ORDER BY recorded_at DESC
      LIMIT 1
    )
  ) INTO v_result
  FROM founder_load_events
  WHERE tenant_id = p_tenant_id
    AND stream_code = p_stream_code
    AND recorded_at >= v_since;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE founder_load_events IS 'F03: Load tracking events for founder stress monitoring';
COMMENT ON FUNCTION record_load_event IS 'F03: Record a load event with automatic delta calculation';
COMMENT ON FUNCTION list_load_events IS 'F03: List load events with optional filters';
COMMENT ON FUNCTION get_load_summary IS 'F03: Get aggregated load summary across all streams';
COMMENT ON FUNCTION get_stream_load IS 'F03: Get load statistics for a specific stream';
