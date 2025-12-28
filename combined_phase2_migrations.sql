-- Project Vend Phase 2: Agent Execution Metrics
-- Tracks performance, costs, and business metrics for all agent executions

-- Agent execution metrics table
CREATE TABLE IF NOT EXISTS agent_execution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,

  -- Performance metrics
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_type TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Cost metrics (Claude API usage)
  model_used TEXT, -- opus-4-5-20251101 | sonnet-4-5-20250929 | haiku-4-5-20251001
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,

  -- Business metrics (agent-specific)
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2),

  -- Timestamps
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0),
  CONSTRAINT valid_tokens CHECK (input_tokens >= 0 AND output_tokens >= 0),
  CONSTRAINT valid_cost CHECK (cost_usd >= 0)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_workspace
  ON agent_execution_metrics(workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_agent
  ON agent_execution_metrics(agent_name, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_execution
  ON agent_execution_metrics(execution_id)
  WHERE execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_success
  ON agent_execution_metrics(workspace_id, agent_name, success, executed_at DESC);

-- Row Level Security
ALTER TABLE agent_execution_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see metrics for their workspace
DROP POLICY IF EXISTS "Users can view their workspace agent metrics" ON agent_execution_metrics;
CREATE POLICY "Users can view their workspace agent metrics" ON agent_execution_metrics
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: System can insert metrics
DROP POLICY IF EXISTS "System can insert agent metrics" ON agent_execution_metrics;
CREATE POLICY "System can insert agent metrics" ON agent_execution_metrics
  FOR INSERT
  WITH CHECK (true); -- Agent system inserts with service role

-- RLS Policy: System can update metrics (for corrections)
DROP POLICY IF EXISTS "System can update agent metrics" ON agent_execution_metrics;
CREATE POLICY "System can update agent metrics" ON agent_execution_metrics
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE agent_execution_metrics IS 'Tracks performance, cost, and business metrics for all agent executions. Used for health monitoring, budget enforcement, and optimization.';
COMMENT ON COLUMN agent_execution_metrics.agent_name IS 'Name of the agent that executed (e.g., EmailAgent, ContentGenerator, Orchestrator)';
COMMENT ON COLUMN agent_execution_metrics.model_used IS 'Claude model used: opus-4-5-20251101, sonnet-4-5-20250929, or haiku-4-5-20251001';
COMMENT ON COLUMN agent_execution_metrics.cost_usd IS 'Calculated cost in USD based on token usage and model pricing';
COMMENT ON COLUMN agent_execution_metrics.confidence_score IS 'Agent confidence in output quality (0-1 scale)';
-- Project Vend Phase 2: Agent Health Monitoring
-- Tracks real-time health status and degradation for all agents

-- Agent health status table
CREATE TABLE IF NOT EXISTS agent_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,

  -- Health indicators
  status TEXT NOT NULL DEFAULT 'healthy', -- healthy | degraded | critical | disabled
  success_rate_24h DECIMAL(5,2), -- percentage (0-100)
  avg_execution_time_24h INTEGER, -- milliseconds
  error_rate_24h DECIMAL(5,2), -- percentage (0-100)
  cost_24h_usd DECIMAL(10,2),

  -- Failure tracking
  consecutive_failures INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT,

  -- Metrics aggregates
  total_executions_24h INTEGER DEFAULT 0,
  total_cost_30d_usd DECIMAL(10,2),

  -- Timestamps
  last_health_check_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, agent_name),
  CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'critical', 'disabled')),
  CONSTRAINT valid_success_rate CHECK (success_rate_24h >= 0 AND success_rate_24h <= 100),
  CONSTRAINT valid_error_rate CHECK (error_rate_24h >= 0 AND error_rate_24h <= 100),
  CONSTRAINT valid_consecutive_failures CHECK (consecutive_failures >= 0),
  CONSTRAINT valid_total_executions CHECK (total_executions_24h >= 0)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_agent_health_workspace
  ON agent_health_status(workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_health_status_filter
  ON agent_health_status(status, workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_health_agent_name
  ON agent_health_status(agent_name, workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_health_last_check
  ON agent_health_status(last_health_check_at DESC);

-- Row Level Security
ALTER TABLE agent_health_status ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view health for their workspace
DROP POLICY IF EXISTS "Users can view their workspace agent health" ON agent_health_status;
CREATE POLICY "Users can view their workspace agent health" ON agent_health_status
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: System can manage health status
DROP POLICY IF EXISTS "System can insert agent health" ON agent_health_status;
CREATE POLICY "System can insert agent health" ON agent_health_status
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent health" ON agent_health_status;
CREATE POLICY "System can update agent health" ON agent_health_status
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on every update
DROP TRIGGER IF EXISTS trigger_update_agent_health_updated_at ON agent_health_status;
CREATE TRIGGER trigger_update_agent_health_updated_at
  BEFORE UPDATE ON agent_health_status
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_health_updated_at();

-- Function to calculate health status based on metrics
CREATE OR REPLACE FUNCTION calculate_agent_health_status(
  p_success_rate DECIMAL,
  p_error_rate DECIMAL,
  p_consecutive_failures INTEGER
)
RETURNS TEXT AS $$
BEGIN
  -- Critical: success rate < 70% OR error rate > 30% OR 5+ consecutive failures
  IF p_success_rate < 70 OR p_error_rate > 30 OR p_consecutive_failures >= 5 THEN
    RETURN 'critical';
  END IF;

  -- Degraded: success rate < 85% OR error rate > 15% OR 3+ consecutive failures
  IF p_success_rate < 85 OR p_error_rate > 15 OR p_consecutive_failures >= 3 THEN
    RETURN 'degraded';
  END IF;

  -- Healthy: everything nominal
  RETURN 'healthy';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE agent_health_status IS 'Real-time health monitoring for all agents. Updated every 5 minutes via health monitor service.';
COMMENT ON COLUMN agent_health_status.status IS 'Current health status: healthy (normal), degraded (issues detected), critical (failing), disabled (manually paused)';
COMMENT ON COLUMN agent_health_status.consecutive_failures IS 'Number of failures in a row. Reset to 0 on first success.';
COMMENT ON COLUMN agent_health_status.last_error IS 'Most recent error message for debugging';
COMMENT ON FUNCTION calculate_agent_health_status IS 'Determines agent health status based on success rate, error rate, and consecutive failures';
-- Project Vend Phase 2: Business Rules Engine
-- Workspace-scoped rules for agents to enforce constraints and prevent naive decisions

-- Agent business rules table
CREATE TABLE IF NOT EXISTS agent_business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- constraint | validation | escalation | cost_limit

  -- Rule configuration (JSONB for flexibility)
  config JSONB NOT NULL,
  -- Example configs:
  -- {"max_score_change": 20, "type": "constraint"}
  -- {"min_confidence": 0.8, "type": "validation"}
  -- {"daily_budget_usd": 50, "type": "cost_limit"}
  -- {"max_enrollment_delay_hours": 24, "type": "constraint"}

  -- Rule state
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100, -- lower number = higher priority (1 = highest)

  -- Enforcement level
  enforcement_level TEXT DEFAULT 'block', -- block | warn | log
  escalate_on_violation BOOLEAN DEFAULT false,

  -- Metadata
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, agent_name, rule_name),
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('constraint', 'validation', 'escalation', 'cost_limit')),
  CONSTRAINT valid_enforcement_level CHECK (enforcement_level IN ('block', 'warn', 'log')),
  CONSTRAINT valid_priority CHECK (priority > 0)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_agent_rules_workspace
  ON agent_business_rules(workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_rules_agent
  ON agent_business_rules(agent_name, enabled)
  WHERE enabled = true;

CREATE INDEX IF NOT EXISTS idx_agent_rules_type
  ON agent_business_rules(rule_type, workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_rules_priority
  ON agent_business_rules(priority ASC)
  WHERE enabled = true;

-- Row Level Security
ALTER TABLE agent_business_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view rules for their workspace
DROP POLICY IF EXISTS "Users can view their workspace rules" ON agent_business_rules;
CREATE POLICY "Users can view their workspace rules" ON agent_business_rules
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can create rules for their workspace
DROP POLICY IF EXISTS "Users can create workspace rules" ON agent_business_rules;
CREATE POLICY "Users can create workspace rules" ON agent_business_rules
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  );

-- RLS Policy: Users can update rules for their workspace
DROP POLICY IF EXISTS "Users can update workspace rules" ON agent_business_rules;
CREATE POLICY "Users can update workspace rules" ON agent_business_rules
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  );

-- RLS Policy: Users can delete rules for their workspace
DROP POLICY IF EXISTS "Users can delete workspace rules" ON agent_business_rules;
CREATE POLICY "Users can delete workspace rules" ON agent_business_rules
  FOR DELETE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  );

-- RLS Policy: System can manage rules
DROP POLICY IF EXISTS "System can manage rules" ON agent_business_rules;
CREATE POLICY "System can manage rules" ON agent_business_rules
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on every update
DROP TRIGGER IF EXISTS trigger_update_agent_rules_updated_at ON agent_business_rules;
CREATE TRIGGER trigger_update_agent_rules_updated_at
  BEFORE UPDATE ON agent_business_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_rules_updated_at();

-- Comments for documentation
COMMENT ON TABLE agent_business_rules IS 'Workspace-scoped business rules for agents. Enforces constraints, validations, and cost limits to prevent naive decisions (Project Vend Phase 2).';
COMMENT ON COLUMN agent_business_rules.rule_type IS 'Type of rule: constraint (hard limits), validation (min requirements), escalation (approval triggers), cost_limit (budget controls)';
COMMENT ON COLUMN agent_business_rules.config IS 'JSONB configuration for the rule. Schema varies by rule_type.';
COMMENT ON COLUMN agent_business_rules.enforcement_level IS 'How to enforce: block (prevent action), warn (allow but log), log (record only)';
COMMENT ON COLUMN agent_business_rules.priority IS 'Execution priority (lower = higher priority, 1 = highest)';
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
