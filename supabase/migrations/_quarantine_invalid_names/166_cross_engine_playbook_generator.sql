-- Migration 166: Cross-Engine Playbook Generator (CEPG)
-- Phase 123: Generates multi-step playbooks across engines

CREATE TABLE IF NOT EXISTS intelligence_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('growth', 'risk', 'optimization', 'recovery', 'expansion')),
  playbook_steps JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'completed', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_playbooks_tenant ON intelligence_playbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_playbooks_scope ON intelligence_playbooks(scope);
CREATE INDEX IF NOT EXISTS idx_playbooks_status ON intelligence_playbooks(status);

ALTER TABLE intelligence_playbooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage playbooks" ON intelligence_playbooks;
CREATE POLICY "Users can manage playbooks" ON intelligence_playbooks FOR ALL
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

COMMENT ON TABLE intelligence_playbooks IS 'Phase 123: Cross-engine intelligence playbooks';
