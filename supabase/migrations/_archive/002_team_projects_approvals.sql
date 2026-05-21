-- Migration: Team Members, Projects, and Approvals
-- Date: 2025-11-14
-- Description: Add tables for team management, project tracking, and approval workflow

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  initials TEXT NOT NULL,
  capacity_hours INTEGER NOT NULL DEFAULT 40 CHECK (capacity_hours > 0),
  hours_allocated INTEGER NOT NULL DEFAULT 0 CHECK (hours_allocated >= 0),
  status TEXT NOT NULL CHECK (status IN ('available', 'near-capacity', 'over-capacity')) DEFAULT 'available',
  current_projects INTEGER NOT NULL DEFAULT 0 CHECK (current_projects >= 0),
  skills TEXT[] DEFAULT '{}',
  join_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(org_id, email)
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('on-track', 'at-risk', 'delayed', 'completed', 'archived')) DEFAULT 'on-track',
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_date DATE,
  start_date DATE,
  completed_date DATE,
  budget_amount DECIMAL(12, 2),
  budget_currency TEXT DEFAULT 'USD',
  category TEXT, -- e.g., 'active', 'at-risk', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Assignees (many-to-many relationship)
CREATE TABLE IF NOT EXISTS project_assignees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, team_member_id)
);

-- Project Milestones
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('completed', 'in-progress', 'pending')) DEFAULT 'pending',
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
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT,
  type TEXT NOT NULL CHECK (type IN ('design', 'content', 'video', 'document')) DEFAULT 'document',
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined')) DEFAULT 'pending',
  asset_url TEXT,
  submitted_by_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  submitted_by_name TEXT NOT NULL,
  reviewed_by_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  decline_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliverables table (for client portal)
CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'image', 'video', 'zip', 'other')) DEFAULT 'other',
  file_size TEXT NOT NULL,
  file_url TEXT NOT NULL,
  description TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project Messages table (for client communication)
CREATE TABLE IF NOT EXISTS project_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_initials TEXT NOT NULL,
  author_role TEXT,
  message_text TEXT NOT NULL,
  is_client BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Intake Submissions table (for new project requests)
CREATE TABLE IF NOT EXISTS intake_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  services TEXT[] NOT NULL,
  project_description TEXT NOT NULL,
  budget TEXT NOT NULL,
  timeline TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  file_urls TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'declined', 'contacted')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_team_members_org_id ON team_members(org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_team_members_is_active ON team_members(is_active);

CREATE INDEX IF NOT EXISTS idx_projects_org_id ON projects(org_id);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON projects(due_date);

CREATE INDEX IF NOT EXISTS idx_project_assignees_project_id ON project_assignees(project_id);
CREATE INDEX IF NOT EXISTS idx_project_assignees_team_member_id ON project_assignees(team_member_id);

CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_project_milestones_order ON project_milestones(project_id, order_index);

CREATE INDEX IF NOT EXISTS idx_approvals_org_id ON approvals(org_id);
CREATE INDEX IF NOT EXISTS idx_approvals_project_id ON approvals(project_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_priority ON approvals(priority);
CREATE INDEX IF NOT EXISTS idx_approvals_created_at ON approvals(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deliverables_project_id ON deliverables(project_id);

CREATE INDEX IF NOT EXISTS idx_project_messages_project_id ON project_messages(project_id);
CREATE INDEX IF NOT EXISTS idx_project_messages_created_at ON project_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_intake_submissions_org_id ON intake_submissions(org_id);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_status ON intake_submissions(status);
CREATE INDEX IF NOT EXISTS idx_intake_submissions_created_at ON intake_submissions(created_at DESC);

-- Triggers to automatically update updated_at
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_milestones_updated_at BEFORE UPDATE ON project_milestones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approvals_updated_at BEFORE UPDATE ON approvals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_intake_submissions_updated_at BEFORE UPDATE ON intake_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically update team member status based on capacity
CREATE OR REPLACE FUNCTION update_team_member_status()
RETURNS TRIGGER AS $$
DECLARE
  capacity_percentage INTEGER;
BEGIN
  -- Calculate capacity percentage
  capacity_percentage := (NEW.hours_allocated * 100) / NULLIF(NEW.capacity_hours, 0);

  -- Update status based on capacity
  IF capacity_percentage >= 100 THEN
    NEW.status := 'over-capacity';
  ELSIF capacity_percentage >= 80 THEN
    NEW.status := 'near-capacity';
  ELSE
    NEW.status := 'available';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update team member status
CREATE TRIGGER auto_update_team_member_status
  BEFORE INSERT OR UPDATE OF hours_allocated, capacity_hours ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION update_team_member_status();

-- Function to automatically update project category based on status
CREATE OR REPLACE FUNCTION update_project_category()
RETURNS TRIGGER AS $$
BEGIN
  -- Update category based on status
  IF NEW.status = 'completed' OR NEW.status = 'archived' THEN
    NEW.category := 'completed';
  ELSIF NEW.status = 'at-risk' OR NEW.status = 'delayed' THEN
    NEW.category := 'at-risk';
  ELSE
    NEW.category := 'active';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update project category
CREATE TRIGGER auto_update_project_category
  BEFORE INSERT OR UPDATE OF status ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_project_category();

-- Function to sync team member project count
CREATE OR REPLACE FUNCTION sync_team_member_project_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Update current_projects count for affected team members
  UPDATE team_members
  SET current_projects = (
    SELECT COUNT(DISTINCT pa.project_id)
    FROM project_assignees pa
    JOIN projects p ON pa.project_id = p.id
    WHERE pa.team_member_id = team_members.id
      AND p.status NOT IN ('completed', 'archived')
  )
  WHERE id IN (
    SELECT DISTINCT team_member_id
    FROM (
      SELECT OLD.team_member_id AS team_member_id WHERE TG_OP = 'DELETE'
      UNION
      SELECT NEW.team_member_id WHERE TG_OP IN ('INSERT', 'UPDATE')
    ) AS affected_members
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync project count when assignments change
CREATE TRIGGER sync_project_count_on_assignment
  AFTER INSERT OR UPDATE OR DELETE ON project_assignees
  FOR EACH ROW
  EXECUTE FUNCTION sync_team_member_project_count();

-- Enable Row Level Security (RLS)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Team Members: Users can view team members in their organization
CREATE POLICY "Users can view team members" ON team_members
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage team members" ON team_members
  FOR ALL USING (true);

-- Projects: Users can access projects in their organization
CREATE POLICY "Users can view projects" ON projects
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage projects" ON projects
  FOR ALL USING (true);

-- Project Assignees
CREATE POLICY "Users can view project assignees" ON project_assignees
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage project assignees" ON project_assignees
  FOR ALL USING (true);

-- Project Milestones
CREATE POLICY "Users can view project milestones" ON project_milestones
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage project milestones" ON project_milestones
  FOR ALL USING (true);

-- Approvals
CREATE POLICY "Users can view approvals" ON approvals
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage approvals" ON approvals
  FOR ALL USING (true);

-- Deliverables
CREATE POLICY "Users can view deliverables" ON deliverables
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage deliverables" ON deliverables
  FOR ALL USING (true);

-- Project Messages
CREATE POLICY "Users can view project messages" ON project_messages
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage project messages" ON project_messages
  FOR ALL USING (true);

-- Intake Submissions
CREATE POLICY "Anyone can submit intake forms" ON intake_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view intake submissions" ON intake_submissions
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage intake submissions" ON intake_submissions
  FOR ALL USING (true);
