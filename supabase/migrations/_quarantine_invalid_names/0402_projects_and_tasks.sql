-- Migration 0402: Projects and Tasks Tables
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'projects'
  ) THEN
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS client_id UUID';
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS organization_id UUID';
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS idea_id UUID';
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS proposal_scope_id UUID';
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS status TEXT';
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS tier TEXT';
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ';
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ';
    EXECUTE 'ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT ''{}''::jsonb';
  END IF;
END $$;

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
DO $$
DECLARE
  projects_id_type TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'project_tasks'
  ) THEN
    SELECT c.data_type
      INTO projects_id_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'projects'
      AND c.column_name = 'id';

    IF projects_id_type = 'uuid' THEN
      EXECUTE $ddl$
        CREATE TABLE IF NOT EXISTS public.project_tasks (
          id TEXT PRIMARY KEY,
          project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
          estimated_hours INTEGER,
          start_date TIMESTAMPTZ,
          due_date TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          "order" INTEGER NOT NULL DEFAULT 0,
          dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
          organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      $ddl$;
    ELSE
      EXECUTE $ddl$
        CREATE TABLE IF NOT EXISTS public.project_tasks (
          id TEXT PRIMARY KEY,
          project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
          priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
          estimated_hours INTEGER,
          start_date TIMESTAMPTZ,
          due_date TIMESTAMPTZ,
          completed_at TIMESTAMPTZ,
          "order" INTEGER NOT NULL DEFAULT 0,
          dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
          organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          assigned_to UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      $ddl$;
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  projects_id_type TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'project_tasks'
  ) THEN
    SELECT c.data_type
      INTO projects_id_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'projects'
      AND c.column_name = 'id';

    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'project_tasks'
        AND column_name = 'project_id'
    ) THEN
      IF projects_id_type = 'uuid' THEN
        EXECUTE 'ALTER TABLE public.project_tasks ADD COLUMN project_id UUID';
      ELSE
        EXECUTE 'ALTER TABLE public.project_tasks ADD COLUMN project_id TEXT';
      END IF;
    END IF;

    EXECUTE 'ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS organization_id UUID';
    EXECUTE 'ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS status TEXT';
    EXECUTE 'ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS priority TEXT';
    EXECUTE 'ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS assigned_to UUID';
    EXECUTE 'ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS "order" INTEGER';
    EXECUTE 'ALTER TABLE public.project_tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ';
  END IF;
END $$;

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
DO $$
DECLARE
  projects_id_type TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'project_staff_assignments'
  ) THEN
    SELECT c.data_type
      INTO projects_id_type
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.table_name = 'projects'
      AND c.column_name = 'id';

    IF projects_id_type = 'uuid' THEN
      EXECUTE $ddl$
        CREATE TABLE IF NOT EXISTS public.project_staff_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
          organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('project_manager', 'developer', 'designer', 'qa', 'other')),
          assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(project_id, user_id, role)
        )
      $ddl$;
    ELSE
      EXECUTE $ddl$
        CREATE TABLE IF NOT EXISTS public.project_staff_assignments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
          organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
          role TEXT NOT NULL CHECK (role IN ('project_manager', 'developer', 'designer', 'qa', 'other')),
          assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          assigned_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(project_id, user_id, role)
        )
      $ddl$;
    END IF;
  END IF;
END $$;

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
DROP POLICY IF EXISTS "Users can view projects in their organization" ON projects;
CREATE POLICY "Users can view projects in their organization"
  ON projects FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can insert projects in their organization" ON projects;
CREATE POLICY "Staff can insert projects in their organization"
  ON projects FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Staff can update projects in their organization" ON projects;
CREATE POLICY "Staff can update projects in their organization"
  ON projects FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

-- Project_tasks policies
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON project_tasks;
CREATE POLICY "Users can view tasks in their organization"
  ON project_tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can insert tasks in their organization" ON project_tasks;
CREATE POLICY "Staff can insert tasks in their organization"
  ON project_tasks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Staff can update tasks in their organization" ON project_tasks;
CREATE POLICY "Staff can update tasks in their organization"
  ON project_tasks FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'staff')
    )
  );

-- Project_staff_assignments policies
DROP POLICY IF EXISTS "Users can view staff assignments in their organization" ON project_staff_assignments;
CREATE POLICY "Users can view staff assignments in their organization"
  ON project_staff_assignments FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can insert assignments in their organization" ON project_staff_assignments;
CREATE POLICY "Staff can insert assignments in their organization"
  ON project_staff_assignments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations
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

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_tasks_updated_at ON project_tasks;
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON project_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_project_staff_updated_at ON project_staff_assignments;
CREATE TRIGGER update_project_staff_updated_at
  BEFORE UPDATE ON project_staff_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'projects'
  ) THEN
    EXECUTE $comment$COMMENT ON TABLE public.projects IS 'Main projects table - created from paid proposals'$comment$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'project_tasks'
  ) THEN
    EXECUTE $comment$COMMENT ON TABLE public.project_tasks IS 'Tasks within projects - mapped from proposal deliverables'$comment$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'project_staff_assignments'
  ) THEN
    EXECUTE $comment$COMMENT ON TABLE public.project_staff_assignments IS 'Staff members assigned to projects'$comment$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'id'
  ) THEN
    EXECUTE $comment$COMMENT ON COLUMN public.projects.id IS 'Project ID (generated: proj-{timestamp}-{random})'$comment$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'tier'
  ) THEN
    EXECUTE $comment$COMMENT ON COLUMN public.projects.tier IS 'Proposal tier: good, better, or best'$comment$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'status'
  ) THEN
    EXECUTE $comment$COMMENT ON COLUMN public.projects.status IS 'Project status: active, on_hold, completed, cancelled'$comment$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'projects'
      AND column_name = 'metadata'
  ) THEN
    EXECUTE $comment$COMMENT ON COLUMN public.projects.metadata IS 'Additional metadata: { createdBy, packageLabel, aiGenerated, etc. }'$comment$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_tasks'
      AND column_name = 'dependencies'
  ) THEN
    EXECUTE $comment$COMMENT ON COLUMN public.project_tasks.dependencies IS 'Array of task IDs this task depends on'$comment$;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'project_tasks'
      AND column_name = 'order'
  ) THEN
    EXECUTE $comment$COMMENT ON COLUMN public.project_tasks."order" IS 'Task order within project (1-indexed)'$comment$;
  END IF;
END $$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this SQL in Supabase SQL Editor
-- After running, wait 1-5 minutes OR run: SELECT * FROM projects LIMIT 1;
