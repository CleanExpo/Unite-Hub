-- =====================================================
-- MINDMAP FEATURE - ADDITIVE MIGRATION (FIXED)
-- =====================================================
-- Purpose: Add interactive mindmap visualization for client projects
-- Date: 2025-01-17
-- Version: 1.1 (Fixed - Idempotent)
-- Mode: ADDITIVE - Preserves all existing functionality
-- =====================================================

-- =====================================================
-- TABLE 1: project_mindmaps
-- =====================================================
CREATE TABLE IF NOT EXISTS project_mindmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one mindmap per project
  UNIQUE(project_id)
);

-- Indexes for project_mindmaps
CREATE INDEX IF NOT EXISTS idx_project_mindmaps_project_id ON project_mindmaps(project_id);
CREATE INDEX IF NOT EXISTS idx_project_mindmaps_workspace_id ON project_mindmaps(workspace_id);
CREATE INDEX IF NOT EXISTS idx_project_mindmaps_org_id ON project_mindmaps(org_id);

-- Trigger for updated_at (DROP IF EXISTS first)
DROP TRIGGER IF EXISTS update_project_mindmaps_updated_at ON project_mindmaps;
CREATE TRIGGER update_project_mindmaps_updated_at
  BEFORE UPDATE ON project_mindmaps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE 2: mindmap_nodes
-- =====================================================
CREATE TABLE IF NOT EXISTS mindmap_nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mindmap_id UUID NOT NULL REFERENCES project_mindmaps(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES mindmap_nodes(id) ON DELETE SET NULL,
  node_type TEXT NOT NULL CHECK (node_type IN (
    'project_root',
    'feature',
    'requirement',
    'task',
    'milestone',
    'idea',
    'question',
    'note'
  )),
  label TEXT NOT NULL,
  description TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  color TEXT,
  icon TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'in_progress',
    'completed',
    'blocked',
    'on_hold'
  )),
  priority INTEGER NOT NULL DEFAULT 0 CHECK (priority >= 0 AND priority <= 10),
  metadata JSONB DEFAULT '{}'::jsonb,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for mindmap_nodes
CREATE INDEX IF NOT EXISTS idx_mindmap_nodes_mindmap_id ON mindmap_nodes(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_nodes_parent_id ON mindmap_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_nodes_node_type ON mindmap_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_mindmap_nodes_status ON mindmap_nodes(status);
CREATE INDEX IF NOT EXISTS idx_mindmap_nodes_metadata ON mindmap_nodes USING GIN (metadata);

-- Trigger for updated_at (DROP IF EXISTS first)
DROP TRIGGER IF EXISTS update_mindmap_nodes_updated_at ON mindmap_nodes;
CREATE TRIGGER update_mindmap_nodes_updated_at
  BEFORE UPDATE ON mindmap_nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TABLE 3: mindmap_connections
-- =====================================================
CREATE TABLE IF NOT EXISTS mindmap_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mindmap_id UUID NOT NULL REFERENCES project_mindmaps(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES mindmap_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES mindmap_nodes(id) ON DELETE CASCADE,
  connection_type TEXT NOT NULL DEFAULT 'relates_to' CHECK (connection_type IN (
    'relates_to',
    'depends_on',
    'leads_to',
    'part_of',
    'inspired_by',
    'conflicts_with'
  )),
  label TEXT,
  strength INTEGER NOT NULL DEFAULT 5 CHECK (strength >= 1 AND strength <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate connections
  UNIQUE(source_node_id, target_node_id, connection_type)
);

-- Indexes for mindmap_connections
CREATE INDEX IF NOT EXISTS idx_mindmap_connections_mindmap_id ON mindmap_connections(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_connections_source_node_id ON mindmap_connections(source_node_id);
CREATE INDEX IF NOT EXISTS idx_mindmap_connections_target_node_id ON mindmap_connections(target_node_id);

-- =====================================================
-- TABLE 4: ai_suggestions
-- =====================================================
CREATE TABLE IF NOT EXISTS ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mindmap_id UUID NOT NULL REFERENCES project_mindmaps(id) ON DELETE CASCADE,
  node_id UUID REFERENCES mindmap_nodes(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN (
    'add_feature',
    'clarify_requirement',
    'identify_dependency',
    'suggest_technology',
    'warn_complexity',
    'estimate_cost',
    'propose_alternative'
  )),
  suggestion_text TEXT NOT NULL,
  reasoning TEXT,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'accepted',
    'dismissed',
    'applied'
  )),
  applied_at TIMESTAMP WITH TIME ZONE,
  dismissed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for ai_suggestions
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_mindmap_id ON ai_suggestions(mindmap_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_node_id ON ai_suggestions(node_id);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_status ON ai_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_ai_suggestions_created_at ON ai_suggestions(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE project_mindmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindmap_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: project_mindmaps
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view mindmaps in their workspaces" ON project_mindmaps;
DROP POLICY IF EXISTS "Users can create mindmaps in their workspaces" ON project_mindmaps;
DROP POLICY IF EXISTS "Users can update mindmaps in their workspaces" ON project_mindmaps;
DROP POLICY IF EXISTS "Users can delete mindmaps in their workspaces" ON project_mindmaps;
DROP POLICY IF EXISTS "Service role can manage all mindmaps" ON project_mindmaps;

-- SELECT: Users can view mindmaps in their workspaces
CREATE POLICY "Users can view mindmaps in their workspaces"
  ON project_mindmaps
  FOR SELECT
  USING (
    workspace_id IN (SELECT get_user_workspaces())
  );

-- INSERT: Users can create mindmaps in their workspaces
CREATE POLICY "Users can create mindmaps in their workspaces"
  ON project_mindmaps
  FOR INSERT
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspaces())
  );

-- UPDATE: Users can update mindmaps in their workspaces
CREATE POLICY "Users can update mindmaps in their workspaces"
  ON project_mindmaps
  FOR UPDATE
  USING (
    workspace_id IN (SELECT get_user_workspaces())
  )
  WITH CHECK (
    workspace_id IN (SELECT get_user_workspaces())
  );

-- DELETE: Users can delete mindmaps in their workspaces
CREATE POLICY "Users can delete mindmaps in their workspaces"
  ON project_mindmaps
  FOR DELETE
  USING (
    workspace_id IN (SELECT get_user_workspaces())
  );

-- Service role has full access
CREATE POLICY "Service role can manage all mindmaps"
  ON project_mindmaps
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- RLS POLICIES: mindmap_nodes
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view nodes in their mindmaps" ON mindmap_nodes;
DROP POLICY IF EXISTS "Users can create nodes in their mindmaps" ON mindmap_nodes;
DROP POLICY IF EXISTS "Users can update nodes in their mindmaps" ON mindmap_nodes;
DROP POLICY IF EXISTS "Users can delete nodes in their mindmaps" ON mindmap_nodes;
DROP POLICY IF EXISTS "Service role can manage all nodes" ON mindmap_nodes;

-- SELECT: Users can view nodes if they can view the mindmap
CREATE POLICY "Users can view nodes in their mindmaps"
  ON mindmap_nodes
  FOR SELECT
  USING (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- INSERT: Users can create nodes if they can update the mindmap
CREATE POLICY "Users can create nodes in their mindmaps"
  ON mindmap_nodes
  FOR INSERT
  WITH CHECK (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- UPDATE: Users can update nodes if they can update the mindmap
CREATE POLICY "Users can update nodes in their mindmaps"
  ON mindmap_nodes
  FOR UPDATE
  USING (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  )
  WITH CHECK (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- DELETE: Users can delete nodes if they can update the mindmap
CREATE POLICY "Users can delete nodes in their mindmaps"
  ON mindmap_nodes
  FOR DELETE
  USING (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- Service role has full access
CREATE POLICY "Service role can manage all nodes"
  ON mindmap_nodes
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- RLS POLICIES: mindmap_connections
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view connections in their mindmaps" ON mindmap_connections;
DROP POLICY IF EXISTS "Users can create connections in their mindmaps" ON mindmap_connections;
DROP POLICY IF EXISTS "Users can delete connections in their mindmaps" ON mindmap_connections;
DROP POLICY IF EXISTS "Service role can manage all connections" ON mindmap_connections;

-- SELECT: Users can view connections if they can view the mindmap
CREATE POLICY "Users can view connections in their mindmaps"
  ON mindmap_connections
  FOR SELECT
  USING (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- INSERT: Users can create connections if they can update the mindmap
CREATE POLICY "Users can create connections in their mindmaps"
  ON mindmap_connections
  FOR INSERT
  WITH CHECK (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- DELETE: Users can delete connections if they can update the mindmap
CREATE POLICY "Users can delete connections in their mindmaps"
  ON mindmap_connections
  FOR DELETE
  USING (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- Service role has full access
CREATE POLICY "Service role can manage all connections"
  ON mindmap_connections
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- RLS POLICIES: ai_suggestions
-- =====================================================

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view suggestions for their mindmaps" ON ai_suggestions;
DROP POLICY IF EXISTS "Service role can create suggestions" ON ai_suggestions;
DROP POLICY IF EXISTS "Users can update suggestions in their mindmaps" ON ai_suggestions;
DROP POLICY IF EXISTS "Service role can manage all suggestions" ON ai_suggestions;

-- SELECT: Users can view suggestions for their mindmaps
CREATE POLICY "Users can view suggestions for their mindmaps"
  ON ai_suggestions
  FOR SELECT
  USING (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- INSERT: Service role can create suggestions (AI-generated)
CREATE POLICY "Service role can create suggestions"
  ON ai_suggestions
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- UPDATE: Users can update suggestion status (accept/dismiss)
CREATE POLICY "Users can update suggestions in their mindmaps"
  ON ai_suggestions
  FOR UPDATE
  USING (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  )
  WITH CHECK (
    mindmap_id IN (
      SELECT id FROM project_mindmaps
      WHERE workspace_id IN (SELECT get_user_workspaces())
    )
  );

-- Service role has full access
CREATE POLICY "Service role can manage all suggestions"
  ON ai_suggestions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get all nodes in a mindmap (for export/analysis)
CREATE OR REPLACE FUNCTION get_mindmap_structure(p_mindmap_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'mindmap', (SELECT row_to_json(pm.*) FROM project_mindmaps pm WHERE pm.id = p_mindmap_id),
    'nodes', (SELECT jsonb_agg(row_to_json(n.*)) FROM mindmap_nodes n WHERE n.mindmap_id = p_mindmap_id),
    'connections', (SELECT jsonb_agg(row_to_json(c.*)) FROM mindmap_connections c WHERE c.mindmap_id = p_mindmap_id),
    'suggestions', (SELECT jsonb_agg(row_to_json(s.*)) FROM ai_suggestions s WHERE s.mindmap_id = p_mindmap_id AND s.status = 'pending')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =====================================================
-- AUDIT LOG ENTRIES
-- =====================================================

-- Log migration completion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditLogs') THEN
    INSERT INTO "auditLogs" (action, details, created_at)
    VALUES (
      'migration_applied',
      jsonb_build_object(
        'migration', '028_mindmap_feature',
        'version', '1.1_fixed',
        'tables_created', ARRAY['project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions'],
        'mode', 'additive',
        'preserves_existing', true,
        'rls_enabled', true,
        'idempotent', true
      ),
      NOW()
    );
  END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables created
SELECT
  'Tables Created' AS check_type,
  COUNT(*) AS count,
  array_agg(table_name ORDER BY table_name) AS tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions');

-- Verify RLS enabled
SELECT
  'RLS Enabled' AS check_type,
  COUNT(*) AS count,
  array_agg(tablename ORDER BY tablename) AS tables
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions')
  AND rowsecurity = true;

-- Verify indexes created
SELECT
  'Indexes Created' AS check_type,
  COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions');

-- Verify policies created
SELECT
  'Policies Created' AS check_type,
  COUNT(*) AS count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('project_mindmaps', 'mindmap_nodes', 'mindmap_connections', 'ai_suggestions');

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Status: ✅ FIXED - Now fully idempotent
-- Can be run multiple times safely
-- All triggers and policies have DROP IF EXISTS
-- =====================================================
