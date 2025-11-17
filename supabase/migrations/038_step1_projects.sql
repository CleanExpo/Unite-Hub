-- =====================================================
-- Migration 038 - Step 1: Create projects table
-- =====================================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  client_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12, 2),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_client_contact_id ON projects(client_contact_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view projects in their workspace" ON projects;
CREATE POLICY "Users can view projects in their workspace"
  ON projects FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create projects in their workspace" ON projects;
CREATE POLICY "Users can create projects in their workspace"
  ON projects FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update projects in their workspace" ON projects;
CREATE POLICY "Users can update projects in their workspace"
  ON projects FOR UPDATE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete projects in their workspace" ON projects;
CREATE POLICY "Users can delete projects in their workspace"
  ON projects FOR DELETE
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;

-- Verification
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') = 1 THEN
    RAISE NOTICE '✅ projects table created successfully';
  ELSE
    RAISE EXCEPTION 'projects table creation failed';
  END IF;
END $$;
