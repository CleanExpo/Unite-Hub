-- Migration 142: Global Regulatory Harmonisation & Region-Aware Policy Engine
-- Required by Phase 90 - Global Regulatory Harmonisation & Region-Aware Policy Engine (GRH-RAPE)
-- Unified global regulatory engine with region-aware policies

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS grh_global_posture CASCADE;
DROP TABLE IF EXISTS grh_region_policies CASCADE;
DROP TABLE IF EXISTS grh_frameworks CASCADE;

-- GRH frameworks table (global reference data)
CREATE TABLE grh_frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework TEXT NOT NULL,
  region TEXT NOT NULL,
  requirement TEXT NOT NULL,
  mapped_internal_control TEXT,
  severity TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Framework check
  CONSTRAINT grh_frameworks_framework_check CHECK (
    framework IN ('gdpr', 'ccpa', 'hipaa', 'app', 'pipeda', 'pci', 'iso27001')
  ),

  -- Severity check
  CONSTRAINT grh_frameworks_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grh_frameworks_framework ON grh_frameworks(framework);
CREATE INDEX IF NOT EXISTS idx_grh_frameworks_region ON grh_frameworks(region);
CREATE INDEX IF NOT EXISTS idx_grh_frameworks_severity ON grh_frameworks(severity);

-- Enable RLS
ALTER TABLE grh_frameworks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for all authenticated users - reference data)
CREATE POLICY grh_frameworks_select ON grh_frameworks
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

-- Comment
COMMENT ON TABLE grh_frameworks IS 'Global regulatory frameworks reference data (Phase 90)';

-- GRH region policies table
CREATE TABLE grh_region_policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  policy_type TEXT NOT NULL,
  policy_body JSONB DEFAULT '{}'::jsonb,
  generated_from_frameworks JSONB DEFAULT '[]'::jsonb,
  effective_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Policy type check
  CONSTRAINT grh_region_policies_type_check CHECK (
    policy_type IN ('data_retention', 'consent', 'breach_notification', 'access_control', 'encryption', 'audit', 'disposal')
  ),

  -- Foreign keys
  CONSTRAINT grh_region_policies_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grh_region_policies_tenant ON grh_region_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grh_region_policies_region ON grh_region_policies(region);
CREATE INDEX IF NOT EXISTS idx_grh_region_policies_type ON grh_region_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_grh_region_policies_effective ON grh_region_policies(effective_date);
CREATE INDEX IF NOT EXISTS idx_grh_region_policies_created ON grh_region_policies(created_at DESC);

-- Enable RLS
ALTER TABLE grh_region_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY grh_region_policies_select ON grh_region_policies
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY grh_region_policies_insert ON grh_region_policies
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- No UPDATE policy - policies are immutable for audit trail

-- Comment
COMMENT ON TABLE grh_region_policies IS 'Region-specific generated policies (Phase 90)';

-- GRH global posture table
CREATE TABLE grh_global_posture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  region TEXT NOT NULL,
  framework TEXT NOT NULL,
  compliance_score NUMERIC NOT NULL DEFAULT 0,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  last_evaluated TIMESTAMPTZ DEFAULT NOW(),

  -- Score range
  CONSTRAINT grh_global_posture_score_check CHECK (
    compliance_score >= 0 AND compliance_score <= 100
  ),

  -- Unique constraint for upsert
  CONSTRAINT grh_global_posture_unique UNIQUE (tenant_id, region, framework),

  -- Foreign keys
  CONSTRAINT grh_global_posture_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_grh_global_posture_tenant ON grh_global_posture(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grh_global_posture_region ON grh_global_posture(region);
CREATE INDEX IF NOT EXISTS idx_grh_global_posture_framework ON grh_global_posture(framework);
CREATE INDEX IF NOT EXISTS idx_grh_global_posture_score ON grh_global_posture(compliance_score);
CREATE INDEX IF NOT EXISTS idx_grh_global_posture_evaluated ON grh_global_posture(last_evaluated DESC);

-- Enable RLS
ALTER TABLE grh_global_posture ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY grh_global_posture_select ON grh_global_posture
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY grh_global_posture_insert ON grh_global_posture
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY grh_global_posture_update ON grh_global_posture
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE grh_global_posture IS 'Global compliance posture scores (Phase 90)';

-- Insert sample framework data
INSERT INTO grh_frameworks (framework, region, requirement, mapped_internal_control, severity) VALUES
-- GDPR (EU)
('gdpr', 'eu', 'Right to be forgotten', 'data_deletion_process', 'high'),
('gdpr', 'eu', 'Data breach notification within 72 hours', 'breach_notification_process', 'critical'),
('gdpr', 'eu', 'Explicit consent for data processing', 'consent_management', 'high'),
('gdpr', 'eu', 'Data minimization', 'data_collection_limits', 'medium'),
-- CCPA (California)
('ccpa', 'california', 'Right to know what data is collected', 'data_inventory', 'medium'),
('ccpa', 'california', 'Right to opt-out of data sale', 'opt_out_mechanism', 'high'),
('ccpa', 'california', 'Right to deletion', 'data_deletion_process', 'high'),
-- HIPAA (USA Healthcare)
('hipaa', 'usa', 'PHI encryption at rest', 'encryption_at_rest', 'critical'),
('hipaa', 'usa', 'Access controls for PHI', 'role_based_access', 'critical'),
('hipaa', 'usa', 'Audit trails for PHI access', 'audit_logging', 'high'),
-- PCI-DSS (Global)
('pci', 'global', 'Encrypt cardholder data', 'encryption_at_rest', 'critical'),
('pci', 'global', 'Restrict access to cardholder data', 'access_control_policy', 'critical'),
('pci', 'global', 'Regular security testing', 'penetration_testing', 'high');
