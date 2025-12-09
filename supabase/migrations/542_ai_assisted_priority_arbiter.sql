-- =====================================================
-- Migration: 542_ai_assisted_priority_arbiter.sql
-- Phase: F04 - AI-Assisted Priority Arbiter
-- Description: Priority decisions synthesized from signals, trends, and load
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- TABLES
-- ============================================

-- Priority Decisions
DROP TABLE IF EXISTS priority_decisions CASCADE;
CREATE TABLE priority_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_code TEXT NOT NULL,
  context TEXT NOT NULL,
  recommendation TEXT,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 100),
  reasoning TEXT,
  signals_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  human_override BOOLEAN DEFAULT FALSE,
  final_priority INTEGER CHECK (final_priority >= 0 AND final_priority <= 100),
  decided_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, decision_code)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_priority_decisions_tenant ON priority_decisions(tenant_id, decided_at DESC);
CREATE INDEX idx_priority_decisions_override ON priority_decisions(tenant_id, human_override);
CREATE INDEX idx_priority_decisions_confidence ON priority_decisions(tenant_id, confidence DESC);
CREATE INDEX idx_priority_decisions_priority ON priority_decisions(tenant_id, final_priority DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE priority_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS priority_decisions_tenant_isolation ON priority_decisions;
CREATE POLICY priority_decisions_tenant_isolation ON priority_decisions
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record priority decision
DROP FUNCTION IF EXISTS record_priority_decision CASCADE;
CREATE OR REPLACE FUNCTION record_priority_decision(
  p_tenant_id UUID,
  p_decision_code TEXT,
  p_context TEXT,
  p_recommendation TEXT DEFAULT NULL,
  p_confidence NUMERIC DEFAULT NULL,
  p_reasoning TEXT DEFAULT NULL,
  p_signals_used TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_final_priority INTEGER DEFAULT NULL,
  p_human_override BOOLEAN DEFAULT FALSE,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_decision_id UUID;
BEGIN
  INSERT INTO priority_decisions (
    tenant_id,
    decision_code,
    context,
    recommendation,
    confidence,
    reasoning,
    signals_used,
    final_priority,
    human_override,
    decided_at,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_decision_code,
    p_context,
    p_recommendation,
    p_confidence,
    p_reasoning,
    p_signals_used,
    p_final_priority,
    p_human_override,
    CASE WHEN p_final_priority IS NOT NULL THEN now() ELSE NULL END,
    p_metadata
  )
  ON CONFLICT (tenant_id, decision_code) DO UPDATE
    SET context = EXCLUDED.context,
        recommendation = EXCLUDED.recommendation,
        confidence = EXCLUDED.confidence,
        reasoning = EXCLUDED.reasoning,
        signals_used = EXCLUDED.signals_used,
        final_priority = EXCLUDED.final_priority,
        human_override = EXCLUDED.human_override,
        decided_at = EXCLUDED.decided_at,
        metadata = EXCLUDED.metadata,
        updated_at = now()
  RETURNING id INTO v_decision_id;

  RETURN v_decision_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List priority decisions
DROP FUNCTION IF EXISTS list_priority_decisions CASCADE;
CREATE OR REPLACE FUNCTION list_priority_decisions(
  p_tenant_id UUID,
  p_human_override BOOLEAN DEFAULT NULL,
  p_decided BOOLEAN DEFAULT NULL,
  p_limit INTEGER DEFAULT 300
)
RETURNS SETOF priority_decisions AS $$
BEGIN
  RETURN QUERY
  SELECT pd.*
  FROM priority_decisions pd
  WHERE pd.tenant_id = p_tenant_id
    AND (p_human_override IS NULL OR pd.human_override = p_human_override)
    AND (p_decided IS NULL OR (p_decided = TRUE AND pd.decided_at IS NOT NULL) OR (p_decided = FALSE AND pd.decided_at IS NULL))
  ORDER BY pd.final_priority DESC NULLS LAST, pd.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get priority summary
DROP FUNCTION IF EXISTS get_priority_summary CASCADE;
CREATE OR REPLACE FUNCTION get_priority_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_summary JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_decisions', COUNT(*),
    'decided_count', COUNT(*) FILTER (WHERE decided_at IS NOT NULL),
    'pending_count', COUNT(*) FILTER (WHERE decided_at IS NULL),
    'human_override_count', COUNT(*) FILTER (WHERE human_override = TRUE),
    'avg_confidence', ROUND(AVG(confidence), 2),
    'avg_final_priority', ROUND(AVG(final_priority), 2),
    'high_priority_count', COUNT(*) FILTER (WHERE final_priority >= 80),
    'low_confidence_count', COUNT(*) FILTER (WHERE confidence < 50),
    'recent_decisions', (
      SELECT json_agg(
        json_build_object(
          'decision_code', decision_code,
          'context', context,
          'final_priority', final_priority,
          'confidence', confidence,
          'decided_at', decided_at
        )
      )
      FROM (
        SELECT decision_code, context, final_priority, confidence, decided_at
        FROM priority_decisions
        WHERE tenant_id = p_tenant_id
          AND decided_at IS NOT NULL
        ORDER BY decided_at DESC
        LIMIT 10
      ) recent
    )
  ) INTO v_summary
  FROM priority_decisions
  WHERE tenant_id = p_tenant_id;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE priority_decisions IS 'F04: AI-assisted priority decisions with confidence scoring';
COMMENT ON FUNCTION record_priority_decision IS 'F04: Record or update a priority decision';
COMMENT ON FUNCTION list_priority_decisions IS 'F04: List priority decisions with optional filters';
COMMENT ON FUNCTION get_priority_summary IS 'F04: Get aggregated priority decision summary';
