-- Migration 177: Knowledge Distillation Engine
-- Phase 134: Distils patterns into structured knowledge artifacts

-- Knowledge artifacts table
CREATE TABLE IF NOT EXISTS knowledge_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL CHECK (artifact_type IN ('guide', 'sop', 'faq', 'playbook', 'checklist')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source_systems JSONB NOT NULL DEFAULT '[]',
  is_example BOOLEAN DEFAULT false,
  tags JSONB DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_artifacts_tenant ON knowledge_artifacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_artifacts_type ON knowledge_artifacts(artifact_type);

-- RLS
ALTER TABLE knowledge_artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view knowledge artifacts" ON knowledge_artifacts;
CREATE POLICY "Users can view knowledge artifacts" ON knowledge_artifacts
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage knowledge artifacts" ON knowledge_artifacts;
CREATE POLICY "Users can manage knowledge artifacts" ON knowledge_artifacts
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
