-- Migration 188: Agent Role Profiles & Mandates (ARPM)
-- Phase 145: Explicit role, permissions, risk caps, and autonomy levels for agents

-- Agent mandates table
CREATE TABLE IF NOT EXISTS agent_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  role_description TEXT NOT NULL,
  action_scope JSONB NOT NULL DEFAULT '[]',
  forbidden_actions JSONB DEFAULT '[]',
  risk_cap TEXT NOT NULL CHECK (risk_cap IN ('minimal', 'low', 'medium', 'high')) DEFAULT 'low',
  autonomy_level INTEGER NOT NULL CHECK (autonomy_level >= 0 AND autonomy_level <= 5) DEFAULT 1,
  requires_human_approval BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, agent_name)
);

-- Mandate change logs table
CREATE TABLE IF NOT EXISTS mandate_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id UUID REFERENCES agent_mandates(id) ON DELETE CASCADE,
  changed_by UUID NOT NULL,
  change_type TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  reason TEXT,
  was_previewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_mandates_tenant ON agent_mandates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_mandates_name ON agent_mandates(agent_name);
CREATE INDEX IF NOT EXISTS idx_mandate_logs_mandate ON mandate_change_logs(mandate_id);

-- RLS
ALTER TABLE agent_mandates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mandate_change_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view agent mandates" ON agent_mandates;
CREATE POLICY "Users can view agent mandates" ON agent_mandates
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage agent mandates" ON agent_mandates;
CREATE POLICY "Users can manage agent mandates" ON agent_mandates
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view mandate logs" ON mandate_change_logs;
CREATE POLICY "Users can view mandate logs" ON mandate_change_logs
  FOR SELECT USING (
    mandate_id IN (SELECT id FROM agent_mandates WHERE tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );
