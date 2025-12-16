-- =====================================================
-- Migration: 545_time_block_orchestrator.sql
-- Phase: F07 - Time-Block Orchestrator
-- Description: Time block planning, adherence tracking, and outcome quality measurement
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE time_block_category AS ENUM (
    'deep_work',
    'meetings',
    'admin',
    'strategic',
    'learning',
    'breaks',
    'family',
    'health',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE time_block_adherence AS ENUM (
    'perfect',
    'mostly_adhered',
    'partially_adhered',
    'not_adhered',
    'rescheduled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Time Blocks
DROP TABLE IF EXISTS time_blocks CASCADE;
CREATE TABLE time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  category time_block_category NOT NULL DEFAULT 'other',
  planned_start TIMESTAMPTZ NOT NULL,
  planned_end TIMESTAMPTZ NOT NULL,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  adherence time_block_adherence,
  outcome_quality NUMERIC CHECK (outcome_quality >= 0 AND outcome_quality <= 100),
  energy_level NUMERIC CHECK (energy_level >= 0 AND energy_level <= 100),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_time_blocks_tenant ON time_blocks(tenant_id, planned_start DESC);
CREATE INDEX idx_time_blocks_category ON time_blocks(tenant_id, category);
CREATE INDEX idx_time_blocks_adherence ON time_blocks(tenant_id, adherence);
CREATE INDEX idx_time_blocks_quality ON time_blocks(tenant_id, outcome_quality DESC NULLS LAST);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS time_blocks_tenant_isolation ON time_blocks;
CREATE POLICY time_blocks_tenant_isolation ON time_blocks
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record time block
DROP FUNCTION IF EXISTS record_time_block CASCADE;
CREATE OR REPLACE FUNCTION record_time_block(
  p_tenant_id UUID,
  p_label TEXT,
  p_planned_start TIMESTAMPTZ,
  p_planned_end TIMESTAMPTZ,
  p_category time_block_category DEFAULT 'other',
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_block_id UUID;
BEGIN
  INSERT INTO time_blocks (
    tenant_id,
    label,
    category,
    planned_start,
    planned_end,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_label,
    p_category,
    p_planned_start,
    p_planned_end,
    p_metadata
  )
  RETURNING id INTO v_block_id;

  RETURN v_block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update time block completion
DROP FUNCTION IF EXISTS complete_time_block CASCADE;
CREATE OR REPLACE FUNCTION complete_time_block(
  p_block_id UUID,
  p_actual_start TIMESTAMPTZ,
  p_actual_end TIMESTAMPTZ,
  p_adherence time_block_adherence DEFAULT NULL,
  p_outcome_quality NUMERIC DEFAULT NULL,
  p_energy_level NUMERIC DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_adherence time_block_adherence;
  v_planned_start TIMESTAMPTZ;
  v_planned_end TIMESTAMPTZ;
  v_start_diff INTEGER;
  v_end_diff INTEGER;
BEGIN
  -- Get planned times
  SELECT planned_start, planned_end INTO v_planned_start, v_planned_end
  FROM time_blocks
  WHERE id = p_block_id;

  -- Auto-calculate adherence if not provided
  IF p_adherence IS NULL THEN
    v_start_diff := ABS(EXTRACT(EPOCH FROM (p_actual_start - v_planned_start)) / 60);
    v_end_diff := ABS(EXTRACT(EPOCH FROM (p_actual_end - v_planned_end)) / 60);

    IF v_start_diff <= 5 AND v_end_diff <= 5 THEN
      v_adherence := 'perfect';
    ELSIF v_start_diff <= 15 AND v_end_diff <= 15 THEN
      v_adherence := 'mostly_adhered';
    ELSIF v_start_diff <= 30 OR v_end_diff <= 30 THEN
      v_adherence := 'partially_adhered';
    ELSE
      v_adherence := 'not_adhered';
    END IF;
  ELSE
    v_adherence := p_adherence;
  END IF;

  UPDATE time_blocks
  SET
    actual_start = p_actual_start,
    actual_end = p_actual_end,
    adherence = v_adherence,
    outcome_quality = p_outcome_quality,
    energy_level = p_energy_level,
    notes = p_notes,
    updated_at = now()
  WHERE id = p_block_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List time blocks
DROP FUNCTION IF EXISTS list_time_blocks CASCADE;
CREATE OR REPLACE FUNCTION list_time_blocks(
  p_tenant_id UUID,
  p_category time_block_category DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF time_blocks AS $$
BEGIN
  RETURN QUERY
  SELECT tb.*
  FROM time_blocks tb
  WHERE tb.tenant_id = p_tenant_id
    AND (p_category IS NULL OR tb.category = p_category)
    AND (p_start_date IS NULL OR tb.planned_start >= p_start_date)
    AND (p_end_date IS NULL OR tb.planned_end <= p_end_date)
  ORDER BY tb.planned_start DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get time block summary
DROP FUNCTION IF EXISTS get_time_block_summary CASCADE;
CREATE OR REPLACE FUNCTION get_time_block_summary(
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
    'total_blocks', COUNT(*),
    'completed_blocks', COUNT(*) FILTER (WHERE actual_end IS NOT NULL),
    'avg_outcome_quality', ROUND(AVG(outcome_quality), 2),
    'avg_energy_level', ROUND(AVG(energy_level), 2),
    'adherence_rate', ROUND(
      (COUNT(*) FILTER (WHERE adherence IN ('perfect', 'mostly_adhered'))::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE adherence IS NOT NULL), 0)) * 100,
      2
    ),
    'by_category', (
      SELECT jsonb_object_agg(category, count)
      FROM (
        SELECT category, COUNT(*)::integer as count
        FROM time_blocks
        WHERE tenant_id = p_tenant_id
          AND planned_start >= v_since
        GROUP BY category
      ) category_counts
    ),
    'by_adherence', (
      SELECT jsonb_object_agg(adherence, count)
      FROM (
        SELECT adherence, COUNT(*)::integer as count
        FROM time_blocks
        WHERE tenant_id = p_tenant_id
          AND planned_start >= v_since
          AND adherence IS NOT NULL
        GROUP BY adherence
      ) adherence_counts
    ),
    'total_planned_hours', (
      SELECT ROUND(SUM(EXTRACT(EPOCH FROM (planned_end - planned_start)) / 3600), 2)
      FROM time_blocks
      WHERE tenant_id = p_tenant_id
        AND planned_start >= v_since
    ),
    'total_actual_hours', (
      SELECT ROUND(SUM(EXTRACT(EPOCH FROM (actual_end - actual_start)) / 3600), 2)
      FROM time_blocks
      WHERE tenant_id = p_tenant_id
        AND planned_start >= v_since
        AND actual_end IS NOT NULL
    )
  ) INTO v_summary
  FROM time_blocks
  WHERE tenant_id = p_tenant_id
    AND planned_start >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE time_blocks IS 'F07: Time block planning and adherence tracking';
COMMENT ON FUNCTION record_time_block IS 'F07: Create a planned time block';
COMMENT ON FUNCTION complete_time_block IS 'F07: Complete time block with adherence auto-calculation';
COMMENT ON FUNCTION list_time_blocks IS 'F07: List time blocks with filters';
COMMENT ON FUNCTION get_time_block_summary IS 'F07: Get aggregated time block summary';
