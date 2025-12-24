-- Migration 135: Autonomous Safety & Risk Supervisor
-- Required by Phase 83 - Autonomous Safety & Risk Supervisor (ASRS)
-- Real-time safety engine that intercepts all MAOS orchestrator actions

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS asrs_block_log CASCADE;
DROP TABLE IF EXISTS asrs_policy_rules CASCADE;
DROP TABLE IF EXISTS asrs_events CASCADE;

-- ASRS events table
CREATE TABLE asrs_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  outcome TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source check
  CONSTRAINT asrs_events_source_check CHECK (
    source IN ('maos', 'deep_agent', 'adre', 'voice', 'hsoe', 'manual', 'system')
  ),

  -- Outcome check
  CONSTRAINT asrs_events_outcome_check CHECK (
    outcome IN ('pending', 'allowed', 'blocked', 'escalated', 'deferred')
  ),

  -- Risk score range
  CONSTRAINT asrs_events_risk_score_check CHECK (
    risk_score >= 0 AND risk_score <= 100
  ),

  -- Foreign keys
  CONSTRAINT asrs_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asrs_events_tenant ON asrs_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asrs_events_source ON asrs_events(source);
CREATE INDEX IF NOT EXISTS idx_asrs_events_action ON asrs_events(action_type);
CREATE INDEX IF NOT EXISTS idx_asrs_events_risk ON asrs_events(risk_score);
CREATE INDEX IF NOT EXISTS idx_asrs_events_outcome ON asrs_events(outcome);
CREATE INDEX IF NOT EXISTS idx_asrs_events_created ON asrs_events(created_at DESC);

-- Enable RLS
ALTER TABLE asrs_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY asrs_events_select ON asrs_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_events_insert ON asrs_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_events_update ON asrs_events
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE asrs_events IS 'Safety events tracked by ASRS (Phase 83)';

-- ASRS policy rules table
CREATE TABLE asrs_policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  condition_type TEXT NOT NULL,
  condition_value JSONB DEFAULT '{}'::jsonb,
  action_on_match TEXT NOT NULL DEFAULT 'block',
  priority INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Condition type check
  CONSTRAINT asrs_policy_rules_condition_check CHECK (
    condition_type IN ('risk_threshold', 'action_pattern', 'source_filter', 'payload_match', 'time_window', 'rate_limit')
  ),

  -- Action on match check
  CONSTRAINT asrs_policy_rules_action_check CHECK (
    action_on_match IN ('allow', 'block', 'escalate', 'defer', 'notify')
  ),

  -- Foreign keys
  CONSTRAINT asrs_policy_rules_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_tenant ON asrs_policy_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_name ON asrs_policy_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_condition ON asrs_policy_rules(condition_type);
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_action ON asrs_policy_rules(action_on_match);
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_priority ON asrs_policy_rules(priority);
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_active ON asrs_policy_rules(is_active);

-- Enable RLS
ALTER TABLE asrs_policy_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY asrs_policy_rules_select ON asrs_policy_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_policy_rules_insert ON asrs_policy_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_policy_rules_update ON asrs_policy_rules
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_policy_rules_delete ON asrs_policy_rules
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE asrs_policy_rules IS 'Dynamic policy rules for ASRS (Phase 83)';

-- ASRS block log table
CREATE TABLE asrs_block_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL,
  rule_id UUID,
  block_reason TEXT NOT NULL,
  risk_score_at_block NUMERIC NOT NULL,
  escalated_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT asrs_block_log_event_fk
    FOREIGN KEY (event_id) REFERENCES asrs_events(id) ON DELETE CASCADE,
  CONSTRAINT asrs_block_log_rule_fk
    FOREIGN KEY (rule_id) REFERENCES asrs_policy_rules(id) ON DELETE SET NULL,
  CONSTRAINT asrs_block_log_escalated_fk
    FOREIGN KEY (escalated_to) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asrs_block_log_event ON asrs_block_log(event_id);
CREATE INDEX IF NOT EXISTS idx_asrs_block_log_rule ON asrs_block_log(rule_id);
CREATE INDEX IF NOT EXISTS idx_asrs_block_log_escalated ON asrs_block_log(escalated_to);
CREATE INDEX IF NOT EXISTS idx_asrs_block_log_created ON asrs_block_log(created_at DESC);

-- Enable RLS
ALTER TABLE asrs_block_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via asrs_events)
CREATE POLICY asrs_block_log_select ON asrs_block_log
  FOR SELECT TO authenticated
  USING (event_id IN (
    SELECT id FROM asrs_events
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY asrs_block_log_insert ON asrs_block_log
  FOR INSERT TO authenticated
  WITH CHECK (event_id IN (
    SELECT id FROM asrs_events
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE asrs_block_log IS 'Blocked action log for ASRS (Phase 83)';
