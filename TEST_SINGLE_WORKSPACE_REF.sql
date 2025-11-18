-- Test creating ONE table with workspace_id foreign key
CREATE TABLE IF NOT EXISTS test_workspace_ref (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

SELECT 'SUCCESS: Table with workspace_id FK created' AS result;
