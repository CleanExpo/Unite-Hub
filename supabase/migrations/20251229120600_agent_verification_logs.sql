-- Project Vend Phase 2: Verification Layer
-- Extends agent_executions with verification and creates verification logs

-- Extend agent_executions table (if it exists)
DO $$ BEGIN
  -- Add verification columns to agent_executions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'agent_executions') THEN
    ALTER TABLE agent_executions
    ADD COLUMN IF NOT EXISTS verification_result JSONB,
    ADD COLUMN IF NOT EXISTS verification_passed BOOLEAN,
    ADD COLUMN IF NOT EXISTS verification_confidence DECIMAL(3,2);

    -- Add constraint for verification_confidence
    DO $constraint$ BEGIN
      ALTER TABLE agent_executions
      ADD CONSTRAINT valid_verification_confidence
      CHECK (verification_confidence >= 0 AND verification_confidence <= 1);
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $constraint$;
  END IF;
END $$;

-- Agent verification logs table
CREATE TABLE IF NOT EXISTS agent_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,

  -- Verification details
  verification_type TEXT NOT NULL, -- email_intent | sentiment_accuracy | contact_data | content_quality | personalization | score_change | campaign_conditions
  input_data JSONB, -- Data being verified
  expected_output JSONB, -- What was expected
  actual_output JSONB, -- What the agent produced

  -- Results
  passed BOOLEAN NOT NULL DEFAULT false,
  confidence DECIMAL(3,2), -- Confidence in verification (0-1)
  errors JSONB, -- Array of error messages
  warnings JSONB, -- Array of warning messages

  -- Timestamps
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_verification_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_verification_logs_workspace
  ON agent_verification_logs(workspace_id);

CREATE INDEX IF NOT EXISTS idx_verification_logs_execution
  ON agent_verification_logs(execution_id)
  WHERE execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_verification_logs_agent
  ON agent_verification_logs(agent_name, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_logs_passed
  ON agent_verification_logs(passed, workspace_id, verified_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_logs_type
  ON agent_verification_logs(verification_type, workspace_id);

-- Row Level Security
ALTER TABLE agent_verification_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view verification logs for their workspace
DROP POLICY IF EXISTS "Users can view their workspace verification logs" ON agent_verification_logs;
CREATE POLICY "Users can view their workspace verification logs" ON agent_verification_logs
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: System can manage verification logs
DROP POLICY IF EXISTS "System can insert verification logs" ON agent_verification_logs;
CREATE POLICY "System can insert verification logs" ON agent_verification_logs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update verification logs" ON agent_verification_logs;
CREATE POLICY "System can update verification logs" ON agent_verification_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- View: Failed verifications (for debugging)
CREATE OR REPLACE VIEW failed_verifications AS
SELECT
  v.*,
  e.agent_name as execution_agent,
  e.status as execution_status,
  w.name as workspace_name
FROM agent_verification_logs v
LEFT JOIN agent_executions e ON e.id = v.execution_id
LEFT JOIN workspaces w ON w.id = v.workspace_id
WHERE v.passed = false
  AND v.verified_at > NOW() - INTERVAL '7 days'
ORDER BY v.verified_at DESC;

COMMENT ON VIEW failed_verifications IS 'Recent failed verifications (last 7 days) with execution and workspace details';

-- Function: Get verification pass rate by agent
CREATE OR REPLACE FUNCTION get_verification_pass_rate(
  p_workspace_id UUID,
  p_agent_name TEXT,
  p_hours_ago INTEGER DEFAULT 24
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total INTEGER;
  v_passed INTEGER;
BEGIN
  SELECT
    COUNT(*)::INTEGER,
    COUNT(*) FILTER (WHERE passed = true)::INTEGER
  INTO v_total, v_passed
  FROM agent_verification_logs
  WHERE workspace_id = p_workspace_id
    AND agent_name = p_agent_name
    AND verified_at > NOW() - (p_hours_ago || ' hours')::INTERVAL;

  IF v_total = 0 THEN
    RETURN 0;
  END IF;

  RETURN ((v_passed::DECIMAL / v_total) * 100);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_verification_pass_rate IS 'Calculate verification pass rate for an agent (percentage, 0-100)';

-- Comments for documentation
COMMENT ON TABLE agent_verification_logs IS 'Logs all verification checks performed on agent outputs. Prevents hallucinations and validates quality before applying changes (Project Vend Phase 2).';
COMMENT ON COLUMN agent_verification_logs.verification_type IS 'Type of verification: email_intent, sentiment_accuracy, contact_data, content_quality, personalization, score_change, campaign_conditions';
COMMENT ON COLUMN agent_verification_logs.passed IS 'Whether verification passed all checks';
COMMENT ON COLUMN agent_verification_logs.confidence IS 'Confidence in verification result (0-1 scale)';
