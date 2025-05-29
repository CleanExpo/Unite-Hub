-- Insert sample data for testing
-- Note: Replace the UUIDs with actual user IDs from your auth.users table

-- Sample admin user (replace with your user ID)
INSERT INTO profiles (id, first_name, last_name, avatar_url, role)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'Admin', 'User', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 'admin')
ON CONFLICT (id) DO UPDATE 
SET first_name = 'Admin', 
    last_name = 'User', 
    avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 
    role = 'admin';

-- Sample projects
INSERT INTO projects (name, description, status, owner_id)
VALUES 
  ('Website Redesign', 'Redesign the company website with modern UI/UX', 'active', '00000000-0000-0000-0000-000000000000'),
  ('Mobile App Development', 'Create a mobile app for our customers', 'active', '00000000-0000-0000-0000-000000000000'),
  ('Marketing Campaign', 'Q4 marketing campaign planning and execution', 'active', '00000000-0000-0000-0000-000000000000');

-- Sample tasks for Website Redesign project
INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
SELECT 
  'Homepage Design', 
  'Create a new design for the homepage with improved user experience', 
  'todo', 
  'high', 
  NOW() + INTERVAL '7 days', 
  id, 
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000000'
FROM projects
WHERE name = 'Website Redesign';

INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
SELECT 
  'Content Migration', 
  'Migrate content from old website to new design', 
  'todo', 
  'medium', 
  NOW() + INTERVAL '14 days', 
  id, 
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000000'
FROM projects
WHERE name = 'Website Redesign';

-- Sample tasks for Mobile App Development project
INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
SELECT 
  'UI Design', 
  'Design the user interface for the mobile app', 
  'in_progress', 
  'high', 
  NOW() + INTERVAL '10 days', 
  id, 
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000000'
FROM projects
WHERE name = 'Mobile App Development';

INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
SELECT 
  'API Integration', 
  'Integrate the app with our backend APIs', 
  'todo', 
  'high', 
  NOW() + INTERVAL '20 days', 
  id, 
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000000'
FROM projects
WHERE name = 'Mobile App Development';

-- Sample tasks for Marketing Campaign project
INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
SELECT 
  'Campaign Strategy', 
  'Develop the overall strategy for the Q4 marketing campaign', 
  'in_progress', 
  'urgent', 
  NOW() + INTERVAL '5 days', 
  id, 
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000000'
FROM projects
WHERE name = 'Marketing Campaign';

INSERT INTO tasks (title, description, status, priority, due_date, project_id, assigned_to, created_by)
SELECT 
  'Content Creation', 
  'Create content for social media, email, and website', 
  'todo', 
  'high', 
  NOW() + INTERVAL '15 days', 
  id, 
  '00000000-0000-0000-0000-000000000000', 
  '00000000-0000-0000-0000-000000000000'
FROM projects
WHERE name = 'Marketing Campaign';
