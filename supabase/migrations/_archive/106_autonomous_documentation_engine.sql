-- Migration 106: Autonomous Documentation Engine
-- Required by Phase 54 - Autonomous Documentation Engine (A-DE)
-- AI-powered documentation generation and maintenance

-- Documentation tasks table
CREATE TABLE IF NOT EXISTS documentation_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID,
  doc_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMPTZ,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Doc type check
  CONSTRAINT documentation_tasks_type_check CHECK (
    doc_type IN (
      'api_docs', 'workflow_docs', 'billing_docs', 'token_docs',
      'voice_docs', 'image_engine_docs', 'maos_docs', 'deep_agent_docs',
      'client_help_articles', 'developer_guides'
    )
  ),

  -- Status check
  CONSTRAINT documentation_tasks_status_check CHECK (
    status IN ('pending', 'generating', 'generated', 'verified', 'failed')
  ),

  -- Foreign key (nullable for system-wide docs)
  CONSTRAINT documentation_tasks_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documentation_tasks_org ON documentation_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_documentation_tasks_type ON documentation_tasks(doc_type);
CREATE INDEX IF NOT EXISTS idx_documentation_tasks_status ON documentation_tasks(status);
CREATE INDEX IF NOT EXISTS idx_documentation_tasks_created ON documentation_tasks(created_at DESC);

-- Enable RLS
ALTER TABLE documentation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow system docs with null org_id)
CREATE POLICY documentation_tasks_select ON documentation_tasks
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    org_id IS NULL OR
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY documentation_tasks_insert ON documentation_tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    org_id IS NULL OR
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY documentation_tasks_update ON documentation_tasks
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    org_id IS NULL OR
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Comment
COMMENT ON TABLE documentation_tasks IS 'Documentation generation tasks (Phase 54)';
