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
