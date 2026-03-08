-- Phase 1 UI/UX Overhaul - Core Tables Migration
-- Created: 2025-11-19
-- Description: New tables for staff authentication, client portal, and AI orchestration

-- ==================================================
-- STAFF AUTHENTICATION & MANAGEMENT
-- ==================================================

-- Staff Users Table (Founder, Admin, Developer)
CREATE TABLE IF NOT EXISTS staff_users (
  -- Keep FK reference to auth.users (allowed in migrations)
id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text,
  role text NOT NULL CHECK(role IN ('founder', 'admin', 'developer')),
  active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Staff Activity Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS staff_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff_users(id) ON DELETE SET NULL,
  action text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Indexes for staff tables
CREATE INDEX IF NOT EXISTS idx_staff_users_email ON staff_users(email);
CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_staff_id ON staff_activity_logs(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_activity_logs_timestamp ON staff_activity_logs(timestamp DESC);

-- ==================================================
-- CLIENT PORTAL TABLES
-- ==================================================

-- Client Users (Separate from staff)
CREATE TABLE IF NOT EXISTS client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id text UNIQUE,
  name text,
  email text,
  subscription_tier text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Client Ideas Submission
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES client_users(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL CHECK(type IN ('voice', 'text', 'video', 'uploaded')),
  ai_interpretation jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Proposal Scopes (AI-generated from ideas)
CREATE TABLE IF NOT EXISTS proposal_scopes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idea_id uuid REFERENCES ideas(id) ON DELETE CASCADE,
  scope jsonb NOT NULL,
  pricing jsonb NOT NULL,
  timeline jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Projects (Approved proposals)
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES client_users(id) ON DELETE CASCADE,
  proposal_id uuid REFERENCES proposal_scopes(id) ON DELETE SET NULL,
  status text DEFAULT 'active',
  progress numeric DEFAULT 0 CHECK(progress >= 0 AND progress <= 100),
  timeline jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks (Project breakdown with accountability)
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES staff_users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  proof jsonb, -- Screenshots, links, completion evidence
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Digital Vault (Client credentials storage)
CREATE TABLE IF NOT EXISTS digital_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES client_users(id) ON DELETE CASCADE,
  key_name text NOT NULL,
  value text NOT NULL, -- Encrypted
  encrypted boolean DEFAULT true,
  category text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for client tables
CREATE INDEX IF NOT EXISTS idx_client_users_email ON client_users(email);
CREATE INDEX IF NOT EXISTS idx_client_users_google_id ON client_users(google_id);
CREATE INDEX IF NOT EXISTS idx_ideas_client_id ON ideas(client_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_projects_client_id ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_digital_vault_client_id ON digital_vault(client_id);

-- ==================================================
-- AI ORCHESTRATION TABLES
-- ==================================================

-- AI Event Logs (Track all AI agent activities)
CREATE TABLE IF NOT EXISTS ai_event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent text NOT NULL,
  event jsonb NOT NULL,
  timestamp timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_event_logs_agent ON ai_event_logs(agent);
CREATE INDEX IF NOT EXISTS idx_ai_event_logs_timestamp ON ai_event_logs(timestamp DESC);

-- ==================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==================================================

-- Enable RLS on all new tables
ALTER TABLE staff_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_scopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_event_logs ENABLE ROW LEVEL SECURITY;

-- Staff Users Policies
CREATE POLICY "Staff can view own profile"
  ON staff_users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins and founders can view all staff"
  ON staff_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'founder')
    )
  );

-- Staff Activity Logs Policies
CREATE POLICY "Staff can view own activity logs"
  ON staff_activity_logs FOR SELECT
  USING (staff_id = auth.uid());

CREATE POLICY "Admins can view all activity logs"
  ON staff_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'founder')
    )
  );

-- Client Users Policies
CREATE POLICY "Clients can view own profile"
  ON client_users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Staff can view all clients"
  ON client_users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND active = true
    )
  );

-- Ideas Policies
CREATE POLICY "Clients can manage own ideas"
  ON ideas FOR ALL
  USING (client_id = auth.uid());

CREATE POLICY "Staff can view all ideas"
  ON ideas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND active = true
    )
  );

-- Projects Policies
CREATE POLICY "Clients can view own projects"
  ON projects FOR SELECT
  USING (client_id = auth.uid());

CREATE POLICY "Staff can view all projects"
  ON projects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND active = true
    )
  );

-- Tasks Policies
CREATE POLICY "Staff can view assigned tasks"
  ON tasks FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Staff can update assigned tasks"
  ON tasks FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND role IN ('admin', 'founder')
    )
  );

-- Digital Vault Policies (Strict - client only)
CREATE POLICY "Clients can manage own vault"
  ON digital_vault FOR ALL
  USING (client_id = auth.uid());

-- AI Event Logs Policies (Staff only)
CREATE POLICY "Staff can view AI logs"
  ON ai_event_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_users
      WHERE id = auth.uid()
      AND active = true
    )
  );

-- ==================================================
-- UPDATED_AT TRIGGERS
-- ==================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_staff_users_updated_at
  BEFORE UPDATE ON staff_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_users_updated_at
  BEFORE UPDATE ON client_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================================================
-- SAMPLE DATA (FOR TESTING ONLY - REMOVE IN PRODUCTION)
-- ==================================================

-- Insert a founder staff user (replace with real auth user ID)
-- INSERT INTO staff_users (id, email, name, role, active)
-- VALUES (
--   'YOUR_AUTH_USER_ID_HERE'::uuid,
--   'founder@unite-group.in',
--   'Founder',
--   'founder',
--   true
-- );

-- ==================================================
-- MIGRATION COMPLETE
-- ==================================================
-- Total tables created: 9
-- Total indexes created: 15
-- Total RLS policies created: 13
-- Total triggers created: 4;
