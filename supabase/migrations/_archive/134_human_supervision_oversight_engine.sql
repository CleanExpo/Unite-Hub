-- Migration 134: Human Supervision & Oversight Engine
-- Required by Phase 82 - Human Supervision & Oversight Engine (HSOE)
-- Unified human-approval, review, and override system

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS hsoe_audit_log CASCADE;
DROP TABLE IF EXISTS hsoe_approvals CASCADE;
DROP TABLE IF EXISTS hsoe_requests CASCADE;

-- HSOE requests table
CREATE TABLE hsoe_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  trigger_source TEXT NOT NULL,
  action_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT hsoe_requests_risk_level_check CHECK (
    risk_level IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT hsoe_requests_status_check CHECK (
    status IN ('pending', 'in_review', 'approved', 'denied', 'escalated', 'expired')
  ),

  -- Trigger source check
  CONSTRAINT hsoe_requests_trigger_source_check CHECK (
    trigger_source IN ('maos', 'deep_agent', 'adre', 'voice', 'manual', 'system')
  ),

  -- Foreign keys
  CONSTRAINT hsoe_requests_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT hsoe_requests_created_by_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_tenant ON hsoe_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_status ON hsoe_requests(status);
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_risk ON hsoe_requests(risk_level);
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_source ON hsoe_requests(trigger_source);
CREATE INDEX IF NOT EXISTS idx_hsoe_requests_created ON hsoe_requests(created_at DESC);

-- Enable RLS
ALTER TABLE hsoe_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY hsoe_requests_select ON hsoe_requests
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY hsoe_requests_insert ON hsoe_requests
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY hsoe_requests_update ON hsoe_requests
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE hsoe_requests IS 'Human oversight requests (Phase 82)';

-- HSOE approvals table
CREATE TABLE hsoe_approvals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL,
  approver_id UUID NOT NULL,
  approval_level TEXT NOT NULL,
  decision TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Approval level check
  CONSTRAINT hsoe_approvals_level_check CHECK (
    approval_level IN ('technician', 'manager', 'director', 'admin')
  ),

  -- Decision check
  CONSTRAINT hsoe_approvals_decision_check CHECK (
    decision IN ('approve', 'deny', 'escalate', 'defer')
  ),

  -- Foreign keys
  CONSTRAINT hsoe_approvals_request_fk
    FOREIGN KEY (request_id) REFERENCES hsoe_requests(id) ON DELETE CASCADE,
  CONSTRAINT hsoe_approvals_approver_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (approver_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_request ON hsoe_approvals(request_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_approver ON hsoe_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_level ON hsoe_approvals(approval_level);
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_decision ON hsoe_approvals(decision);
CREATE INDEX IF NOT EXISTS idx_hsoe_approvals_created ON hsoe_approvals(created_at DESC);

-- Enable RLS
ALTER TABLE hsoe_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via hsoe_requests)
CREATE POLICY hsoe_approvals_select ON hsoe_approvals
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND request_id IN (
    SELECT id FROM hsoe_requests
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY hsoe_approvals_insert ON hsoe_approvals
  FOR INSERT TO authenticated
  WITH CHECK (request_id IN (
    SELECT id FROM hsoe_requests
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE hsoe_approvals IS 'Human oversight approvals (Phase 82)';

-- HSOE audit log table
CREATE TABLE hsoe_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  actor_id UUID,
  timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Event type check
  CONSTRAINT hsoe_audit_log_event_check CHECK (
    event_type IN (
      'created', 'viewed', 'approved', 'denied', 'escalated',
      'expired', 'overridden', 'comment_added', 'status_changed'
    )
  ),

  -- Foreign keys
  CONSTRAINT hsoe_audit_log_request_fk
    FOREIGN KEY (request_id) REFERENCES hsoe_requests(id) ON DELETE CASCADE,
  CONSTRAINT hsoe_audit_log_actor_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hsoe_audit_log_request ON hsoe_audit_log(request_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_audit_log_event ON hsoe_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_hsoe_audit_log_actor ON hsoe_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_hsoe_audit_log_timestamp ON hsoe_audit_log(timestamp DESC);

-- Enable RLS
ALTER TABLE hsoe_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via hsoe_requests)
CREATE POLICY hsoe_audit_log_select ON hsoe_audit_log
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND request_id IN (
    SELECT id FROM hsoe_requests
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY hsoe_audit_log_insert ON hsoe_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (request_id IN (
    SELECT id FROM hsoe_requests
    WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE hsoe_audit_log IS 'Human oversight audit log (Phase 82)';
