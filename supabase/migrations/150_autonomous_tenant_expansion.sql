-- Migration 150: Autonomous Tenant Expansion & Multi-Region Deployment Engine
-- Required by Phase 98 - ATEMRDE
-- Zero-touch tenant onboarding and region expansion

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS atemrde_provisioning_log CASCADE;
DROP TABLE IF EXISTS atemrde_expansion_requests CASCADE;

-- ATEMRDE expansion requests table
CREATE TABLE atemrde_expansion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  expansion_type TEXT NOT NULL,
  target_region TEXT,
  configuration JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Expansion type check
  CONSTRAINT atemrde_expansion_type_check CHECK (
    expansion_type IN ('region', 'engine', 'compliance', 'capacity')
  ),

  -- Status check
  CONSTRAINT atemrde_expansion_status_check CHECK (
    status IN ('pending', 'provisioning', 'completed', 'failed')
  ),

  -- Foreign keys
  CONSTRAINT atemrde_expansion_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_atemrde_expansion_tenant ON atemrde_expansion_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_atemrde_expansion_status ON atemrde_expansion_requests(status);
CREATE INDEX IF NOT EXISTS idx_atemrde_expansion_type ON atemrde_expansion_requests(expansion_type);

-- Enable RLS
ALTER TABLE atemrde_expansion_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY atemrde_expansion_select ON atemrde_expansion_requests
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY atemrde_expansion_insert ON atemrde_expansion_requests
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE atemrde_expansion_requests IS 'Tenant expansion requests (Phase 98)';

-- ATEMRDE provisioning log table
CREATE TABLE atemrde_provisioning_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT atemrde_provisioning_status_check CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'skipped')
  ),

  -- Foreign keys
  CONSTRAINT atemrde_provisioning_request_fk
    FOREIGN KEY (request_id) REFERENCES atemrde_expansion_requests(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_atemrde_provisioning_request ON atemrde_provisioning_log(request_id);
CREATE INDEX IF NOT EXISTS idx_atemrde_provisioning_status ON atemrde_provisioning_log(status);

-- Enable RLS
ALTER TABLE atemrde_provisioning_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY atemrde_provisioning_select ON atemrde_provisioning_log
  FOR SELECT TO authenticated
  USING (request_id IN (
    SELECT id FROM atemrde_expansion_requests WHERE tenant_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE atemrde_provisioning_log IS 'Provisioning step logs (Phase 98)';
