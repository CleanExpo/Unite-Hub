-- =====================================================
-- Migration: 549_founder_intent_router.sql
-- Phase: F11 - Founder Intent Router
-- Description: Intent signal interpretation and actionable routing
-- Created: 2025-12-09
-- =====================================================

-- ============================================
-- ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE founder_intent_type AS ENUM (
    'deep_work_request',
    'break_request',
    'meeting_request',
    'decision_needed',
    'review_needed',
    'planning_mode',
    'learning_mode',
    'admin_mode',
    'delegation_intent',
    'automation_intent',
    'clarification_needed',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE intent_confidence_level AS ENUM (
    'very_low',
    'low',
    'medium',
    'high',
    'very_high'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE intent_routing_status AS ENUM (
    'detected',
    'routed',
    'in_progress',
    'completed',
    'failed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- TABLES
-- ============================================

-- Intent Signals
DROP TABLE IF EXISTS founder_intent_signals CASCADE;
CREATE TABLE founder_intent_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  intent_type founder_intent_type NOT NULL DEFAULT 'other',
  confidence intent_confidence_level NOT NULL DEFAULT 'medium',
  confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 100),
  signal_source TEXT NOT NULL,
  signal_data JSONB DEFAULT '{}'::jsonb,
  interpretation TEXT,
  recommended_action TEXT,
  routed_to TEXT,
  routing_status intent_routing_status NOT NULL DEFAULT 'detected',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  routed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

DROP INDEX IF EXISTS idx_intent_signals_tenant;
CREATE INDEX idx_intent_signals_tenant ON founder_intent_signals(tenant_id, created_at DESC);

DROP INDEX IF EXISTS idx_intent_signals_type;
CREATE INDEX idx_intent_signals_type ON founder_intent_signals(tenant_id, intent_type);

DROP INDEX IF EXISTS idx_intent_signals_confidence;
CREATE INDEX idx_intent_signals_confidence ON founder_intent_signals(tenant_id, confidence_score DESC NULLS LAST);

DROP INDEX IF EXISTS idx_intent_signals_status;
CREATE INDEX idx_intent_signals_status ON founder_intent_signals(tenant_id, routing_status);

DROP INDEX IF EXISTS idx_intent_signals_routed_to;
CREATE INDEX idx_intent_signals_routed_to ON founder_intent_signals(tenant_id, routed_to);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE founder_intent_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS intent_signals_tenant_isolation ON founder_intent_signals;
CREATE POLICY intent_signals_tenant_isolation ON founder_intent_signals
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- ============================================
-- FUNCTIONS
-- ============================================

-- Record intent signal
DROP FUNCTION IF EXISTS record_intent_signal CASCADE;
CREATE OR REPLACE FUNCTION record_intent_signal(
  p_tenant_id UUID,
  p_intent_type founder_intent_type,
  p_signal_source TEXT,
  p_signal_data JSONB,
  p_confidence_score NUMERIC DEFAULT NULL,
  p_confidence intent_confidence_level DEFAULT NULL,
  p_interpretation TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_signal_id UUID;
  v_confidence intent_confidence_level;
  v_recommended_action TEXT;
  v_routed_to TEXT;
BEGIN
  -- Auto-detect confidence level if not provided
  IF p_confidence IS NULL AND p_confidence_score IS NOT NULL THEN
    IF p_confidence_score >= 80 THEN
      v_confidence := 'very_high';
    ELSIF p_confidence_score >= 60 THEN
      v_confidence := 'high';
    ELSIF p_confidence_score >= 40 THEN
      v_confidence := 'medium';
    ELSIF p_confidence_score >= 20 THEN
      v_confidence := 'low';
    ELSE
      v_confidence := 'very_low';
    END IF;
  ELSIF p_confidence IS NOT NULL THEN
    v_confidence := p_confidence;
  ELSE
    v_confidence := 'medium';
  END IF;

  -- Auto-generate recommended action based on intent type
  CASE p_intent_type
    WHEN 'deep_work_request' THEN
      v_recommended_action := 'Block 2-hour focus session, enable distraction shield';
      v_routed_to := 'focus_engine';
    WHEN 'break_request' THEN
      v_recommended_action := 'Schedule 15-minute recovery break';
      v_routed_to := 'recovery_protocols';
    WHEN 'meeting_request' THEN
      v_recommended_action := 'Find optimal meeting slot based on energy patterns';
      v_routed_to := 'time_block_orchestrator';
    WHEN 'decision_needed' THEN
      v_recommended_action := 'Route to AI-assisted priority arbiter';
      v_routed_to := 'priority_arbiter';
    WHEN 'review_needed' THEN
      v_recommended_action := 'Add to ops graph review node';
      v_routed_to := 'ops_graph';
    WHEN 'planning_mode' THEN
      v_recommended_action := 'Enter strategic planning mode';
      v_routed_to := 'time_block_orchestrator';
    WHEN 'learning_mode' THEN
      v_recommended_action := 'Schedule learning block during moderate energy window';
      v_routed_to := 'energy_mapping';
    WHEN 'admin_mode' THEN
      v_recommended_action := 'Batch admin tasks during low energy window';
      v_routed_to := 'task_routing';
    WHEN 'delegation_intent' THEN
      v_recommended_action := 'Route to autonomous task queue';
      v_routed_to := 'task_routing';
    WHEN 'automation_intent' THEN
      v_recommended_action := 'Analyze for automation opportunity';
      v_routed_to := 'task_routing';
    ELSE
      v_recommended_action := 'Requires manual review';
      v_routed_to := 'manual_review';
  END CASE;

  INSERT INTO founder_intent_signals (
    tenant_id,
    intent_type,
    confidence,
    confidence_score,
    signal_source,
    signal_data,
    interpretation,
    recommended_action,
    routed_to,
    metadata
  )
  VALUES (
    p_tenant_id,
    p_intent_type,
    v_confidence,
    p_confidence_score,
    p_signal_source,
    p_signal_data,
    p_interpretation,
    v_recommended_action,
    v_routed_to,
    p_metadata
  )
  RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update intent routing status
DROP FUNCTION IF EXISTS update_intent_routing CASCADE;
CREATE OR REPLACE FUNCTION update_intent_routing(
  p_signal_id UUID,
  p_routing_status intent_routing_status,
  p_routed_to TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_routed_at TIMESTAMPTZ;
  v_completed_at TIMESTAMPTZ;
BEGIN
  -- Set timestamps based on status
  IF p_routing_status = 'routed' THEN
    v_routed_at := now();
  ELSIF p_routing_status = 'completed' THEN
    v_completed_at := now();
  END IF;

  UPDATE founder_intent_signals
  SET
    routing_status = p_routing_status,
    routed_to = COALESCE(p_routed_to, routed_to),
    routed_at = COALESCE(v_routed_at, routed_at),
    completed_at = COALESCE(v_completed_at, completed_at)
  WHERE id = p_signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List intent signals
DROP FUNCTION IF EXISTS list_intent_signals CASCADE;
CREATE OR REPLACE FUNCTION list_intent_signals(
  p_tenant_id UUID,
  p_intent_type founder_intent_type DEFAULT NULL,
  p_routing_status intent_routing_status DEFAULT NULL,
  p_routed_to TEXT DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF founder_intent_signals AS $$
BEGIN
  RETURN QUERY
  SELECT is_.*
  FROM founder_intent_signals is_
  WHERE is_.tenant_id = p_tenant_id
    AND (p_intent_type IS NULL OR is_.intent_type = p_intent_type)
    AND (p_routing_status IS NULL OR is_.routing_status = p_routing_status)
    AND (p_routed_to IS NULL OR is_.routed_to = p_routed_to)
    AND (p_start_date IS NULL OR is_.created_at >= p_start_date)
    AND (p_end_date IS NULL OR is_.created_at <= p_end_date)
  ORDER BY is_.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get intent routing summary
DROP FUNCTION IF EXISTS get_intent_routing_summary CASCADE;
CREATE OR REPLACE FUNCTION get_intent_routing_summary(
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
    'total_signals', COUNT(*),
    'avg_confidence', ROUND(AVG(confidence_score), 2),
    'high_confidence_count', COUNT(*) FILTER (WHERE confidence IN ('high', 'very_high')),
    'routed_count', COUNT(*) FILTER (WHERE routing_status IN ('routed', 'in_progress', 'completed')),
    'completed_count', COUNT(*) FILTER (WHERE routing_status = 'completed'),
    'by_intent_type', (
      SELECT jsonb_object_agg(intent_type, count)
      FROM (
        SELECT intent_type, COUNT(*)::integer as count
        FROM founder_intent_signals
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY intent_type
      ) intent_counts
    ),
    'by_routing_status', (
      SELECT jsonb_object_agg(routing_status, count)
      FROM (
        SELECT routing_status, COUNT(*)::integer as count
        FROM founder_intent_signals
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
        GROUP BY routing_status
      ) status_counts
    ),
    'by_routed_to', (
      SELECT jsonb_object_agg(routed_to, count)
      FROM (
        SELECT routed_to, COUNT(*)::integer as count
        FROM founder_intent_signals
        WHERE tenant_id = p_tenant_id
          AND created_at >= v_since
          AND routed_to IS NOT NULL
        GROUP BY routed_to
      ) routing_counts
    ),
    'avg_routing_time_mins', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (routed_at - created_at)) / 60), 2)
      FROM founder_intent_signals
      WHERE tenant_id = p_tenant_id
        AND created_at >= v_since
        AND routed_at IS NOT NULL
    ),
    'avg_completion_time_mins', (
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) / 60), 2)
      FROM founder_intent_signals
      WHERE tenant_id = p_tenant_id
        AND created_at >= v_since
        AND completed_at IS NOT NULL
    )
  ) INTO v_summary
  FROM founder_intent_signals
  WHERE tenant_id = p_tenant_id
    AND created_at >= v_since;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE founder_intent_signals IS 'F11: Intent signal interpretation and routing';
COMMENT ON FUNCTION record_intent_signal IS 'F11: Record intent with auto-routing recommendation';
COMMENT ON FUNCTION update_intent_routing IS 'F11: Update intent routing status';
COMMENT ON FUNCTION list_intent_signals IS 'F11: List intent signals with filters';
COMMENT ON FUNCTION get_intent_routing_summary IS 'F11: Get aggregated intent routing summary';
