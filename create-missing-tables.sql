-- Create missing tables for Unite-Hub
-- Run this in Supabase Dashboard SQL Editor

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,
  initials VARCHAR(5) NOT NULL,
  capacity_hours INTEGER NOT NULL DEFAULT 40,
  hours_allocated INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'near-capacity', 'over-capacity')),
  current_projects INTEGER NOT NULL DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'on-track' CHECK (status IN ('on-track', 'at-risk', 'delayed', 'completed', 'archived')),
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE,
  start_date DATE,
  completed_date DATE,
  budget_amount DECIMAL(12, 2),
  budget_currency VARCHAR(10) DEFAULT 'USD',
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Assignees table
CREATE TABLE IF NOT EXISTS project_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, team_member_id)
);

-- Project Milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('completed', 'in-progress', 'pending')),
  due_date DATE,
  completed_date DATE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  client_name VARCHAR(255),
  type VARCHAR(50) NOT NULL DEFAULT 'document' CHECK (type IN ('design', 'content', 'video', 'document')),
  priority VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  asset_url TEXT,
  submitted_by_id UUID,
  submitted_by_name VARCHAR(255) NOT NULL,
  reviewed_by_id UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliverables table
CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL CHECK (file_type IN ('pdf', 'image', 'video', 'zip', 'other')),
  file_size VARCHAR(50),
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Messages table
CREATE TABLE IF NOT EXISTS project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID,
  author_name VARCHAR(255) NOT NULL,
  author_initials VARCHAR(5) NOT NULL,
  author_role VARCHAR(100),
  message_text TEXT NOT NULL,
  is_client BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intake Submissions table
CREATE TABLE IF NOT EXISTS intake_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  project_description TEXT NOT NULL,
  budget VARCHAR(100) NOT NULL,
  timeline VARCHAR(100) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  file_urls TEXT[] DEFAULT '{}',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'contacted')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members(org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_assignees_project_id ON project_assignees(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignees_team_member_id ON project_assignees(team_member_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_approvals_org_id ON approvals(org_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON project_messages(project_id);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies (allow service role full access)
CREATE POLICY "Enable all for service role" ON team_members FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON projects FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON project_assignees FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON project_milestones FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON approvals FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON deliverables FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON project_messages FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON intake_submissions FOR ALL USING (true);
