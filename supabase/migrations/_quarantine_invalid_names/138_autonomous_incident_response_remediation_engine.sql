-- Migration 138: Autonomous Incident Response & Remediation Engine
-- Required by Phase 86 - Autonomous Incident Response & Remediation Engine (AIRE)
-- Closed-loop incident response with runbooks and remediation

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS aire_actions_log CASCADE;
DROP TABLE IF EXISTS aire_runbooks CASCADE;
DROP TABLE IF EXISTS aire_incidents CASCADE;

-- AIRE incidents table
CREATE TABLE aire_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  linked_forecast_id UUID,
  linked_event_id UUID,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  summary TEXT,
  root_cause_hypothesis TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  -- Source check
  CONSTRAINT aire_incidents_source_check CHECK (
    source IN ('upewe', 'asrs', 'mcse', 'hsoe', 'manual', 'system')
  ),

  -- Severity check
  CONSTRAINT aire_incidents_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT aire_incidents_status_check CHECK (
    status IN ('open', 'investigating', 'remediating', 'awaiting_approval', 'resolved', 'closed')
  ),

  -- Foreign keys
  CONSTRAINT aire_incidents_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT aire_incidents_created_by_fk
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aire_incidents_tenant ON aire_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_source ON aire_incidents(source);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_severity ON aire_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_status ON aire_incidents(status);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_forecast ON aire_incidents(linked_forecast_id);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_event ON aire_incidents(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_created ON aire_incidents(created_at DESC);

-- Enable RLS
ALTER TABLE aire_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aire_incidents_select ON aire_incidents
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_incidents_insert ON aire_incidents
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_incidents_update ON aire_incidents
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aire_incidents IS 'Autonomous and manual incidents (Phase 86)';

-- AIRE runbooks table
CREATE TABLE aire_runbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity_scope TEXT NOT NULL DEFAULT 'all',
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  requires_hsoe_approval BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Severity scope check
  CONSTRAINT aire_runbooks_severity_scope_check CHECK (
    severity_scope IN ('all', 'low', 'medium', 'high', 'critical')
  ),

  -- Foreign keys
  CONSTRAINT aire_runbooks_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aire_runbooks_tenant ON aire_runbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aire_runbooks_name ON aire_runbooks(name);
CREATE INDEX IF NOT EXISTS idx_aire_runbooks_severity ON aire_runbooks(severity_scope);
CREATE INDEX IF NOT EXISTS idx_aire_runbooks_enabled ON aire_runbooks(enabled);

-- Enable RLS
ALTER TABLE aire_runbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aire_runbooks_select ON aire_runbooks
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_runbooks_insert ON aire_runbooks
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_runbooks_update ON aire_runbooks
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_runbooks_delete ON aire_runbooks
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aire_runbooks IS 'Incident runbooks with triggers and actions (Phase 86)';

-- AIRE actions log table
CREATE TABLE aire_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  incident_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  initiated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Action type check
  CONSTRAINT aire_actions_log_type_check CHECK (
    action_type IN (
      'notify', 'block', 'rollback', 'restart', 'scale_down',
      'disable_feature', 'escalate', 'auto_remediate', 'manual_action'
    )
  ),

  -- Status check
  CONSTRAINT aire_actions_log_status_check CHECK (
    status IN ('pending', 'running', 'success', 'failed', 'skipped', 'rolled_back')
  ),

  -- Foreign keys
  CONSTRAINT aire_actions_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT aire_actions_log_incident_fk
    FOREIGN KEY (incident_id) REFERENCES aire_incidents(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_tenant ON aire_actions_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_incident ON aire_actions_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_type ON aire_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_status ON aire_actions_log(status);
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_created ON aire_actions_log(created_at DESC);

-- Enable RLS
ALTER TABLE aire_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aire_actions_log_select ON aire_actions_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_actions_log_insert ON aire_actions_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_actions_log_update ON aire_actions_log
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aire_actions_log IS 'Incident remediation and rollback actions (Phase 86)';
