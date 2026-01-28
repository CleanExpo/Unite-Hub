-- Migration 132: Autonomous Dev Refactor Engine
-- Required by Phase 80 - Autonomous Dev & Refactor Engine (ADRE)
-- Controlled autonomous development with human review gates

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS dev_refactor_changes CASCADE;
DROP TABLE IF EXISTS dev_refactor_sessions CASCADE;

-- Dev refactor sessions table
CREATE TABLE dev_refactor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  initiator_user_id UUID NOT NULL,
  scope_paths JSONB DEFAULT '[]'::jsonb,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status check
  CONSTRAINT dev_refactor_sessions_status_check CHECK (
    status IN ('draft', 'analyzing', 'generating', 'review', 'approved', 'applied', 'rejected')
  ),

  -- Foreign keys
  CONSTRAINT dev_refactor_sessions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT dev_refactor_sessions_user_fk
    -- Keep FK reference to auth.users (allowed in migrations)
FOREIGN KEY (initiator_user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dev_refactor_sessions_org ON dev_refactor_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_sessions_user ON dev_refactor_sessions(initiator_user_id);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_sessions_status ON dev_refactor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_sessions_created ON dev_refactor_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE dev_refactor_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY dev_refactor_sessions_select ON dev_refactor_sessions
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY dev_refactor_sessions_insert ON dev_refactor_sessions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY dev_refactor_sessions_update ON dev_refactor_sessions
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE dev_refactor_sessions IS 'Dev/refactor sessions (Phase 80)';

-- Dev refactor changes table
CREATE TABLE dev_refactor_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  change_type TEXT NOT NULL,
  diff_preview TEXT,
  tests_run JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Change type check
  CONSTRAINT dev_refactor_changes_type_check CHECK (
    change_type IN ('create', 'modify', 'delete', 'rename')
  ),

  -- Status check
  CONSTRAINT dev_refactor_changes_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'applied')
  ),

  -- Foreign key
  CONSTRAINT dev_refactor_changes_session_fk
    FOREIGN KEY (session_id) REFERENCES dev_refactor_sessions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dev_refactor_changes_session ON dev_refactor_changes(session_id);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_changes_file ON dev_refactor_changes(file_path);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_changes_status ON dev_refactor_changes(status);
CREATE INDEX IF NOT EXISTS idx_dev_refactor_changes_created ON dev_refactor_changes(created_at DESC);

-- Enable RLS
ALTER TABLE dev_refactor_changes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via dev_refactor_sessions)
CREATE POLICY dev_refactor_changes_select ON dev_refactor_changes
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND session_id IN (
    SELECT id FROM dev_refactor_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY dev_refactor_changes_insert ON dev_refactor_changes
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (
    SELECT id FROM dev_refactor_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY dev_refactor_changes_update ON dev_refactor_changes
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND session_id IN (
    SELECT id FROM dev_refactor_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE dev_refactor_changes IS 'Dev/refactor change records (Phase 80)';
