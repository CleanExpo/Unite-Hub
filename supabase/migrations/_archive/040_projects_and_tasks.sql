-- Migration 040: Projects and Tasks Tables
-- Phase 3 Step 7 - Automatic Project Creation
--
-- Creates tables for:
-- - projects: Main project records
-- - project_tasks: Tasks within projects
-- - project_staff_assignments: Staff assigned to projects
--
-- Run this in Supabase SQL Editor

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'on_hold', 'completed', 'cancelled')),
  tier TEXT NOT NULL CHECK (tier IN ('good', 'better', 'best')),

  -- References
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  proposal_scope_id UUID NOT NULL REFERENCES proposal_scopes(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Timeline
  start_date TIMESTAMPTZ NOT NULL,
  estimated_end_date TIMESTAMPTZ,
  actual_end_date TIMESTAMPTZ,

  -- Estimation
  total_estimated_hours INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_idea_id ON projects(idea_id);
CREATE INDEX IF NOT EXISTS idx_projects_proposal_scope_id ON projects(proposal_scope_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_tier ON projects(tier);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- ============================================================================
-- PROJECT_TASKS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_tasks (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Task details
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),

  -- Estimation & Timeline
  estimated_hours INTEGER,
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Organization
  "order" INTEGER NOT NULL DEFAULT 0,
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- References
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for project_tasks
CREATE INDEX IF NOT EXISTS idx_project_tasks_project_id ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_organization_id ON project_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_priority ON project_tasks(priority);
CREATE INDEX IF NOT EXISTS idx_project_tasks_assigned_to ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_project_tasks_order ON project_tasks("order");

-- ============================================================================
-- PROJECT_STAFF_ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS project_staff_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Assignment details
  role TEXT NOT NULL CHECK (role IN ('project_manager', 'developer', 'designer', 'qa', 'other')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one role per user per project
  UNIQUE(project_id, user_id, role)
);

-- Indexes for project_staff_assignments
CREATE INDEX IF NOT EXISTS idx_project_staff_project_id ON project_staff_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_staff_user_id ON project_staff_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_project_staff_organization_id ON project_staff_assignments(organization_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_staff_assignments ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view projects in their organization"
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert projects in their organization"
  ON projects FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

CREATE POLICY "Staff can update projects in their organization"
  ON projects FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

-- Project_tasks policies
CREATE POLICY "Users can view tasks in their organization"
  ON project_tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert tasks in their organization"
  ON project_tasks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

CREATE POLICY "Staff can update tasks in their organization"
  ON project_tasks FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

-- Project_staff_assignments policies
CREATE POLICY "Users can view staff assignments in their organization"
  ON project_staff_assignments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert assignments in their organization"
  ON project_staff_assignments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_staff_updated_at
  BEFORE UPDATE ON project_staff_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE projects IS 'Main projects table - created from paid proposals';
COMMENT ON TABLE project_tasks IS 'Tasks within projects - mapped from proposal deliverables';
COMMENT ON TABLE project_staff_assignments IS 'Staff members assigned to projects';

COMMENT ON COLUMN projects.id IS 'Project ID (generated: proj-{timestamp}-{random})';
COMMENT ON COLUMN projects.tier IS 'Proposal tier: good, better, or best';
COMMENT ON COLUMN projects.status IS 'Project status: active, on_hold, completed, cancelled';
COMMENT ON COLUMN projects.metadata IS 'Additional metadata: { createdBy, packageLabel, aiGenerated, etc. }';

COMMENT ON COLUMN project_tasks.dependencies IS 'Array of task IDs this task depends on';
COMMENT ON COLUMN project_tasks.order IS 'Task order within project (1-indexed)';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this SQL in Supabase SQL Editor
-- After running, wait 1-5 minutes OR run: SELECT * FROM projects LIMIT 1;
