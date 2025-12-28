-- ============================================================================
-- PROJECT VEND PHASE 2: WORKING MIGRATIONS
-- Standalone migrations with NO dependencies on non-existent tables
-- ============================================================================

-- ============================================================================
-- PART 1: AGENT EXECUTION METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_execution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  execution_id TEXT, -- Changed from UUID FK to TEXT (no dependency)

  -- Performance metrics
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_type TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Cost metrics
  model_used TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,

  -- Business metrics
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

CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_workspace ON agent_execution_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_agent ON agent_execution_metrics(agent_name, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_success ON agent_execution_metrics(workspace_id, agent_name, success, executed_at DESC);

ALTER TABLE agent_execution_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace agent metrics" ON agent_execution_metrics;
CREATE POLICY "Users can view their workspace agent metrics" ON agent_execution_metrics FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert agent metrics" ON agent_execution_metrics;
CREATE POLICY "System can insert agent metrics" ON agent_execution_metrics FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent metrics" ON agent_execution_metrics;
CREATE POLICY "System can update agent metrics" ON agent_execution_metrics FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================================
-- PART 2: AGENT HEALTH STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,

  status TEXT NOT NULL DEFAULT 'healthy',
  success_rate_24h DECIMAL(5,2),
  avg_execution_time_24h INTEGER,
  error_rate_24h DECIMAL(5,2),
  cost_24h_usd DECIMAL(10,2),

  consecutive_failures INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT,

  total_executions_24h INTEGER DEFAULT 0,
  total_cost_30d_usd DECIMAL(10,2),

  last_health_check_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, agent_name),
  CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'critical', 'disabled'))
);

CREATE INDEX IF NOT EXISTS idx_agent_health_workspace ON agent_health_status(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_health_status_filter ON agent_health_status(status, workspace_id);

ALTER TABLE agent_health_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace agent health" ON agent_health_status;
CREATE POLICY "Users can view their workspace agent health" ON agent_health_status FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert agent health" ON agent_health_status;
CREATE POLICY "System can insert agent health" ON agent_health_status FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent health" ON agent_health_status;
CREATE POLICY "System can update agent health" ON agent_health_status FOR UPDATE USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION calculate_agent_health_status(
  p_success_rate DECIMAL,
  p_error_rate DECIMAL,
  p_consecutive_failures INTEGER
)
RETURNS TEXT AS $$
BEGIN
  IF p_success_rate < 70 OR p_error_rate > 30 OR p_consecutive_failures >= 5 THEN
    RETURN 'critical';
  END IF;
  IF p_success_rate < 85 OR p_error_rate > 15 OR p_consecutive_failures >= 3 THEN
    RETURN 'degraded';
  END IF;
  RETURN 'healthy';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 3: AGENT BUSINESS RULES
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_business_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 100,
  enforcement_level TEXT DEFAULT 'block',
  escalate_on_violation BOOLEAN DEFAULT false,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, agent_name, rule_name),
  CONSTRAINT valid_rule_type CHECK (rule_type IN ('constraint', 'validation', 'escalation', 'cost_limit')),
  CONSTRAINT valid_enforcement_level CHECK (enforcement_level IN ('block', 'warn', 'log'))
);

CREATE INDEX IF NOT EXISTS idx_agent_rules_workspace ON agent_business_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_rules_agent ON agent_business_rules(agent_name, enabled) WHERE enabled = true;

ALTER TABLE agent_business_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace rules" ON agent_business_rules;
CREATE POLICY "Users can view their workspace rules" ON agent_business_rules FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can manage rules" ON agent_business_rules;
CREATE POLICY "System can manage rules" ON agent_business_rules FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PART 4: AGENT RULE VIOLATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_rule_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES agent_business_rules(id) ON DELETE SET NULL,
  agent_name TEXT NOT NULL,
  execution_id TEXT, -- Changed from UUID FK to TEXT

  violation_type TEXT NOT NULL,
  attempted_action JSONB NOT NULL,
  rule_violated JSONB,
  severity TEXT NOT NULL DEFAULT 'medium',
  action_taken TEXT NOT NULL,
  escalation_id UUID,
  resolution_notes TEXT,

  violated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_violation_type CHECK (violation_type IN ('constraint_exceeded', 'validation_failed', 'cost_limit_exceeded', 'escalation_triggered')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_action_taken CHECK (action_taken IN ('blocked', 'allowed_with_warning', 'escalated', 'logged_only'))
);

CREATE INDEX IF NOT EXISTS idx_rule_violations_workspace ON agent_rule_violations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_rule_violations_agent ON agent_rule_violations(agent_name, violated_at DESC);

ALTER TABLE agent_rule_violations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace violations" ON agent_rule_violations;
CREATE POLICY "Users can view their workspace violations" ON agent_rule_violations FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert violations" ON agent_rule_violations;
CREATE POLICY "System can insert violations" ON agent_rule_violations FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 5: AGENT ESCALATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  execution_id TEXT, -- Changed from UUID FK to TEXT

  escalation_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  context JSONB,

  requires_approval BOOLEAN DEFAULT false,
  approval_status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approval_reason TEXT,
  approved_at TIMESTAMPTZ,

  action_taken TEXT,
  auto_resolved BOOLEAN DEFAULT false,
  resolution_details JSONB,

  escalated_to UUID REFERENCES auth.users(id),
  escalation_chain JSONB,
  current_approver_index INTEGER DEFAULT 0,

  escalated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_escalation_type CHECK (escalation_type IN ('rule_violation', 'health_degraded', 'cost_exceeded', 'anomaly_detected', 'low_confidence', 'manual')),
  CONSTRAINT valid_severity CHECK (severity IN ('info', 'warning', 'critical')),
  CONSTRAINT valid_approval_status CHECK (approval_status IN ('pending', 'approved', 'rejected', 'auto_resolved'))
);

CREATE INDEX IF NOT EXISTS idx_escalations_workspace ON agent_escalations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON agent_escalations(approval_status, escalated_at DESC);
CREATE INDEX IF NOT EXISTS idx_escalations_agent ON agent_escalations(agent_name, severity);

ALTER TABLE agent_escalations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace escalations" ON agent_escalations;
CREATE POLICY "Users can view their workspace escalations" ON agent_escalations FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can create escalations" ON agent_escalations;
CREATE POLICY "System can create escalations" ON agent_escalations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "System can update escalations" ON agent_escalations;
CREATE POLICY "System can update escalations" ON agent_escalations FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- PART 6: ESCALATION CONFIG
-- ============================================================================

CREATE TABLE IF NOT EXISTS escalation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  escalation_chains JSONB NOT NULL DEFAULT '{"critical": [], "warning": [], "info": []}'::jsonb,
  auto_resolve_after_hours INTEGER DEFAULT 24,
  auto_approve_low_severity BOOLEAN DEFAULT false,
  notify_immediately BOOLEAN DEFAULT true,
  notification_channels JSONB DEFAULT '["dashboard"]'::jsonb,
  webhook_url TEXT,
  escalate_up_chain_after_hours INTEGER DEFAULT 4,
  max_pending_escalations INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_escalation_config_workspace ON escalation_config(workspace_id);

ALTER TABLE escalation_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their escalation config" ON escalation_config;
CREATE POLICY "Users can view their escalation config" ON escalation_config FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage escalation config" ON escalation_config;
CREATE POLICY "Admins can manage escalation config" ON escalation_config FOR ALL USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
  )
) WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
  )
);

-- ============================================================================
-- PART 7: AGENT VERIFICATION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_verification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  execution_id TEXT, -- Changed from UUID FK to TEXT
  agent_name TEXT NOT NULL,

  verification_type TEXT NOT NULL,
  input_data JSONB,
  expected_output JSONB,
  actual_output JSONB,

  passed BOOLEAN NOT NULL DEFAULT false,
  confidence DECIMAL(3,2),
  errors JSONB,
  warnings JSONB,

  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_verification_confidence CHECK (confidence >= 0 AND confidence <= 1)
);

CREATE INDEX IF NOT EXISTS idx_verification_logs_workspace ON agent_verification_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_agent ON agent_verification_logs(agent_name, verified_at DESC);

ALTER TABLE agent_verification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace verification logs" ON agent_verification_logs;
CREATE POLICY "Users can view their workspace verification logs" ON agent_verification_logs FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "System can insert verification logs" ON agent_verification_logs;
CREATE POLICY "System can insert verification logs" ON agent_verification_logs FOR INSERT WITH CHECK (true);

-- ============================================================================
-- PART 8: AGENT BUDGETS
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,

  daily_budget_usd DECIMAL(10,2),
  monthly_budget_usd DECIMAL(10,2),
  per_execution_limit_usd DECIMAL(10,2),

  daily_spent_usd DECIMAL(10,2) DEFAULT 0,
  monthly_spent_usd DECIMAL(10,2) DEFAULT 0,

  pause_on_exceed BOOLEAN DEFAULT true,
  alert_at_percentage INTEGER DEFAULT 80,

  daily_reset_at TIMESTAMPTZ DEFAULT (DATE_TRUNC('day', NOW()) + INTERVAL '1 day'),
  monthly_reset_at TIMESTAMPTZ DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, agent_name)
);

CREATE INDEX IF NOT EXISTS idx_agent_budgets_workspace ON agent_budgets(workspace_id);

ALTER TABLE agent_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace budgets" ON agent_budgets;
CREATE POLICY "Users can view their workspace budgets" ON agent_budgets FOR SELECT USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins can manage budgets" ON agent_budgets;
CREATE POLICY "Admins can manage budgets" ON agent_budgets FOR ALL USING (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
  )
) WITH CHECK (
  workspace_id IN (
    SELECT w.id FROM workspaces w
    INNER JOIN user_organizations uo ON uo.org_id = w.org_id
    WHERE uo.user_id = auth.uid() AND uo.role IN ('admin', 'owner')
  )
);

-- Trigger to update budget spent
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  v_budget RECORD;
BEGIN
  SELECT * INTO v_budget FROM agent_budgets
  WHERE workspace_id = NEW.workspace_id AND agent_name = NEW.agent_name;

  IF NOT FOUND THEN RETURN NEW; END IF;

  IF v_budget.daily_reset_at < NOW() THEN
    UPDATE agent_budgets SET daily_spent_usd = COALESCE(NEW.cost_usd, 0), daily_reset_at = DATE_TRUNC('day', NOW()) + INTERVAL '1 day'
    WHERE id = v_budget.id;
  ELSE
    UPDATE agent_budgets SET daily_spent_usd = daily_spent_usd + COALESCE(NEW.cost_usd, 0) WHERE id = v_budget.id;
  END IF;

  IF v_budget.monthly_reset_at < NOW() THEN
    UPDATE agent_budgets SET monthly_spent_usd = COALESCE(NEW.cost_usd, 0), monthly_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
    WHERE id = v_budget.id;
  ELSE
    UPDATE agent_budgets SET monthly_spent_usd = monthly_spent_usd + COALESCE(NEW.cost_usd, 0) WHERE id = v_budget.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_budget_spent ON agent_execution_metrics;
CREATE TRIGGER trigger_update_budget_spent
  AFTER INSERT ON agent_execution_metrics
  FOR EACH ROW
  WHEN (NEW.cost_usd IS NOT NULL AND NEW.cost_usd > 0)
  EXECUTE FUNCTION update_budget_spent();

-- ============================================================================
-- PART 9: AGENT KPIs VIEW
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS agent_kpis AS
SELECT
  workspace_id,
  agent_name,
  COUNT(*) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours') as executions_24h,
  AVG(execution_time_ms) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours') as avg_time_24h,
  (COUNT(*) FILTER (WHERE success = true AND executed_at > NOW() - INTERVAL '24 hours'))::DECIMAL /
    NULLIF(COUNT(*) FILTER (WHERE executed_at > NOW() - INTERVAL '24 hours'), 0) * 100 as success_rate_24h,
  SUM(cost_usd) FILTER (WHERE executed_at > NOW() - INTERVAL '30 days') as cost_30d,
  MAX(executed_at) as last_execution_at,
  COUNT(*) FILTER (WHERE success = false AND executed_at > NOW() - INTERVAL '24 hours') as failures_24h
FROM agent_execution_metrics
GROUP BY workspace_id, agent_name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_kpis_workspace_agent ON agent_kpis(workspace_id, agent_name);

CREATE OR REPLACE FUNCTION refresh_agent_kpis()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agent_kpis;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PART 10: HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION check_budget_available(
  p_workspace_id UUID,
  p_agent_name TEXT,
  p_estimated_cost_usd DECIMAL
)
RETURNS TABLE (
  within_budget BOOLEAN,
  daily_remaining DECIMAL,
  monthly_remaining DECIMAL,
  budget_type TEXT
) AS $$
DECLARE
  v_budget RECORD;
BEGIN
  SELECT * INTO v_budget FROM agent_budgets WHERE workspace_id = p_workspace_id AND agent_name = p_agent_name;

  IF NOT FOUND THEN
    RETURN QUERY SELECT true, NULL::DECIMAL, NULL::DECIMAL, 'none'::TEXT;
    RETURN;
  END IF;

  IF v_budget.per_execution_limit_usd IS NOT NULL AND p_estimated_cost_usd > v_budget.per_execution_limit_usd THEN
    RETURN QUERY SELECT false, NULL::DECIMAL, NULL::DECIMAL, 'per_execution'::TEXT;
    RETURN;
  END IF;

  IF v_budget.daily_budget_usd IS NOT NULL AND v_budget.daily_spent_usd + p_estimated_cost_usd > v_budget.daily_budget_usd THEN
    RETURN QUERY SELECT false, v_budget.daily_budget_usd - v_budget.daily_spent_usd, NULL::DECIMAL, 'daily'::TEXT;
    RETURN;
  END IF;

  IF v_budget.monthly_budget_usd IS NOT NULL AND v_budget.monthly_spent_usd + p_estimated_cost_usd > v_budget.monthly_budget_usd THEN
    RETURN QUERY SELECT false, NULL::DECIMAL, v_budget.monthly_budget_usd - v_budget.monthly_spent_usd, 'monthly'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true,
    CASE WHEN v_budget.daily_budget_usd IS NOT NULL THEN v_budget.daily_budget_usd - v_budget.daily_spent_usd ELSE NULL END,
    CASE WHEN v_budget.monthly_budget_usd IS NOT NULL THEN v_budget.monthly_budget_usd - v_budget.monthly_spent_usd ELSE NULL END,
    'none'::TEXT;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- SUCCESS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Project Vend Phase 2 migrations applied successfully';
  RAISE NOTICE '📊 Tables created: 8';
  RAISE NOTICE '📈 Views created: 1 materialized view';
  RAISE NOTICE '⚙️  Functions created: 3';
  RAISE NOTICE '🔒 RLS enabled on all tables';
  RAISE NOTICE '';
  RAISE NOTICE 'Next: Seed default rules (see PHASE2-MIGRATION-GUIDE.md)';
END $$;
