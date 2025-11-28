-- Minimal test to identify the exact error

-- Test 1: Can we create the table at all?
CREATE TABLE IF NOT EXISTS projects_test (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL
);

-- If this works, the table structure is fine
SELECT 'Test 1 passed: Table created' AS result;

-- Test 2: Can we add the foreign key?
ALTER TABLE projects_test
  DROP CONSTRAINT IF EXISTS fk_workspace;

ALTER TABLE projects_test
  ADD CONSTRAINT fk_workspace
  FOREIGN KEY (workspace_id)
  REFERENCES workspaces(id)
  ON DELETE CASCADE;

SELECT 'Test 2 passed: Foreign key added' AS result;

-- Test 3: Can we enable RLS?
ALTER TABLE projects_test ENABLE ROW LEVEL SECURITY;

SELECT 'Test 3 passed: RLS enabled' AS result;

-- Test 4: Can we create a simple policy?
DROP POLICY IF EXISTS "test_policy" ON projects_test;

CREATE POLICY "test_policy"
  ON projects_test FOR SELECT
  USING (true);

SELECT 'Test 4 passed: Simple policy created' AS result;

-- Test 5: Can we create a policy with subquery?
DROP POLICY IF EXISTS "test_policy" ON projects_test;

CREATE POLICY "test_policy"
  ON projects_test FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM workspaces LIMIT 1
    )
  );

SELECT 'Test 5 passed: Policy with subquery created' AS result;

-- Test 6: Can we reference user_organizations in policy?
DROP POLICY IF EXISTS "test_policy" ON projects_test;

CREATE POLICY "test_policy"
  ON projects_test FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id
      FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

SELECT 'Test 6 passed: Policy with user_organizations created' AS result;

-- Cleanup
DROP TABLE IF EXISTS projects_test CASCADE;

SELECT '✅ All tests passed! Migration should work.' AS final_result;
