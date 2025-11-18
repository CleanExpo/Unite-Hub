-- Drop test table if it exists
DROP TABLE IF EXISTS test_fk CASCADE;

-- Create a simple test table
CREATE TABLE test_fk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL
);

-- Try to add FK constraint
ALTER TABLE test_fk
  ADD CONSTRAINT fk_test_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

SELECT 'SUCCESS: FK constraint added to workspaces(id)' AS result;

-- Clean up
DROP TABLE test_fk CASCADE;
