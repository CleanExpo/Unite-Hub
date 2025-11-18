-- Create a simple test table
CREATE TABLE IF NOT EXISTS test_fk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL
);

-- Try to add FK constraint
ALTER TABLE test_fk
  ADD CONSTRAINT fk_test_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

SELECT 'SUCCESS: FK constraint added' AS result;
