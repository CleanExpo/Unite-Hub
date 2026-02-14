-- Migration 189: Extended Evolution Layer v2 (Macro Evolution)
-- Phase 146: Evolution system for macro-level improvements requiring human approval

-- Macro evolution proposals table
CREATE TABLE IF NOT EXISTS macro_evolution_proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('tenant', 'region', 'global')),
  affected_engines JSONB NOT NULL DEFAULT '[]',
  affected_regions JSONB DEFAULT '[]',
  impact_estimate JSONB NOT NULL,
  risk_matrix JSONB NOT NULL,
  truth_layer_validation JSONB,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('proposed', 'under_review', 'approved', 'rejected', 'executed')) DEFAULT 'proposed',
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_macro_proposals_tenant ON macro_evolution_proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_macro_proposals_status ON macro_evolution_proposals(status);
CREATE INDEX IF NOT EXISTS idx_macro_proposals_scope ON macro_evolution_proposals(scope);

-- RLS
ALTER TABLE macro_evolution_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view macro proposals" ON macro_evolution_proposals;
CREATE POLICY "Users can view macro proposals" ON macro_evolution_proposals
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage macro proposals" ON macro_evolution_proposals;
CREATE POLICY "Users can manage macro proposals" ON macro_evolution_proposals
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
