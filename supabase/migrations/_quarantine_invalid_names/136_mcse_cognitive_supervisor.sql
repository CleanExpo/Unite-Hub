-- Migration 136: MAOS Cognitive Supervisor Engine
-- Required by Phase 84 - MAOS Cognitive Supervisor Engine (MCSE)
-- Reasoning validation and hallucination detection layer

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS mcse_policy_rules CASCADE;
DROP TABLE IF EXISTS mcse_cognitive_events CASCADE;

-- MCSE cognitive events table
CREATE TABLE mcse_cognitive_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  logic_score NUMERIC NOT NULL DEFAULT 100,
  hallucination_score NUMERIC NOT NULL DEFAULT 0,
  recommended_action TEXT NOT NULL DEFAULT 'allow',
  original_plan JSONB DEFAULT '{}'::jsonb,
  sanitised_plan JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source check
  CONSTRAINT mcse_cognitive_events_source_check CHECK (
    source IN ('maos', 'adre', 'voice', 'deep_agent', 'manual', 'system')
  ),

  -- Recommended action check
  CONSTRAINT mcse_cognitive_events_action_check CHECK (
    recommended_action IN ('allow', 'sanitise', 'block', 'escalate', 'defer')
  ),

  -- Score ranges
  CONSTRAINT mcse_cognitive_events_logic_score_check CHECK (
    logic_score >= 0 AND logic_score <= 100
  ),

  CONSTRAINT mcse_cognitive_events_hallucination_score_check CHECK (
    hallucination_score >= 0 AND hallucination_score <= 100
  ),

  -- Foreign keys
  CONSTRAINT mcse_cognitive_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_tenant ON mcse_cognitive_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_source ON mcse_cognitive_events(source);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_action ON mcse_cognitive_events(recommended_action);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_logic ON mcse_cognitive_events(logic_score);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_hallucination ON mcse_cognitive_events(hallucination_score);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_created ON mcse_cognitive_events(created_at DESC);

-- Enable RLS
ALTER TABLE mcse_cognitive_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mcse_cognitive_events_select ON mcse_cognitive_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_cognitive_events_insert ON mcse_cognitive_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_cognitive_events_update ON mcse_cognitive_events
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE mcse_cognitive_events IS 'Cognitive reasoning analysis events (Phase 84)';

-- MCSE policy rules table
CREATE TABLE mcse_policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT mcse_policy_rules_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcse_policy_rules_tenant ON mcse_policy_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcse_policy_rules_name ON mcse_policy_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_mcse_policy_rules_enabled ON mcse_policy_rules(enabled);

-- Enable RLS
ALTER TABLE mcse_policy_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mcse_policy_rules_select ON mcse_policy_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_policy_rules_insert ON mcse_policy_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_policy_rules_update ON mcse_policy_rules
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_policy_rules_delete ON mcse_policy_rules
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE mcse_policy_rules IS 'Cognitive validation policy rules (Phase 84)';
