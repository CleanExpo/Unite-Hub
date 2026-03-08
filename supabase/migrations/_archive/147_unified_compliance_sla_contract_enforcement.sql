-- Migration 147: Unified Compliance, SLA & Contract Enforcement Layer
-- Required by Phase 95 - UCSCEL
-- Unified enforcement layer for contracts, SLAs, and compliance

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS ucscel_enforcement_log CASCADE;
DROP TABLE IF EXISTS ucscel_contracts CASCADE;

-- UCSCEL contracts table
CREATE TABLE ucscel_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  contract_body JSONB DEFAULT '{}'::jsonb,
  sla_terms JSONB DEFAULT '{}'::jsonb,
  compliance_terms JSONB DEFAULT '{}'::jsonb,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT ucscel_contracts_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ucscel_contracts_tenant ON ucscel_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ucscel_contracts_effective ON ucscel_contracts(effective_date DESC);

-- Enable RLS
ALTER TABLE ucscel_contracts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ucscel_contracts_select ON ucscel_contracts
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ucscel_contracts_insert ON ucscel_contracts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ucscel_contracts IS 'Contracts with SLA and compliance terms (Phase 95)';

-- UCSCEL enforcement log table
CREATE TABLE ucscel_enforcement_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Event type check
  CONSTRAINT ucscel_enforcement_log_type_check CHECK (
    event_type IN (
      'sla_breach', 'compliance_violation', 'contract_check',
      'warning_issued', 'action_blocked', 'audit_triggered'
    )
  ),

  -- Foreign keys
  CONSTRAINT ucscel_enforcement_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ucscel_enforcement_log_tenant ON ucscel_enforcement_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ucscel_enforcement_log_type ON ucscel_enforcement_log(event_type);
CREATE INDEX IF NOT EXISTS idx_ucscel_enforcement_log_created ON ucscel_enforcement_log(created_at DESC);

-- Enable RLS
ALTER TABLE ucscel_enforcement_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ucscel_enforcement_log_select ON ucscel_enforcement_log
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ucscel_enforcement_log_insert ON ucscel_enforcement_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ucscel_enforcement_log IS 'Enforcement events for audit (Phase 95)';
