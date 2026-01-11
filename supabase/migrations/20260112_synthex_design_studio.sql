-- Synthex Design Studio Tables
-- Stores AI-generated UI designs, versions, and client feedback

-- ===== ENUMs =====
DO $$ BEGIN
  CREATE TYPE synthex_design_project_type AS ENUM (
    'landing-page',
    'social-mockup',
    'component',
    'full-site'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE synthex_design_status AS ENUM (
    'draft',
    'in-review',
    'approved',
    'deployed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ===== Design Projects Table =====
CREATE TABLE IF NOT EXISTS synthex_design_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  project_type synthex_design_project_type DEFAULT 'landing-page',

  -- Version tracking
  current_version INTEGER DEFAULT 1,
  status synthex_design_status DEFAULT 'draft',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, project_name),
  CONSTRAINT project_workspace_isolation CHECK (workspace_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_design_projects_workspace ON synthex_design_projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_design_projects_status ON synthex_design_projects(status);

-- ===== Design Versions Table =====
CREATE TABLE IF NOT EXISTS synthex_design_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES synthex_design_projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Generation inputs
  prompt TEXT NOT NULL,
  refinement_from_version INTEGER, -- Parent version if this is a refinement

  -- Generated outputs
  generated_code TEXT NOT NULL, -- Full React component code
  component_tree JSONB NOT NULL, -- JSX structure for rendering
  mockup_image_url TEXT, -- Screenshot of design preview

  -- Generation metadata
  tokens_used INTEGER DEFAULT 0,
  generation_cost DECIMAL(10, 4) DEFAULT 0.00, -- Cost in cents

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, version_number),
  CONSTRAINT positive_version CHECK (version_number > 0)
);

CREATE INDEX IF NOT EXISTS idx_design_versions_project ON synthex_design_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_design_versions_created ON synthex_design_versions(generated_at DESC);

-- ===== Design Comments Table =====
CREATE TABLE IF NOT EXISTS synthex_design_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES synthex_design_versions(id) ON DELETE CASCADE,
  commenter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Comment content
  comment_text TEXT NOT NULL,
  element_selector TEXT, -- CSS selector for inline comment targeting
  resolved BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT non_empty_comment CHECK (length(comment_text) > 0)
);

CREATE INDEX IF NOT EXISTS idx_design_comments_version ON synthex_design_comments(version_id);
CREATE INDEX IF NOT EXISTS idx_design_comments_commenter ON synthex_design_comments(commenter_id);
CREATE INDEX IF NOT EXISTS idx_design_comments_resolved ON synthex_design_comments(resolved);

-- ===== Design Exports Table =====
CREATE TABLE IF NOT EXISTS synthex_design_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES synthex_design_projects(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES synthex_design_versions(id) ON DELETE CASCADE,

  -- Export details
  export_type TEXT NOT NULL CHECK (export_type IN ('zip-download', 'github-push', 'vercel-deploy')),
  export_url TEXT, -- GitHub repo URL / Vercel deployment URL / Download path
  export_metadata JSONB, -- Additional export details (branch name, commit hash, etc)

  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_design_exports_project ON synthex_design_exports(project_id);
CREATE INDEX IF NOT EXISTS idx_design_exports_type ON synthex_design_exports(export_type);

-- ===== Row Level Security Policies =====

-- synthex_design_projects RLS
ALTER TABLE synthex_design_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "design_projects_workspace_isolation" ON synthex_design_projects;
CREATE POLICY "design_projects_workspace_isolation" ON synthex_design_projects
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM user_workspace_access
      WHERE user_id = auth.uid()
    )
  );

-- synthex_design_versions RLS
ALTER TABLE synthex_design_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "design_versions_workspace_isolation" ON synthex_design_versions;
CREATE POLICY "design_versions_workspace_isolation" ON synthex_design_versions
  FOR ALL USING (
    project_id IN (
      SELECT id FROM synthex_design_projects
      WHERE workspace_id IN (
        SELECT workspace_id FROM user_workspace_access
        WHERE user_id = auth.uid()
      )
    )
  );

-- synthex_design_comments RLS
ALTER TABLE synthex_design_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "design_comments_workspace_isolation" ON synthex_design_comments;
CREATE POLICY "design_comments_workspace_isolation" ON synthex_design_comments
  FOR ALL USING (
    version_id IN (
      SELECT id FROM synthex_design_versions
      WHERE project_id IN (
        SELECT id FROM synthex_design_projects
        WHERE workspace_id IN (
          SELECT workspace_id FROM user_workspace_access
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- synthex_design_exports RLS
ALTER TABLE synthex_design_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "design_exports_workspace_isolation" ON synthex_design_exports;
CREATE POLICY "design_exports_workspace_isolation" ON synthex_design_exports
  FOR ALL USING (
    project_id IN (
      SELECT id FROM synthex_design_projects
      WHERE workspace_id IN (
        SELECT workspace_id FROM user_workspace_access
        WHERE user_id = auth.uid()
      )
    )
  );

-- ===== Helper Functions =====

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_design_project_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS design_projects_update_timestamp ON synthex_design_projects;
CREATE TRIGGER design_projects_update_timestamp
  BEFORE UPDATE ON synthex_design_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_design_project_updated_at();

-- ===== Constraints & Checks =====

-- Ensure version numbers are sequential within a project
CREATE OR REPLACE FUNCTION validate_design_version_sequence()
RETURNS TRIGGER AS $$
DECLARE
  max_version INTEGER;
BEGIN
  SELECT MAX(version_number) INTO max_version
  FROM synthex_design_versions
  WHERE project_id = NEW.project_id AND id != NEW.id;

  IF max_version IS NULL THEN
    IF NEW.version_number != 1 THEN
      RAISE EXCEPTION 'First version must be version 1';
    END IF;
  ELSE
    IF NEW.version_number != max_version + 1 THEN
      RAISE EXCEPTION 'Version numbers must be sequential';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS design_versions_validate_sequence ON synthex_design_versions;
CREATE TRIGGER design_versions_validate_sequence
  BEFORE INSERT ON synthex_design_versions
  FOR EACH ROW
  EXECUTE FUNCTION validate_design_version_sequence();

-- ===== Views =====

-- Current version view for each project
DROP VIEW IF EXISTS synthex_design_current_versions;
CREATE VIEW synthex_design_current_versions AS
SELECT DISTINCT ON (p.id)
  p.id as project_id,
  p.workspace_id,
  p.project_name,
  p.project_type,
  p.status,
  v.id as version_id,
  v.version_number,
  v.prompt,
  v.generated_code,
  v.component_tree,
  v.tokens_used,
  v.generation_cost,
  v.generated_at
FROM synthex_design_projects p
LEFT JOIN synthex_design_versions v ON p.id = v.project_id
ORDER BY p.id, v.version_number DESC;

-- Summary stats for projects
DROP VIEW IF EXISTS synthex_design_project_stats;
CREATE VIEW synthex_design_project_stats AS
SELECT
  p.id as project_id,
  p.workspace_id,
  p.project_name,
  COUNT(DISTINCT v.id) as total_versions,
  COUNT(DISTINCT c.id) as total_comments,
  COUNT(DISTINCT e.id) as total_exports,
  COALESCE(SUM(v.tokens_used), 0) as total_tokens_used,
  COALESCE(SUM(v.generation_cost), 0)::DECIMAL as total_generation_cost,
  MAX(v.generated_at) as last_modified
FROM synthex_design_projects p
LEFT JOIN synthex_design_versions v ON p.id = v.project_id
LEFT JOIN synthex_design_comments c ON v.id = c.version_id
LEFT JOIN synthex_design_exports e ON p.id = e.project_id
GROUP BY p.id, p.workspace_id, p.project_name;
