-- =====================================================
-- Migration: 544_distraction_shield.sql
-- Phase: F06 - Distraction Shield
-- Description: Distraction event tracking with source analysis and mitigation tracking
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE distraction_source AS ENUM (
    'slack',
    'email',
    'phone',
    'meeting',
    'employee',
    'client',
    'internal_thought',
    'notification',
    'social_media',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE distraction_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Distraction Events
DROP TABLE IF EXISTS distraction_events CASCADE;
CREATE TABLE distraction_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source distraction_source NOT NULL DEFAULT 'other',
  severity distraction_severity NOT NULL DEFAULT 'low',
  description TEXT,
  context TEXT,
  mitigation_applied TEXT,
  recovery_time_mins INTEGER,
  prevented BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_distraction_events_tenant ON distraction_events(tenant_id, created_at DESC);
CREATE INDEX idx_distraction_events_source ON distraction_events(tenant_id, source);
CREATE INDEX idx_distraction_events_severity ON distraction_events(tenant_id, severity);
CREATE INDEX idx_distraction_events_prevented ON distraction_events(tenant_id, prevented);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE distraction_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS distraction_events_tenant_isolation ON distraction_events;
CREATE POLICY distraction_events_tenant_isolation ON distraction_events
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record distraction event
DROP FUNCTION IF EXISTS record_distraction_event CASCADE;
CREATE OR REPLACE FUNCTION record_distraction_event(
  p_tenant_id UUID,
  p_source distraction_source,
  p_severity distraction_severity DEFAULT 'low',
  p_description TEXT DEFAULT NULL,
  p_context TEXT DEFAULT NULL,
  p_mitigation_applied TEXT DEFAULT NULL,
  p_recovery_time_mins INTEGER DEFAULT NULL,
  p_prevented BOOLEAN DEFAULT FALSE,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO distraction_events (
    tenant_id,
    source,
    severity,
    description,
    context,
    mitigation_applied,
    recovery_time_mins,
    prevented,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_source,
    p_severity,
    p_description,
    p_context,
    p_mitigation_applied,
    p_recovery_time_mins,
    p_prevented,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List distraction events
DROP FUNCTION IF EXISTS list_distraction_events CASCADE;
CREATE OR REPLACE FUNCTION list_distraction_events(
  p_tenant_id UUID,
  p_source distraction_source DEFAULT NULL,
  p_severity distraction_severity DEFAULT NULL,
  p_prevented BOOLEAN DEFAULT NULL,
  p_hours INTEGER DEFAULT 24,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF distraction_events AS $$
DECLARE
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_hours || ' hours')::interval;

  RETURN QUERY
  SELECT de.*
  FROM distraction_events de
  WHERE de.tenant_id = p_tenant_id
    AND de.created_at >= v_since
    AND (p_source IS NULL OR de.source = p_source)
    AND (p_severity IS NULL OR de.severity = p_severity)
    AND (p_prevented IS NULL OR de.prevented = p_prevented)
  ORDER BY de.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get distraction summary
DROP FUNCTION IF EXISTS get_distraction_summary CASCADE;
CREATE OR REPLACE FUNCTION get_distraction_summary(
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
    'total_distractions', COUNT(*),
    'prevented_count', COUNT(*) FILTER (WHERE prevented = TRUE),
    'prevention_rate', ROUND(
      (COUNT(*) FILTER (WHERE prevented = TRUE)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ),
    'avg_recovery_time_mins', ROUND(AVG(recovery_time_mins), 2),
    'total_recovery_time_hours', ROUND(SUM(recovery_time_mins) / 60.0, 2),
    'by_source', (
      SELECT jsonb_object_agg(source, count)
      FROM (
        SELECT source, COUNT(*)::integer as count
        FROM distraction_events
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY source
        ORDER BY count DESC
      ) source_counts
    ),
    'by_severity', (
      SELECT jsonb_object_agg(severity, count)
      FROM (
        SELECT severity, COUNT(*)::integer as count
        FROM distraction_events
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY severity
      ) severity_counts
    ),
    'top_sources', (
      SELECT json_agg(
        json_build_object(
          'source', source,
          'count', count,
          'avg_recovery_mins', avg_recovery
        )
      )
      FROM (
        SELECT
          source,
          COUNT(*)::integer as count,
          ROUND(AVG(recovery_time_mins), 2) as avg_recovery
        FROM distraction_events
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY source
        ORDER BY count DESC
        LIMIT 5
      ) top
    )
  ) INTO v_summary
  FROM distraction_events
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE distraction_events IS 'F06: Distraction event tracking with mitigation monitoring';
COMMENT ON FUNCTION record_distraction_event IS 'F06: Record a distraction event';
COMMENT ON FUNCTION list_distraction_events IS 'F06: List distraction events with filters';
COMMENT ON FUNCTION get_distraction_summary IS 'F06: Get aggregated distraction summary';
