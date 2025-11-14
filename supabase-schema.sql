-- Unite-Hub Database Schema for Supabase
-- This schema creates all necessary tables for the application

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  website VARCHAR(255),
  team_size VARCHAR(50),
  industry VARCHAR(100),
  plan VARCHAR(50) NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'cancelled')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Project Assignees table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS project_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, team_member_id)
);

-- Project Milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(50),
  job_title VARCHAR(255),
  ai_score DECIMAL(3, 2) NOT NULL DEFAULT 0.5 CHECK (ai_score >= 0 AND ai_score <= 1),
  status VARCHAR(50) NOT NULL DEFAULT 'contact' CHECK (status IN ('prospect', 'lead', 'customer', 'contact')),
  last_interaction TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, email)
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'paused')),
  sent_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  replied_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(org_id);
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
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_intake_submissions_updated_at BEFORE UPDATE ON intake_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing service role to bypass)
-- These policies allow full access for service role (used by API)
CREATE POLICY "Service role has full access" ON organizations FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON workspaces FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON team_members FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON projects FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON project_assignees FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON project_milestones FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON approvals FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON deliverables FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON project_messages FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON intake_submissions FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON contacts FOR ALL USING (true);
CREATE POLICY "Service role has full access" ON campaigns FOR ALL USING (true);
