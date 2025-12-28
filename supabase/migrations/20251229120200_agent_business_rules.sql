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
