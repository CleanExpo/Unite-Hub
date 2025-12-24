-- =====================================================
-- Migration: 543_founder_focus_engine.sql
-- Phase: F05 - Founder Focus Engine
-- Description: Focus session tracking with depth scoring and interruption monitoring
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE focus_category AS ENUM (
    'deep_work',
    'strategic_thinking',
    'review',
    'admin',
    'sales',
    'meetings',
    'learning',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE focus_status AS ENUM (
    'planned',
    'active',
    'completed',
    'abandoned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Focus Sessions
DROP TABLE IF EXISTS founder_focus_sessions CASCADE;
CREATE TABLE founder_focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category focus_category NOT NULL DEFAULT 'other',
  status focus_status NOT NULL DEFAULT 'planned',
  depth_score NUMERIC CHECK (depth_score >= 0 AND depth_score <= 100),
  planned_start TIMESTAMPTZ,
  planned_end TIMESTAMPTZ,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  interruptions INTEGER DEFAULT 0,
  outcome_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_founder_focus_sessions_tenant ON founder_focus_sessions(tenant_id, actual_start DESC NULLS LAST);
CREATE INDEX idx_founder_focus_sessions_status ON founder_focus_sessions(tenant_id, status);
CREATE INDEX idx_founder_focus_sessions_category ON founder_focus_sessions(tenant_id, category);
CREATE INDEX idx_founder_focus_sessions_depth ON founder_focus_sessions(tenant_id, depth_score DESC NULLS LAST);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE founder_focus_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS founder_focus_sessions_tenant_isolation ON founder_focus_sessions;
CREATE POLICY founder_focus_sessions_tenant_isolation ON founder_focus_sessions
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record focus session
DROP FUNCTION IF EXISTS record_focus_session CASCADE;
CREATE OR REPLACE FUNCTION record_focus_session(
  p_tenant_id UUID,
  p_label TEXT,
  p_category focus_category DEFAULT 'other',
  p_status focus_status DEFAULT 'planned',
  p_depth_score NUMERIC DEFAULT NULL,
  p_planned_start TIMESTAMPTZ DEFAULT NULL,
  p_planned_end TIMESTAMPTZ DEFAULT NULL,
  p_actual_start TIMESTAMPTZ DEFAULT NULL,
  p_actual_end TIMESTAMPTZ DEFAULT NULL,
  p_interruptions INTEGER DEFAULT 0,
  p_outcome_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO founder_focus_sessions (
    tenant_id,
    label,
    category,
    status,
    depth_score,
    planned_start,
    planned_end,
    actual_start,
    actual_end,
    interruptions,
    outcome_notes,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_label,
    p_category,
    p_status,
    p_depth_score,
    p_planned_start,
    p_planned_end,
    p_actual_start,
    p_actual_end,
    p_interruptions,
    p_outcome_notes,
    p_metadata
  )
  RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update focus session
DROP FUNCTION IF EXISTS update_focus_session CASCADE;
CREATE OR REPLACE FUNCTION update_focus_session(
  p_session_id UUID,
  p_status focus_status DEFAULT NULL,
  p_depth_score NUMERIC DEFAULT NULL,
  p_actual_start TIMESTAMPTZ DEFAULT NULL,
  p_actual_end TIMESTAMPTZ DEFAULT NULL,
  p_interruptions INTEGER DEFAULT NULL,
  p_outcome_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE founder_focus_sessions
  SET
    status = COALESCE(p_status, status),
    depth_score = COALESCE(p_depth_score, depth_score),
    actual_start = COALESCE(p_actual_start, actual_start),
    actual_end = COALESCE(p_actual_end, actual_end),
    interruptions = COALESCE(p_interruptions, interruptions),
    outcome_notes = COALESCE(p_outcome_notes, outcome_notes),
    updated_at = now()
  WHERE id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List focus sessions
DROP FUNCTION IF EXISTS list_focus_sessions CASCADE;
CREATE OR REPLACE FUNCTION list_focus_sessions(
  p_tenant_id UUID,
  p_category focus_category DEFAULT NULL,
  p_status focus_status DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF founder_focus_sessions AS $$
BEGIN
  RETURN QUERY
  SELECT ffs.*
  FROM founder_focus_sessions ffs
  WHERE ffs.tenant_id = p_tenant_id
    AND (p_category IS NULL OR ffs.category = p_category)
    AND (p_status IS NULL OR ffs.status = p_status)
  ORDER BY ffs.actual_start DESC NULLS LAST, ffs.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get focus summary
DROP FUNCTION IF EXISTS get_focus_summary CASCADE;
CREATE OR REPLACE FUNCTION get_focus_summary(
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
    'total_sessions', COUNT(*),
    'completed_sessions', COUNT(*) FILTER (WHERE status = 'completed'),
    'avg_depth_score', ROUND(AVG(depth_score), 2),
    'total_interruptions', SUM(interruptions),
    'avg_interruptions_per_session', ROUND(AVG(interruptions), 2),
    'by_category', (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*)::integer as count
        FROM founder_focus_sessions
        WHERE tenant_id = p_tenant_id
          AND actual_start >= v_since
        GROUP BY category
      ) category_counts
    ),
    'by_status', (
      SELECT jsonb_object_agg(status, count)
      FROM (
        SELECT status, COUNT(*)::integer as count
        FROM founder_focus_sessions
        WHERE tenant_id = p_tenant_id
          AND actual_start >= v_since
        GROUP BY status
      ) status_counts
    ),
    'total_focus_hours', (
      SELECT ROUND(SUM(EXTRACT(EPOCH FROM (actual_end - actual_start)) / 3600), 2)
      FROM founder_focus_sessions
      WHERE tenant_id = p_tenant_id
        AND actual_start >= v_since
        AND actual_end IS NOT NULL
    )
  ) INTO v_summary
  FROM founder_focus_sessions
  WHERE tenant_id = p_tenant_id
    AND actual_start >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE founder_focus_sessions IS 'F05: Focus session tracking with depth scoring';
COMMENT ON FUNCTION record_focus_session IS 'F05: Insert a new focus session';
COMMENT ON FUNCTION update_focus_session IS 'F05: Update focus session status and metrics';
COMMENT ON FUNCTION list_focus_sessions IS 'F05: List focus sessions with filters';
COMMENT ON FUNCTION get_focus_summary IS 'F05: Get aggregated focus summary';
