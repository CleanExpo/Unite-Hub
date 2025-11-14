-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  team_size TEXT,
  industry TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'professional', 'enterprise')) DEFAULT 'starter',
  status TEXT NOT NULL CHECK (status IN ('active', 'trial', 'cancelled')) DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  job_title TEXT,
  ai_score DECIMAL(3,2) DEFAULT 0.0 CHECK (ai_score >= 0 AND ai_score <= 1),
  status TEXT NOT NULL CHECK (status IN ('prospect', 'lead', 'customer', 'contact')) DEFAULT 'prospect',
  last_interaction TIMESTAMP WITH TIME ZONE,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  "from" TEXT NOT NULL,
  "to" TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  ai_summary TEXT,
  is_processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated Content table
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('followup', 'proposal', 'case_study')),
  generated_text TEXT NOT NULL,
  ai_model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'approved', 'sent')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'paused')) DEFAULT 'draft',
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  replied_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  agent TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  error_message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workspaces_org_id ON workspaces(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ai_score ON contacts(ai_score DESC);
CREATE INDEX IF NOT EXISTS idx_emails_workspace_id ON emails(workspace_id);
CREATE INDEX IF NOT EXISTS idx_emails_contact_id ON emails(contact_id);
CREATE INDEX IF NOT EXISTS idx_emails_is_processed ON emails(is_processed);
CREATE INDEX IF NOT EXISTS idx_generated_content_workspace_id ON generated_content(workspace_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_contact_id ON generated_content(contact_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_status ON generated_content(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id ON campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_customer_id ON organizations(stripe_customer_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emails_updated_at BEFORE UPDATE ON emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_content_updated_at BEFORE UPDATE ON generated_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (basic - can be customized based on auth requirements)
-- Note: These policies assume you'll use service role key for server-side operations
-- For client-side access, you'll need more specific policies based on user authentication

-- Organizations: Users can read/update their own organizations
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage organizations" ON organizations
  FOR ALL USING (true);

-- Workspaces: Users can access workspaces in their organizations
CREATE POLICY "Users can view workspaces" ON workspaces
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage workspaces" ON workspaces
  FOR ALL USING (true);

-- Contacts: Users can access contacts in their workspaces
CREATE POLICY "Users can view contacts" ON contacts
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage contacts" ON contacts
  FOR ALL USING (true);

-- Emails: Users can access emails in their workspaces
CREATE POLICY "Users can view emails" ON emails
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage emails" ON emails
  FOR ALL USING (true);

-- Generated Content: Users can access content in their workspaces
CREATE POLICY "Users can view generated content" ON generated_content
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage generated content" ON generated_content
  FOR ALL USING (true);

-- Campaigns: Users can access campaigns in their workspaces
CREATE POLICY "Users can view campaigns" ON campaigns
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage campaigns" ON campaigns
  FOR ALL USING (true);

-- Audit Logs: Users can view audit logs for their organizations
CREATE POLICY "Users can view audit logs" ON audit_logs
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage audit logs" ON audit_logs
  FOR ALL USING (true);
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
-- =====================================================
-- UNITE-HUB: CREATE MISSING AUTHENTICATION TABLES (FIXED)
-- =====================================================
-- This version works with your existing organizations table
-- that has VARCHAR id instead of UUID

-- =====================================================
-- 1. CREATE USER_PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

-- RLS Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- RLS Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- 2. CREATE USER_ORGANIZATIONS TABLE
-- =====================================================
-- IMPORTANT: Uses VARCHAR for org_id to match existing organizations table
CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id VARCHAR NOT NULL,  -- VARCHAR to match existing organizations.id
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')) DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT true,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique user-org combination
  UNIQUE(user_id, org_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_orgs_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_org_id ON user_organizations(org_id);
CREATE INDEX IF NOT EXISTS idx_user_orgs_role ON user_organizations(role);

-- Enable RLS
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org admins can view org members" ON user_organizations;

-- RLS Policy: Users can view their own organization memberships
CREATE POLICY "Users can view own org memberships"
  ON user_organizations FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Org owners/admins can view all members
CREATE POLICY "Org admins can view org members"
  ON user_organizations FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 3. CREATE TRIGGER TO AUTO-CREATE USER PROFILE
-- =====================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into user_profiles
  INSERT INTO user_profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =====================================================
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_profile_timestamp ON user_profiles;
CREATE TRIGGER trigger_update_user_profile_timestamp
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_timestamp();

-- Auto-update updated_at for user_organizations
CREATE OR REPLACE FUNCTION update_user_org_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_org_timestamp ON user_organizations;
CREATE TRIGGER trigger_update_user_org_timestamp
  BEFORE UPDATE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_org_timestamp();

-- =====================================================
-- 5. FIX EXISTING GOOGLE USER
-- =====================================================
-- Create profile for user ID: 0082768b-c40a-4c4e-8150-84a3dd406cbc
INSERT INTO user_profiles (id, email, full_name, avatar_url)
SELECT
  id,
  email,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ) as full_name,
  raw_user_meta_data->>'avatar_url' as avatar_url
FROM auth.users
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 6. CREATE OR LINK TO ORGANIZATION
-- =====================================================
-- First, check if organizations table has any records
DO $$
DECLARE
  existing_org_id VARCHAR;
  user_email TEXT;
BEGIN
  -- Get user email
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

  -- Try to find an existing organization
  SELECT id INTO existing_org_id
  FROM organizations
  LIMIT 1;

  -- If no organization exists, create one
  IF existing_org_id IS NULL THEN
    -- Check if organizations table has an id column that's VARCHAR
    INSERT INTO organizations (name, email)
    VALUES (
      split_part(user_email, '@', 1) || '''s Organization',
      user_email
    )
    RETURNING id INTO existing_org_id;
  END IF;

  -- Link user to organization as owner
  INSERT INTO user_organizations (user_id, org_id, role)
  VALUES (
    '0082768b-c40a-4c4e-8150-84a3dd406cbc',
    existing_org_id,
    'owner'
  )
  ON CONFLICT (user_id, org_id) DO NOTHING;

END $$;

-- =====================================================
-- 7. VERIFY INSTALLATION
-- =====================================================
SELECT
  'user_profiles' as table_name,
  COUNT(*) as row_count
FROM user_profiles
UNION ALL
SELECT
  'user_organizations',
  COUNT(*)
FROM user_organizations
UNION ALL
SELECT
  'organizations',
  COUNT(*)
FROM organizations;

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Tables created successfully!
-- Now refresh your Unite-Hub dashboard at http://localhost:3008/dashboard/overview
