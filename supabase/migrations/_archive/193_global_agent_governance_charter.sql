-- Migration 193: Global Agent Governance Charter (GAGC)
-- Phase 150: Machine-readable global charter for agent governance

-- Global governance charter table
CREATE TABLE IF NOT EXISTS global_governance_charter (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  charter_document JSONB NOT NULL,
  autonomy_rules JSONB NOT NULL,
  cross_tenant_rules JSONB NOT NULL,
  emergency_stop_conditions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ
);

-- Charter version history table
CREATE TABLE IF NOT EXISTS charter_version_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  charter_id UUID REFERENCES global_governance_charter(id) ON DELETE CASCADE,
  previous_version TEXT,
  change_summary TEXT NOT NULL,
  changed_by UUID NOT NULL,
  change_reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Charter compliance checks table
CREATE TABLE IF NOT EXISTS charter_compliance_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  charter_version TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  is_compliant BOOLEAN NOT NULL,
  violations JSONB DEFAULT '[]',
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_charter_active ON global_governance_charter(is_active);
CREATE INDEX IF NOT EXISTS idx_charter_version ON global_governance_charter(version);
CREATE INDEX IF NOT EXISTS idx_charter_history ON charter_version_history(charter_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_tenant ON charter_compliance_checks(tenant_id);

-- RLS
ALTER TABLE global_governance_charter ENABLE ROW LEVEL SECURITY;
ALTER TABLE charter_version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE charter_compliance_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view charter" ON global_governance_charter;
CREATE POLICY "Authenticated users can view charter" ON global_governance_charter
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can view charter history" ON charter_version_history;
CREATE POLICY "Authenticated users can view charter history" ON charter_version_history
  FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view compliance checks" ON charter_compliance_checks;
CREATE POLICY "Users can view compliance checks" ON charter_compliance_checks
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
