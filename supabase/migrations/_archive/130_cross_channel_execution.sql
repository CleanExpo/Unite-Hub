-- Migration 130: Cross-Channel Publishing Execution Layer
-- Phase 87: Real posting with preflight checks, execution, and rollback

-- ============================================================================
-- Table 1: posting_preflight_checks
-- Stores safety, truth, fatigue, and policy checks before execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS posting_preflight_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  schedule_id UUID NOT NULL REFERENCES campaign_orchestration_schedules(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Channel
  channel TEXT NOT NULL CHECK (channel IN ('fb', 'ig', 'tiktok', 'linkedin', 'youtube', 'gmb', 'reddit', 'email', 'x')),

  -- Check results
  checks JSONB NOT NULL DEFAULT '{}'::jsonb,
  passed BOOLEAN NOT NULL,

  -- Individual check results
  early_warning_passed BOOLEAN NOT NULL DEFAULT true,
  performance_reality_passed BOOLEAN NOT NULL DEFAULT true,
  scaling_mode_passed BOOLEAN NOT NULL DEFAULT true,
  client_policy_passed BOOLEAN NOT NULL DEFAULT true,
  fatigue_check_passed BOOLEAN NOT NULL DEFAULT true,
  compliance_passed BOOLEAN NOT NULL DEFAULT true,
  truth_layer_passed BOOLEAN NOT NULL DEFAULT true,

  -- Scores
  confidence_score NUMERIC(3,2) DEFAULT 0.8,
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),

  -- Truth layer
  truth_notes TEXT,
  truth_compliant BOOLEAN NOT NULL DEFAULT true,

  -- Blocking reason
  blocked_by TEXT,
  block_reason TEXT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_preflight_schedule
  ON posting_preflight_checks(schedule_id);
CREATE INDEX IF NOT EXISTS idx_preflight_client
  ON posting_preflight_checks(client_id);
CREATE INDEX IF NOT EXISTS idx_preflight_workspace
  ON posting_preflight_checks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_preflight_passed
  ON posting_preflight_checks(passed);
CREATE INDEX IF NOT EXISTS idx_preflight_created
  ON posting_preflight_checks(created_at DESC);

-- ============================================================================
-- Table 2: posting_executions
-- Stores real posting executions and outcomes
-- ============================================================================

CREATE TABLE IF NOT EXISTS posting_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- References
  preflight_id UUID NOT NULL REFERENCES posting_preflight_checks(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL,
  client_id UUID NOT NULL,
  workspace_id UUID NOT NULL,

  -- Channel
  channel TEXT NOT NULL CHECK (channel IN ('fb', 'ig', 'tiktok', 'linkedin', 'youtube', 'gmb', 'reddit', 'email', 'x')),

  -- Execution status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'rolled_back')),

  -- Platform response
  external_post_id TEXT,
  external_url TEXT,
  platform_response JSONB,

  -- Execution details
  execution_payload JSONB,
  executed_at TIMESTAMPTZ,

  -- Error handling
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  -- Truth layer
  truth_notes TEXT,

  -- Override
  forced_by UUID,
  force_reason TEXT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_execution_preflight
  ON posting_executions(preflight_id);
CREATE INDEX IF NOT EXISTS idx_execution_schedule
  ON posting_executions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_execution_client
  ON posting_executions(client_id);
CREATE INDEX IF NOT EXISTS idx_execution_workspace
  ON posting_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_execution_status
  ON posting_executions(status);
CREATE INDEX IF NOT EXISTS idx_execution_created
  ON posting_executions(created_at DESC);

-- ============================================================================
-- Table 3: rollback_log
-- Stores rollback actions for post removal/retraction
-- ============================================================================

CREATE TABLE IF NOT EXISTS rollback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Reference
  execution_id UUID NOT NULL REFERENCES posting_executions(id) ON DELETE CASCADE,

  -- Channel
  channel TEXT NOT NULL CHECK (channel IN ('fb', 'ig', 'tiktok', 'linkedin', 'youtube', 'gmb', 'reddit', 'email', 'x')),

  -- Rollback details
  external_post_id TEXT,
  rollback_payload JSONB,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed', 'not_supported')),

  -- Timing
  attempted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Result
  platform_response JSONB,
  error_message TEXT,

  -- Audit
  requested_by UUID,
  reason TEXT,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rollback_execution
  ON rollback_log(execution_id);
CREATE INDEX IF NOT EXISTS idx_rollback_status
  ON rollback_log(status);
CREATE INDEX IF NOT EXISTS idx_rollback_created
  ON rollback_log(created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE posting_preflight_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rollback_log ENABLE ROW LEVEL SECURITY;

-- Preflight policies
CREATE POLICY "Users can view preflights in their workspace" ON posting_preflight_checks
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create preflights" ON posting_preflight_checks
  FOR INSERT WITH CHECK (true);

-- Execution policies
CREATE POLICY "Users can view executions in their workspace" ON posting_executions
  FOR SELECT USING (
    workspace_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage executions" ON posting_executions
  FOR ALL USING (true);

-- Rollback policies
CREATE POLICY "Users can view rollbacks" ON rollback_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posting_executions pe
      WHERE pe.id = rollback_log.execution_id
      AND pe.workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage rollbacks" ON rollback_log
  FOR ALL USING (true);

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Check if execution is safe based on preflight
CREATE OR REPLACE FUNCTION is_execution_safe(p_preflight_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_preflight posting_preflight_checks;
BEGIN
  SELECT * INTO v_preflight FROM posting_preflight_checks WHERE id = p_preflight_id;

  IF v_preflight.id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN v_preflight.passed AND v_preflight.truth_compliant;
END;
$$ LANGUAGE plpgsql;

-- Get execution stats for workspace
CREATE OR REPLACE FUNCTION get_execution_stats(
  p_workspace_id UUID,
  p_days INTEGER DEFAULT 7
) RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'success', COUNT(*) FILTER (WHERE status = 'success'),
    'failed', COUNT(*) FILTER (WHERE status = 'failed'),
    'rolled_back', COUNT(*) FILTER (WHERE status = 'rolled_back'),
    'pending', COUNT(*) FILTER (WHERE status = 'pending')
  ) INTO v_stats
  FROM posting_executions
  WHERE workspace_id = p_workspace_id
    AND created_at >= now() - (p_days || ' days')::interval;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update schedule status after execution
CREATE OR REPLACE FUNCTION update_schedule_after_execution()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE campaign_orchestration_schedules
    SET
      status = 'completed',
      executed_at = NEW.executed_at,
      execution_result = jsonb_build_object(
        'execution_id', NEW.id,
        'external_post_id', NEW.external_post_id,
        'external_url', NEW.external_url
      )
    WHERE id = NEW.schedule_id;
  ELSIF NEW.status = 'failed' THEN
    UPDATE campaign_orchestration_schedules
    SET
      status = 'failed',
      execution_result = jsonb_build_object(
        'execution_id', NEW.id,
        'error', NEW.error_message
      )
    WHERE id = NEW.schedule_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_schedule_after_execution
  AFTER UPDATE ON posting_executions
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status IN ('success', 'failed'))
  EXECUTE FUNCTION update_schedule_after_execution();

-- Update execution status after rollback
CREATE OR REPLACE FUNCTION update_execution_after_rollback()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'success' THEN
    UPDATE posting_executions
    SET status = 'rolled_back'
    WHERE id = NEW.execution_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_execution_after_rollback
  AFTER UPDATE ON rollback_log
  FOR EACH ROW
  WHEN (NEW.status = 'success')
  EXECUTE FUNCTION update_execution_after_rollback();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE posting_preflight_checks IS 'Phase 87: Safety checks before real posting execution';
COMMENT ON TABLE posting_executions IS 'Phase 87: Real posting executions and outcomes';
COMMENT ON TABLE rollback_log IS 'Phase 87: Post removal/retraction actions';

COMMENT ON COLUMN posting_preflight_checks.passed IS 'All checks passed, safe to execute';
COMMENT ON COLUMN posting_executions.forced_by IS 'User who forced execution with override';
COMMENT ON COLUMN rollback_log.status IS 'pending | success | failed | not_supported';
