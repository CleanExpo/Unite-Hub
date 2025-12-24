-- Phase 2 Step 4: API Compatibility & Additional Fields
-- Created: 2025-11-19
-- Description: Adds missing fields and ensures API compatibility for staff pages

-- ==================================================
-- ADD MISSING FIELDS TO EXISTING TABLES
-- ==================================================

-- Add missing fields to projects table for enhanced UI
DO $$
BEGIN
  -- Add name field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'name'
  ) THEN
    ALTER TABLE projects ADD COLUMN name text;
  END IF;

  -- Add description field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'description'
  ) THEN
    ALTER TABLE projects ADD COLUMN description text;
  END IF;

  -- Add deadline field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE projects ADD COLUMN deadline date;
  END IF;

  -- Add team_size field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'team_size'
  ) THEN
    ALTER TABLE projects ADD COLUMN team_size integer DEFAULT 1;
  END IF;

  -- Add client_name field for quick access (denormalized)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE projects ADD COLUMN client_name text;
  END IF;
END $$;

-- Add missing fields to tasks table
DO $$
BEGIN
  -- Add priority field if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'priority'
  ) THEN
    ALTER TABLE tasks ADD COLUMN priority text CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium';
  END IF;

  -- Add deadline timestamp field if it doesn't exist (different from due_date)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'deadline'
  ) THEN
    ALTER TABLE tasks ADD COLUMN deadline timestamptz;
  END IF;
END $$;

-- ==================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==================================================

-- Projects performance indexes
CREATE INDEX IF NOT EXISTS idx_projects_status_progress ON projects(status, progress);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline) WHERE deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Tasks performance indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline) WHERE deadline IS NOT NULL;

-- Staff activity logs performance indexes
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_action ON staff_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_metadata ON staff_activity_logs USING GIN(metadata);

-- ==================================================
-- CREATE VIEWS FOR API CONVENIENCE
-- ==================================================

-- View: Staff Tasks with Full Details
CREATE OR REPLACE VIEW staff_tasks_full AS
SELECT
  t.*,
  p.name as project_name,
  p.status as project_status,
  cu.name as client_name,
  cu.email as client_email,
  su.name as assigned_to_name,
  su.email as assigned_to_email
FROM tasks t
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN client_users cu ON p.client_id = cu.id
LEFT JOIN staff_users su ON t.assigned_to = su.id;

-- View: Staff Projects with Full Details
CREATE OR REPLACE VIEW staff_projects_full AS
SELECT
  p.*,
  cu.name as client_name,
  cu.email as client_email,
  cu.subscription_tier,
  COUNT(t.id) as total_tasks,
  COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
  COUNT(CASE WHEN t.status = 'pending' THEN 1 END) as pending_tasks,
  COUNT(CASE WHEN t.status = 'in_progress' THEN 1 END) as in_progress_tasks
FROM projects p
LEFT JOIN client_users cu ON p.client_id = cu.id
LEFT JOIN tasks t ON p.id = t.project_id
GROUP BY p.id, cu.id, cu.name, cu.email, cu.subscription_tier;

-- Grant access to views for authenticated users
GRANT SELECT ON staff_tasks_full TO authenticated;
GRANT SELECT ON staff_projects_full TO authenticated;

-- ==================================================
-- UPDATE EXISTING DATA (OPTIONAL)
-- ==================================================

-- Update project names from client names where missing
UPDATE projects p
SET client_name = cu.name
FROM client_users cu
WHERE p.client_id = cu.id
  AND (p.client_name IS NULL OR p.client_name = '');

-- Update project names to have a default where still missing
UPDATE projects
SET name = 'Project #' || id::text
WHERE name IS NULL OR name = '';

-- ==================================================
-- ADD HELPER FUNCTIONS
-- ==================================================

-- Function: Calculate project completion percentage
CREATE OR REPLACE FUNCTION calculate_project_progress(project_uuid uuid)
RETURNS numeric AS $$
DECLARE
  total_tasks integer;
  completed_tasks integer;
  progress_percent numeric;
BEGIN
  SELECT
    COUNT(*),
    COUNT(CASE WHEN status = 'completed' THEN 1 END)
  INTO total_tasks, completed_tasks
  FROM tasks
  WHERE project_id = project_uuid;

  IF total_tasks = 0 THEN
    RETURN 0;
  END IF;

  progress_percent := (completed_tasks::numeric / total_tasks::numeric) * 100;

  RETURN ROUND(progress_percent, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Get staff member's task statistics
CREATE OR REPLACE FUNCTION get_staff_task_stats(staff_uuid uuid)
RETURNS jsonb AS $$
DECLARE
  stats jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'pending', COUNT(CASE WHEN status = 'pending' THEN 1 END),
    'in_progress', COUNT(CASE WHEN status = 'in_progress' THEN 1 END),
    'completed', COUNT(CASE WHEN status = 'completed' THEN 1 END),
    'overdue', COUNT(CASE WHEN due_date < CURRENT_DATE AND status != 'completed' THEN 1 END)
  )
  INTO stats
  FROM tasks
  WHERE assigned_to = staff_uuid;

  RETURN stats;
END;
$$ LANGUAGE plpgsql;

-- Function: Get recent activity count
CREATE OR REPLACE FUNCTION get_activity_counts(
  staff_uuid uuid,
  since_timestamp timestamptz DEFAULT (NOW() - interval '7 days')
)
RETURNS jsonb AS $$
DECLARE
  counts jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total', COUNT(*),
    'today', COUNT(CASE WHEN timestamp::date = CURRENT_DATE THEN 1 END),
    'this_week', COUNT(CASE WHEN timestamp >= (NOW() - interval '7 days') THEN 1 END),
    'tasks_completed', COUNT(CASE WHEN action = 'task_completed' THEN 1 END),
    'projects_updated', COUNT(CASE WHEN action = 'project_updated' THEN 1 END)
  )
  INTO counts
  FROM staff_activity_logs
  WHERE staff_id = staff_uuid
    AND timestamp >= since_timestamp;

  RETURN counts;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- SEED SAMPLE DATA (FOR TESTING - REMOVE IN PRODUCTION)
-- ==================================================

-- Note: Uncomment to insert sample data for testing
-- This data will work with the frontend pages

/*
-- Insert sample client users
INSERT INTO client_users (id, name, email, subscription_tier)
VALUES
  (gen_random_uuid(), 'Acme Corp', 'contact@acme.com', 'enterprise'),
  (gen_random_uuid(), 'TechStart Inc', 'hello@techstart.io', 'professional'),
  (gen_random_uuid(), 'Design Studio', 'team@designstudio.com', 'starter')
ON CONFLICT DO NOTHING;

-- Insert sample projects (replace client_id with actual UUIDs from client_users)
INSERT INTO projects (name, client_id, status, progress, description, deadline, team_size)
SELECT
  'Website Redesign',
  id,
  'active',
  65,
  'Complete redesign of company website with modern UI/UX',
  CURRENT_DATE + interval '30 days',
  3
FROM client_users WHERE email = 'contact@acme.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample tasks (replace project_id and assigned_to with actual UUIDs)
INSERT INTO tasks (project_id, assigned_to, title, description, status, priority, due_date)
SELECT
  p.id,
  su.id,
  'Complete homepage redesign',
  'Design and implement new homepage layout',
  'in_progress',
  'high',
  CURRENT_DATE + interval '7 days'
FROM projects p
CROSS JOIN staff_users su
WHERE p.name = 'Website Redesign'
  AND su.role = 'developer'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample activity logs
INSERT INTO staff_activity_logs (staff_id, action, metadata)
SELECT
  id,
  'staff_login',
  jsonb_build_object('email', email, 'timestamp', NOW())
FROM staff_users
WHERE active = true
LIMIT 1
ON CONFLICT DO NOTHING;
*/

-- ==================================================
-- VERIFICATION QUERIES
-- ==================================================

-- Count tables
SELECT COUNT(*) as total_tables
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('staff_users', 'staff_activity_logs', 'client_users', 'projects', 'tasks');

-- Check indexes
SELECT
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('projects', 'tasks', 'staff_activity_logs')
ORDER BY tablename, indexname;

-- Check views
SELECT
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'staff_%';

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
-- Tables updated: 2 (projects, tasks)
-- Fields added: 7
-- Indexes created: 7
-- Views created: 2
-- Functions created: 3
-- Total enhancement points: 19
