-- Project Vend Phase 2: Base Agent Tables (PREREQUISITE)
-- Creates agent_tasks and agent_executions tables that Phase 2 references

-- Agent tasks queue table
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  context JSONB,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  result JSONB,
  last_error TEXT,

  -- Priority and retry
  priority INTEGER DEFAULT 5,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 10),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries)
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_workspace ON agent_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status, workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_name, workspace_id);

-- Agent executions table
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,

  -- Execution details
  status TEXT NOT NULL DEFAULT 'running', -- running | success | error
  output JSONB,
  error_message TEXT,

  -- Performance
  duration_ms INTEGER,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_execution_status CHECK (status IN ('running', 'success', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_agent_executions_workspace ON agent_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent ON agent_executions(agent_name, workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_task ON agent_executions(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status, workspace_id);

-- RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their workspace tasks" ON agent_tasks;
CREATE POLICY "Users can view their workspace tasks" ON agent_tasks
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage tasks" ON agent_tasks;
CREATE POLICY "System can manage tasks" ON agent_tasks
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their workspace executions" ON agent_executions;
CREATE POLICY "Users can view their workspace executions" ON agent_executions
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage executions" ON agent_executions;
CREATE POLICY "System can manage executions" ON agent_executions
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE agent_tasks IS 'Task queue for agent execution. Referenced by agent_execution_metrics.';
COMMENT ON TABLE agent_executions IS 'Agent execution history. Referenced by agent_execution_metrics, agent_escalations, agent_verification_logs.';
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
-- Project Vend Phase 2: Enhanced Escalation System
-- Dynamic escalation chains, approval workflows, anomaly detection

-- Agent escalations table
CREATE TABLE IF NOT EXISTS agent_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,

  -- Escalation details
  escalation_type TEXT NOT NULL, -- rule_violation | health_degraded | cost_exceeded | anomaly_detected | low_confidence | manual
  severity TEXT NOT NULL, -- info | warning | critical
  title TEXT NOT NULL,
  description TEXT,
  context JSONB, -- Additional data about the escalation

  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending', -- pending | approved | rejected | auto_resolved
  approved_by UUID REFERENCES auth.users(id),
  approval_reason TEXT,
  approved_at TIMESTAMPTZ,

  -- Actions
  action_taken TEXT, -- blocked | allowed | paused_agent | triggered_fallback | manual_intervention
  auto_resolved BOOLEAN DEFAULT false,
  resolution_details JSONB,

  -- Escalation chain
  escalated_to UUID REFERENCES auth.users(id), -- Current approver (supervisor/manager)
  escalation_chain JSONB, -- Array of user IDs [user_id_1, user_id_2, ...]
  current_approver_index INTEGER DEFAULT 0,

  -- Timestamps
  escalated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_escalation_type CHECK (escalation_type IN ('rule_violation', 'health_degraded', 'cost_exceeded', 'anomaly_detected', 'low_confidence', 'manual')),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_resolved')),
  CONSTRAINT valid_action_taken CHECK (action_taken IN ('blocked', 'allowed', 'paused_agent', 'triggered_fallback', 'manual_intervention'))
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_escalations_workspace
  ON agent_escalations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_escalations_status
  ON agent_escalations(approval_status, escalated_at DESC)
  WHERE approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_escalations_agent
  ON agent_escalations(agent_name, severity);

CREATE INDEX IF NOT EXISTS idx_escalations_approver
  ON agent_escalations(escalated_to)
  WHERE escalated_to IS NOT NULL AND approval_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_escalations_execution
  ON agent_escalations(execution_id)
  WHERE execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_escalations_type
  ON agent_escalations(escalation_type, workspace_id, escalated_at DESC);

-- Row Level Security
ALTER TABLE agent_escalations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view escalations for their workspace
DROP POLICY IF EXISTS "Users can view their workspace escalations" ON agent_escalations;
CREATE POLICY "Users can view their workspace escalations" ON agent_escalations
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: Users can approve escalations assigned to them
DROP POLICY IF EXISTS "Users can approve assigned escalations" ON agent_escalations;
CREATE POLICY "Users can approve assigned escalations" ON agent_escalations
  FOR UPDATE
  USING (
    escalated_to = auth.uid() OR
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    escalated_to = auth.uid() OR
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
    )
  );

-- RLS Policy: System can create escalations
DROP POLICY IF EXISTS "System can create escalations" ON agent_escalations;
CREATE POLICY "System can create escalations" ON agent_escalations
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: System can update escalations
DROP POLICY IF EXISTS "System can update escalations" ON agent_escalations;
CREATE POLICY "System can update escalations" ON agent_escalations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to update FK in rule_violations when escalation created
CREATE OR REPLACE FUNCTION link_violation_to_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- If this escalation is for a rule violation, link it
  IF NEW.escalation_type = 'rule_violation' AND NEW.context ? 'violation_id' THEN
    UPDATE agent_rule_violations
    SET escalation_id = NEW.id
    WHERE id = (NEW.context->>'violation_id')::UUID;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_link_violation_to_escalation ON agent_escalations;
CREATE TRIGGER trigger_link_violation_to_escalation
  AFTER INSERT ON agent_escalations
  FOR EACH ROW
  EXECUTE FUNCTION link_violation_to_escalation();

-- View: Pending approvals (needs immediate attention)
CREATE OR REPLACE VIEW pending_approvals AS
SELECT
  e.*,
  w.name as workspace_name,
  u.email as approver_email,
  EXTRACT(EPOCH FROM (NOW() - e.escalated_at)) / 3600 as hours_pending
FROM agent_escalations e
LEFT JOIN workspaces w ON w.id = e.workspace_id
LEFT JOIN auth.users u ON u.id = e.escalated_to
WHERE e.approval_status = 'pending'
  AND e.requires_approval = true
ORDER BY
  CASE e.severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 3
  END,
  e.escalated_at ASC;

COMMENT ON VIEW pending_approvals IS 'Escalations requiring immediate approval, sorted by severity and age';

-- Function: Get escalation queue for user
CREATE OR REPLACE FUNCTION get_escalation_queue_for_user(
  p_user_id UUID
)
RETURNS TABLE (
  escalation_id UUID,
  agent_name TEXT,
  escalation_type TEXT,
  severity TEXT,
  title TEXT,
  description TEXT,
  escalated_at TIMESTAMPTZ,
  hours_pending NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id as escalation_id,
    e.agent_name,
    e.escalation_type,
    e.severity,
    e.title,
    e.description,
    e.escalated_at,
    EXTRACT(EPOCH FROM (NOW() - e.escalated_at)) / 3600 as hours_pending
  FROM agent_escalations e
  WHERE e.escalated_to = p_user_id
    AND e.approval_status = 'pending'
    AND e.requires_approval = true
  ORDER BY
    CASE e.severity
      WHEN 'critical' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'info' THEN 3
    END,
    e.escalated_at ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_escalation_queue_for_user IS 'Get pending escalations assigned to a specific user, sorted by severity';

-- Function: Auto-resolve stale escalations
CREATE OR REPLACE FUNCTION auto_resolve_stale_escalations(
  p_hours_threshold INTEGER DEFAULT 24
)
RETURNS INTEGER AS $$
DECLARE
  v_resolved_count INTEGER;
BEGIN
  UPDATE agent_escalations
  SET
    approval_status = 'auto_resolved',
    auto_resolved = true,
    resolved_at = NOW(),
    resolution_details = jsonb_build_object(
      'reason', 'Auto-resolved after ' || p_hours_threshold || ' hours',
      'auto_resolved_at', NOW()
    )
  WHERE approval_status = 'pending'
    AND escalated_at < NOW() - (p_hours_threshold || ' hours')::INTERVAL
    AND severity IN ('info', 'warning'); -- Only auto-resolve non-critical

  GET DIAGNOSTICS v_resolved_count = ROW_COUNT;
  RETURN v_resolved_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_resolve_stale_escalations IS 'Auto-resolves non-critical escalations pending longer than threshold hours (default 24)';

-- Comments for documentation
COMMENT ON TABLE agent_escalations IS 'Enhanced escalation system for agent events requiring approval or attention (Project Vend Phase 2).';
COMMENT ON COLUMN agent_escalations.escalation_type IS 'Why escalation triggered: rule_violation, health_degraded, cost_exceeded, anomaly_detected, low_confidence, manual';
COMMENT ON COLUMN agent_escalations.escalation_chain IS 'Array of user IDs representing approval chain. Escalates up chain if timeout.';
COMMENT ON COLUMN agent_escalations.current_approver_index IS 'Index into escalation_chain showing current approver position';
-- Project Vend Phase 2: Escalation Configuration
-- Workspace-specific settings for escalation chains and notifications

-- Escalation configuration table
CREATE TABLE IF NOT EXISTS escalation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Escalation chains (JSON mapping severity to user ID arrays)
  escalation_chains JSONB NOT NULL DEFAULT '{
    "critical": [],
    "warning": [],
    "info": []
  }'::jsonb,
  -- Example: {"critical": ["user-1", "user-2"], "warning": ["user-1"], "info": []}

  -- Auto-resolution rules
  auto_resolve_after_hours INTEGER DEFAULT 24,
  auto_approve_low_severity BOOLEAN DEFAULT false,

  -- Notification settings
  notify_immediately BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '["dashboard"]'::jsonb, -- ["email", "slack", "dashboard", "webhook"]
  webhook_url TEXT,

  -- Escalation policies
  escalate_up_chain_after_hours INTEGER DEFAULT 4, -- Move to next approver if no response
  max_pending_escalations INTEGER DEFAULT 50, -- Pause agents if queue too large

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id),
  CONSTRAINT valid_auto_resolve_hours CHECK (auto_resolve_after_hours > 0),
  CONSTRAINT valid_escalate_hours CHECK (escalate_up_chain_after_hours > 0),
  CONSTRAINT valid_max_pending CHECK (max_pending_escalations > 0)
);

-- Index for workspace lookup
CREATE INDEX IF NOT EXISTS idx_escalation_config_workspace
  ON escalation_config(workspace_id);

-- Row Level Security
ALTER TABLE escalation_config ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view config for their workspace
DROP POLICY IF EXISTS "Users can view their escalation config" ON escalation_config;
CREATE POLICY "Users can view their escalation config" ON escalation_config
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: Admins can manage escalation config
DROP POLICY IF EXISTS "Admins can manage escalation config" ON escalation_config;
CREATE POLICY "Admins can manage escalation config" ON escalation_config
  FOR ALL
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

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_escalation_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp
DROP TRIGGER IF EXISTS trigger_update_escalation_config_updated_at ON escalation_config;
CREATE TRIGGER trigger_update_escalation_config_updated_at
  BEFORE UPDATE ON escalation_config
  FOR EACH ROW
  EXECUTE FUNCTION update_escalation_config_updated_at();

-- Function to get approver for severity level
CREATE OR REPLACE FUNCTION get_approver_for_severity(
  p_workspace_id UUID,
  p_severity TEXT
)
RETURNS UUID AS $$
DECLARE
  v_chain JSONB;
  v_approver_id UUID;
BEGIN
  SELECT escalation_chains INTO v_chain
  FROM escalation_config
  WHERE workspace_id = p_workspace_id;

  IF v_chain IS NULL THEN
    RETURN NULL;
  END IF;

  -- Get first user in chain for this severity
  v_approver_id := (v_chain->p_severity->>0)::UUID;

  RETURN v_approver_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_approver_for_severity IS 'Get first approver in escalation chain for given severity level';

-- Function to escalate up the chain
CREATE OR REPLACE FUNCTION escalate_up_chain(
  p_escalation_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_escalation RECORD;
  v_next_index INTEGER;
  v_next_approver_id UUID;
  v_chain_array JSONB;
BEGIN
  -- Get current escalation
  SELECT * INTO v_escalation
  FROM agent_escalations
  WHERE id = p_escalation_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Get chain for this severity
  SELECT escalation_chains->v_escalation.severity INTO v_chain_array
  FROM escalation_config
  WHERE workspace_id = v_escalation.workspace_id;

  IF v_chain_array IS NULL THEN
    RETURN false;
  END IF;

  -- Calculate next index
  v_next_index := v_escalation.current_approver_index + 1;

  -- Check if there's a next approver
  IF jsonb_array_length(v_chain_array) <= v_next_index THEN
    -- No more approvers in chain, auto-resolve
    UPDATE agent_escalations
    SET
      approval_status = 'auto_resolved',
      auto_resolved = true,
      resolved_at = NOW(),
      resolution_details = jsonb_build_object(
        'reason', 'Escalated through entire chain with no approval',
        'chain_exhausted', true
      )
    WHERE id = p_escalation_id;

    RETURN false;
  END IF;

  -- Get next approver
  v_next_approver_id := (v_chain_array->>v_next_index)::UUID;

  -- Update escalation to next approver
  UPDATE agent_escalations
  SET
    current_approver_index = v_next_index,
    escalated_to = v_next_approver_id
  WHERE id = p_escalation_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION escalate_up_chain IS 'Move escalation to next approver in chain. Returns true if escalated, false if chain exhausted.';

-- Comments for documentation
COMMENT ON TABLE escalation_config IS 'Workspace-specific escalation configuration including chains, auto-resolution rules, and notifications (Project Vend Phase 2).';
COMMENT ON COLUMN escalation_config.escalation_chains IS 'JSONB mapping severity levels to arrays of user IDs: {"critical": ["user-1", "user-2"], "warning": ["user-1"]}';
COMMENT ON COLUMN escalation_config.auto_resolve_after_hours IS 'Hours to wait before auto-resolving non-critical escalations (default 24)';
COMMENT ON COLUMN escalation_config.escalate_up_chain_after_hours IS 'Hours to wait before escalating to next approver in chain (default 4)';
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
-- Project Vend Phase 2: Agent KPIs Materialized View
-- Aggregates metrics for fast dashboard queries

-- Agent KPIs materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS agent_kpis AS
SELECT
  workspace_id,
  agent_name,

  -- Performance (24h window)
  COUNT(*) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours') as executions_24h,
  AVG(execution_time_ms) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours') as avg_time_24h,
  (COUNT(*) FILTER (WHERE success = true AND executed_at > NOW() - INTERVAL '24 hours'))::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours'), 0) * 100 as success_rate_24h,

  -- Cost (30d window)
  SUM(cost_usd) FILTER (WHERE executed_at > NOW() - INTERVAL '30 days') as cost_30d,
  AVG(cost_usd) FILTER (WHERE executed_at > NOW() - INTERVAL '30 days') as avg_cost_per_execution,

  -- Health indicators
  MAX(executed_at) as last_execution_at,
  COUNT(*) FILTER (WHERE success = false AND executed_at > NOW() - INTERVAL '24 hours') as failures_24h,

  -- Recent activity (7d)
  COUNT(*) FILTER (WHERE executed_at > NOW() - INTERVAL '7 days') as executions_7d,
  SUM(cost_usd) FILTER (WHERE executed_at > NOW() - INTERVAL '7 days') as cost_7d

FROM agent_execution_metrics
GROUP BY workspace_id, agent_name;

-- Unique index for CONCURRENTLY refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_kpis_workspace_agent
  ON agent_kpis(workspace_id, agent_name);

-- Additional indexes for filtering
CREATE INDEX IF NOT EXISTS idx_agent_kpis_executions
  ON agent_kpis(executions_24h DESC);

CREATE INDEX IF NOT EXISTS idx_agent_kpis_cost
  ON agent_kpis(cost_30d DESC);

-- Function to refresh KPIs view
CREATE OR REPLACE FUNCTION refresh_agent_kpis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agent_kpis;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_agent_kpis IS 'Refresh agent_kpis materialized view. Should be called every 5 minutes via cron.';

-- Function to get KPI trends (compare current vs previous period)
CREATE OR REPLACE FUNCTION get_agent_kpi_trends(
  p_workspace_id UUID,
  p_agent_name TEXT
)
RETURNS TABLE (
  metric_name TEXT,
  current_value DECIMAL,
  previous_value DECIMAL,
  change_percent DECIMAL,
  trend TEXT -- 'up' | 'down' | 'stable'
) AS $$
DECLARE
  v_current_success_rate DECIMAL;
  v_previous_success_rate DECIMAL;
  v_current_avg_time DECIMAL;
  v_previous_avg_time DECIMAL;
  v_current_cost DECIMAL;
  v_previous_cost DECIMAL;
BEGIN
  -- Get current period (24h)
  SELECT
    (COUNT(*) FILTER (WHERE success = true))::DECIMAL / NULLIF(COUNT(*), 0) * 100,
    AVG(execution_time_ms),
    SUM(cost_usd)
  INTO v_current_success_rate, v_current_avg_time, v_current_cost
  FROM agent_execution_metrics
  WHERE workspace_id = p_workspace_id
    AND agent_name = p_agent_name
    AND executed_at > NOW() - INTERVAL '24 hours';

  -- Get previous period (24h-48h ago)
  SELECT
    (COUNT(*) FILTER (WHERE success = true))::DECIMAL / NULLIF(COUNT(*), 0) * 100,
    AVG(execution_time_ms),
    SUM(cost_usd)
  INTO v_previous_success_rate, v_previous_avg_time, v_previous_cost
  FROM agent_execution_metrics
  WHERE workspace_id = p_workspace_id
    AND agent_name = p_agent_name
    AND executed_at BETWEEN NOW() - INTERVAL '48 hours' AND NOW() - INTERVAL '24 hours';

  -- Return trends
  RETURN QUERY
  SELECT
    'success_rate'::TEXT as metric_name,
    COALESCE(v_current_success_rate, 0) as current_value,
    COALESCE(v_previous_success_rate, 0) as previous_value,
    CASE
      WHEN v_previous_success_rate > 0 THEN
        ((v_current_success_rate - v_previous_success_rate) / v_previous_success_rate * 100)
      ELSE 0
    END as change_percent,
    CASE
      WHEN v_current_success_rate > v_previous_success_rate + 2 THEN 'up'::TEXT
      WHEN v_current_success_rate < v_previous_success_rate - 2 THEN 'down'::TEXT
      ELSE 'stable'::TEXT
    END as trend

  UNION ALL

  SELECT
    'avg_execution_time'::TEXT,
    COALESCE(v_current_avg_time, 0),
    COALESCE(v_previous_avg_time, 0),
    CASE
      WHEN v_previous_avg_time > 0 THEN
        ((v_current_avg_time - v_previous_avg_time) / v_previous_avg_time * 100)
      ELSE 0
    END,
    CASE
      WHEN v_current_avg_time < v_previous_avg_time * 0.9 THEN 'up'::TEXT -- Faster is up/good
      WHEN v_current_avg_time > v_previous_avg_time * 1.1 THEN 'down'::TEXT
      ELSE 'stable'::TEXT
    END

  UNION ALL

  SELECT
    'cost'::TEXT,
    COALESCE(v_current_cost, 0),
    COALESCE(v_previous_cost, 0),
    CASE
      WHEN v_previous_cost > 0 THEN
        ((v_current_cost - v_previous_cost) / v_previous_cost * 100)
      ELSE 0
    END,
    CASE
      WHEN v_current_cost > v_previous_cost * 1.2 THEN 'down'::TEXT -- Higher cost is down/bad
      WHEN v_current_cost < v_previous_cost * 0.8 THEN 'up'::TEXT
      ELSE 'stable'::TEXT
    END;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_agent_kpi_trends IS 'Compare current 24h performance vs previous 24h to detect trends';

-- Comments for documentation
COMMENT ON MATERIALIZED VIEW agent_kpis IS 'Aggregated agent performance KPIs. Refresh every 5 minutes via refresh_agent_kpis() function.';
COMMENT ON COLUMN agent_kpis.success_rate_24h IS 'Success rate percentage (0-100) for last 24 hours';
COMMENT ON COLUMN agent_kpis.avg_time_24h IS 'Average execution time in milliseconds for last 24 hours';
COMMENT ON COLUMN agent_kpis.cost_30d IS 'Total AI spend in USD for last 30 days';
-- Project Vend Phase 2: Cost Control & Budget Enforcement
-- Prevents runaway AI costs with per-agent budgets

-- Agent budgets table
CREATE TABLE IF NOT EXISTS agent_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,

  -- Budget limits
  daily_budget_usd DECIMAL(10,2),
  monthly_budget_usd DECIMAL(10,2),
  per_execution_limit_usd DECIMAL(10,2),

  -- Current spending (calculated fields, updated via trigger)
  daily_spent_usd DECIMAL(10,2) DEFAULT 0,
  monthly_spent_usd DECIMAL(10,2) DEFAULT 0,

  -- Enforcement settings
  pause_on_exceed BOOLEAN DEFAULT true,
  alert_at_percentage INTEGER DEFAULT 80, -- Alert when 80% of budget used

  -- Reset timestamps (for tracking when to reset counters)
  daily_reset_at TIMESTAMPTZ DEFAULT (DATE_TRUNC('day', NOW()) + INTERVAL '1 day'),
  monthly_reset_at TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, agent_name),
  CONSTRAINT valid_daily_budget CHECK (daily_budget_usd >= 0),
  CONSTRAINT valid_monthly_budget CHECK (monthly_budget_usd >= 0),
  CONSTRAINT valid_per_execution_limit CHECK (per_execution_limit_usd >= 0),
  CONSTRAINT valid_alert_percentage CHECK (alert_at_percentage > 0 AND alert_at_percentage <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_budgets_workspace
  ON agent_budgets(workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_budgets_agent
  ON agent_budgets(agent_name, workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_budgets_exceeded
  ON agent_budgets(workspace_id, agent_name)
  WHERE daily_spent_usd >= daily_budget_usd OR monthly_spent_usd >= monthly_budget_usd;

-- Row Level Security
ALTER TABLE agent_budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their workspace budgets" ON agent_budgets;
CREATE POLICY "Users can view their workspace budgets" ON agent_budgets
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage budgets" ON agent_budgets;
CREATE POLICY "Admins can manage budgets" ON agent_budgets
  FOR ALL
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

DROP POLICY IF EXISTS "System can update budget tracking" ON agent_budgets;
CREATE POLICY "System can update budget tracking" ON agent_budgets
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function: Update budget spent amounts when metrics inserted
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  v_budget RECORD;
BEGIN
  -- Get budget for this agent/workspace
  SELECT * INTO v_budget
  FROM agent_budgets
  WHERE workspace_id = NEW.workspace_id
    AND agent_name = NEW.agent_name;

  IF NOT FOUND THEN
    RETURN NEW; -- No budget configured, skip
  END IF;

  -- Check if we need to reset daily counter
  IF v_budget.daily_reset_at < NOW() THEN
    UPDATE agent_budgets
    SET
      daily_spent_usd = COALESCE(NEW.cost_usd, 0),
      daily_reset_at = DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
    WHERE id = v_budget.id;
  ELSE
    -- Increment daily spend
    UPDATE agent_budgets
    SET daily_spent_usd = daily_spent_usd + COALESCE(NEW.cost_usd, 0)
    WHERE id = v_budget.id;
  END IF;

  -- Check if we need to reset monthly counter
  IF v_budget.monthly_reset_at < NOW() THEN
    UPDATE agent_budgets
    SET
      monthly_spent_usd = COALESCE(NEW.cost_usd, 0),
      monthly_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE id = v_budget.id;
  ELSE
    -- Increment monthly spend
    UPDATE agent_budgets
    SET monthly_spent_usd = monthly_spent_usd + COALESCE(NEW.cost_usd, 0)
    WHERE id = v_budget.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update budget spent when metrics inserted
DROP TRIGGER IF EXISTS trigger_update_budget_spent ON agent_execution_metrics;
CREATE TRIGGER trigger_update_budget_spent
  AFTER INSERT ON agent_execution_metrics
  FOR EACH ROW
  WHEN (NEW.cost_usd IS NOT NULL AND NEW.cost_usd > 0)
  EXECUTE FUNCTION update_budget_spent();

-- Function: Check if budget would be exceeded
CREATE OR REPLACE FUNCTION check_budget_available(
  p_workspace_id UUID,
  p_agent_name TEXT,
  p_estimated_cost_usd DECIMAL
)
RETURNS TABLE (
  within_budget BOOLEAN,
  daily_remaining DECIMAL,
  monthly_remaining DECIMAL,
  budget_type TEXT -- 'daily' | 'monthly' | 'per_execution' | 'none'
) AS $$
DECLARE
  v_budget RECORD;
BEGIN
  SELECT * INTO v_budget
  FROM agent_budgets
  WHERE workspace_id = p_workspace_id
    AND agent_name = p_agent_name;

  IF NOT FOUND THEN
    -- No budget configured, allow
    RETURN QUERY SELECT true, NULL::DECIMAL, NULL::DECIMAL, 'none'::TEXT;
    RETURN;
  END IF;

  -- Check per-execution limit
  IF v_budget.per_execution_limit_usd IS NOT NULL AND p_estimated_cost_usd > v_budget.per_execution_limit_usd THEN
    RETURN QUERY SELECT false, NULL::DECIMAL, NULL::DECIMAL, 'per_execution'::TEXT;
    RETURN;
  END IF;

  -- Check daily budget
  IF v_budget.daily_budget_usd IS NOT NULL THEN
    IF v_budget.daily_spent_usd + p_estimated_cost_usd > v_budget.daily_budget_usd THEN
      RETURN QUERY SELECT
        false,
        v_budget.daily_budget_usd - v_budget.daily_spent_usd,
        NULL::DECIMAL,
        'daily'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Check monthly budget
  IF v_budget.monthly_budget_usd IS NOT NULL THEN
    IF v_budget.monthly_spent_usd + p_estimated_cost_usd > v_budget.monthly_budget_usd THEN
      RETURN QUERY SELECT
        false,
        NULL::DECIMAL,
        v_budget.monthly_budget_usd - v_budget.monthly_spent_usd,
        'monthly'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Within budget
  RETURN QUERY SELECT
    true,
    CASE WHEN v_budget.daily_budget_usd IS NOT NULL
      THEN v_budget.daily_budget_usd - v_budget.daily_spent_usd
      ELSE NULL
    END,
    CASE WHEN v_budget.monthly_budget_usd IS NOT NULL
      THEN v_budget.monthly_budget_usd - v_budget.monthly_spent_usd
      ELSE NULL
    END,
    'none'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION check_budget_available IS 'Check if estimated cost is within budget limits. Returns budget status and remaining amounts.';

-- Comments
COMMENT ON TABLE agent_budgets IS 'Per-agent budget limits and spending tracking. Prevents runaway AI costs (Project Vend Phase 2).';
COMMENT ON COLUMN agent_budgets.pause_on_exceed IS 'Automatically pause agent when budget exceeded';
COMMENT ON COLUMN agent_budgets.alert_at_percentage IS 'Trigger alert when this percentage of budget is used (default 80%)';
COMMENT ON TRIGGER trigger_update_budget_spent ON agent_execution_metrics IS 'Automatically updates daily_spent_usd and monthly_spent_usd when agent executions complete';
