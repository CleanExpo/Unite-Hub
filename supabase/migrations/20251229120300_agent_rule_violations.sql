-- Project Vend Phase 2: Rule Violation Logging
-- Tracks violations when agents attempt actions that break business rules

-- Forward reference for escalations (will be created in next phase)
-- This migration can run before agent_escalations exists

-- Agent rule violations table
CREATE TABLE IF NOT EXISTS agent_rule_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES agent_business_rules(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,

  -- Violation details
  violation_type TEXT NOT NULL, -- constraint_exceeded | validation_failed | cost_limit_exceeded | escalation_triggered
  attempted_action JSONB NOT NULL, -- What the agent tried to do
  rule_violated JSONB, -- The rule config that was violated
  severity TEXT NOT NULL DEFAULT 'medium', -- low | medium | high | critical

  -- Resolution
  action_taken TEXT NOT NULL, -- blocked | allowed_with_warning | escalated | logged_only
  escalation_id UUID, -- Will reference agent_escalations when that table exists
  resolution_notes TEXT,

  -- Timestamps
  violated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_violation_type CHECK (violation_type IN ('constraint_exceeded', 'validation_failed', 'cost_limit_exceeded', 'escalation_triggered')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_action_taken CHECK (action_taken IN ('blocked', 'allowed_with_warning', 'escalated', 'logged_only'))
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_rule_violations_workspace
  ON agent_rule_violations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_rule_violations_agent
  ON agent_rule_violations(agent_name, violated_at DESC);

CREATE INDEX IF NOT EXISTS idx_rule_violations_rule
  ON agent_rule_violations(rule_id)
  WHERE rule_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rule_violations_severity
  ON agent_rule_violations(severity, workspace_id, violated_at DESC)
  WHERE severity IN ('high', 'critical');

CREATE INDEX IF NOT EXISTS idx_rule_violations_execution
  ON agent_rule_violations(execution_id)
  WHERE execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rule_violations_escalation
  ON agent_rule_violations(escalation_id)
  WHERE escalation_id IS NOT NULL;

-- Row Level Security
ALTER TABLE agent_rule_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view violations for their workspace
DROP POLICY IF EXISTS "Users can view their workspace violations" ON agent_rule_violations;
CREATE POLICY "Users can view their workspace violations" ON agent_rule_violations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: System can insert violations
DROP POLICY IF EXISTS "System can insert violations" ON agent_rule_violations;
CREATE POLICY "System can insert violations" ON agent_rule_violations
  FOR INSERT
  WITH CHECK (true); -- Agent system inserts with service role

-- RLS Policy: System can update violations
DROP POLICY IF EXISTS "System can update violations" ON agent_rule_violations;
CREATE POLICY "System can update violations" ON agent_rule_violations
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- View: Recent critical violations
CREATE OR REPLACE VIEW recent_critical_violations AS
SELECT
  v.*,
  r.rule_name,
  r.rule_type,
  r.enforcement_level,
  w.name as workspace_name
FROM agent_rule_violations v
LEFT JOIN agent_business_rules r ON r.id = v.rule_id
LEFT JOIN workspaces w ON w.id = v.workspace_id
WHERE v.severity IN ('high', 'critical')
  AND v.violated_at > NOW() - INTERVAL '7 days'
ORDER BY v.violated_at DESC;

COMMENT ON VIEW recent_critical_violations IS 'Recent high and critical severity rule violations (last 7 days) with rule and workspace details';

-- Function: Get violation count by agent
CREATE OR REPLACE FUNCTION get_violation_count_by_agent(
  p_workspace_id UUID,
  p_hours_ago INTEGER DEFAULT 24
)
RETURNS TABLE (
  agent_name TEXT,
  total_violations BIGINT,
  critical_violations BIGINT,
  high_violations BIGINT,
  blocked_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.agent_name,
    COUNT(*)::BIGINT as total_violations,
    COUNT(*) FILTER (WHERE v.severity = 'critical')::BIGINT as critical_violations,
    COUNT(*) FILTER (WHERE v.severity = 'high')::BIGINT as high_violations,
    COUNT(*) FILTER (WHERE v.action_taken = 'blocked')::BIGINT as blocked_count
  FROM agent_rule_violations v
  WHERE v.workspace_id = p_workspace_id
    AND v.violated_at > NOW() - (p_hours_ago || ' hours')::INTERVAL
  GROUP BY v.agent_name
  ORDER BY total_violations DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_violation_count_by_agent IS 'Get violation counts by agent for a workspace within the last N hours (default 24)';

-- Function: Get violations by rule
CREATE OR REPLACE FUNCTION get_violations_by_rule(
  p_workspace_id UUID,
  p_hours_ago INTEGER DEFAULT 24
)
RETURNS TABLE (
  rule_id UUID,
  rule_name TEXT,
  rule_type TEXT,
  violation_count BIGINT,
  blocked_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id as rule_id,
    r.rule_name,
    r.rule_type,
    COUNT(v.id)::BIGINT as violation_count,
    COUNT(v.id) FILTER (WHERE v.action_taken = 'blocked')::BIGINT as blocked_count
  FROM agent_business_rules r
  LEFT JOIN agent_rule_violations v ON v.rule_id = r.id
    AND v.violated_at > NOW() - (p_hours_ago || ' hours')::INTERVAL
  WHERE r.workspace_id = p_workspace_id
    AND r.enabled = true
  GROUP BY r.id, r.rule_name, r.rule_type
  HAVING COUNT(v.id) > 0
  ORDER BY violation_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_violations_by_rule IS 'Get violation counts by rule for a workspace within the last N hours (default 24)';

-- Comments for documentation
COMMENT ON TABLE agent_rule_violations IS 'Logs all rule violations when agents attempt actions that break business rules. Used for auditing, debugging, and improving rules (Project Vend Phase 2).';
COMMENT ON COLUMN agent_rule_violations.violation_type IS 'Type of violation: constraint_exceeded, validation_failed, cost_limit_exceeded, escalation_triggered';
COMMENT ON COLUMN agent_rule_violations.attempted_action IS 'JSONB describing what the agent tried to do (e.g., {score_change: 30, contact_id: "123"})';
COMMENT ON COLUMN agent_rule_violations.action_taken IS 'How the violation was handled: blocked (prevented), allowed_with_warning (logged but executed), escalated (sent for approval), logged_only (informational)';
