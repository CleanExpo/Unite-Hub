-- Migration 104: Autonomous Compliance Engine
-- Required by Phase 52 - Autonomous Compliance Engine (ACE)
-- Compliance governance with violation detection and auto-resolution

-- Compliance events table
CREATE TABLE IF NOT EXISTS compliance_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT compliance_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_events_org ON compliance_events(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_events_source ON compliance_events(source);
CREATE INDEX IF NOT EXISTS idx_compliance_events_type ON compliance_events(event_type);
CREATE INDEX IF NOT EXISTS idx_compliance_events_occurred ON compliance_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE compliance_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY compliance_events_select ON compliance_events
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY compliance_events_insert ON compliance_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE compliance_events IS 'Compliance audit events (Phase 52)';

-- Compliance violations table
CREATE TABLE IF NOT EXISTS compliance_violations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL,
  severity TEXT NOT NULL DEFAULT 'LOW',
  rule TEXT NOT NULL,
  description TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Severity check
  CONSTRAINT compliance_violations_severity_check CHECK (
    severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),

  -- Foreign key
  CONSTRAINT compliance_violations_event_fk
    FOREIGN KEY (event_id) REFERENCES compliance_events(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_violations_event ON compliance_violations(event_id);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_resolved ON compliance_violations(resolved) WHERE resolved = false;
CREATE INDEX IF NOT EXISTS idx_compliance_violations_rule ON compliance_violations(rule);

-- Enable RLS
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY compliance_violations_select ON compliance_violations
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND event_id IN (
    SELECT id FROM compliance_events
    WHERE org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  ));

CREATE POLICY compliance_violations_insert ON compliance_violations
  FOR INSERT TO authenticated
  WITH CHECK (event_id IN (
    SELECT id FROM compliance_events
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY compliance_violations_update ON compliance_violations
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND event_id IN (
    SELECT id FROM compliance_events
    WHERE org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  ));

-- Comment
COMMENT ON TABLE compliance_violations IS 'Detected compliance violations (Phase 52)';
