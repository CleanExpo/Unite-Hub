-- Migration 175: Experimentation Sandbox Engine
-- Phase 132: Sandboxed environment for testing evolution ideas safely

-- Experiment sandboxes table
CREATE TABLE IF NOT EXISTS experiment_sandboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sandbox_config JSONB NOT NULL DEFAULT '{}',
  cloned_from JSONB,
  results JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('setup', 'running', 'completed', 'archived')) DEFAULT 'setup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_experiment_sandboxes_tenant ON experiment_sandboxes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_experiment_sandboxes_status ON experiment_sandboxes(status);

-- RLS
ALTER TABLE experiment_sandboxes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sandboxes" ON experiment_sandboxes;
CREATE POLICY "Users can view sandboxes" ON experiment_sandboxes
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage sandboxes" ON experiment_sandboxes;
CREATE POLICY "Users can manage sandboxes" ON experiment_sandboxes
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
