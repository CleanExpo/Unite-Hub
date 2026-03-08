-- Migration 184: Tenant Intelligence Boundary Engine (TIBE)
-- Phase 141: Strict boundary rules for cross-tenant intelligence sharing

-- Intelligence boundary policies table
CREATE TABLE IF NOT EXISTS intelligence_boundary_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  intel_type TEXT NOT NULL,
  classification TEXT NOT NULL CHECK (classification IN ('local_only', 'anonymised_ok', 'aggregate_only')),
  anonymisation_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Boundary crossing audit logs table
CREATE TABLE IF NOT EXISTS boundary_crossing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_tenant_id UUID NOT NULL,
  target_scope TEXT NOT NULL CHECK (target_scope IN ('global', 'cohort', 'specific')),
  intel_type TEXT NOT NULL,
  classification TEXT NOT NULL,
  was_anonymised BOOLEAN NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  validation_passed BOOLEAN NOT NULL,
  validation_errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_boundary_policies_tenant ON intelligence_boundary_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_boundary_logs_source ON boundary_crossing_logs(source_tenant_id);
CREATE INDEX IF NOT EXISTS idx_boundary_logs_created ON boundary_crossing_logs(created_at);

-- RLS
ALTER TABLE intelligence_boundary_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE boundary_crossing_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view boundary policies" ON intelligence_boundary_policies;
CREATE POLICY "Users can view boundary policies" ON intelligence_boundary_policies
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage boundary policies" ON intelligence_boundary_policies;
CREATE POLICY "Users can manage boundary policies" ON intelligence_boundary_policies
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view boundary logs" ON boundary_crossing_logs;
CREATE POLICY "Users can view boundary logs" ON boundary_crossing_logs
  FOR SELECT USING (
    source_tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
