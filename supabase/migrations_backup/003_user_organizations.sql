-- Migration: User Organizations and Authentication
-- Description: Adds user-organization relationships, roles, and invites
-- Date: 2025-11-14

-- =====================================================
-- 1. USER PROFILES TABLE
-- =====================================================
-- Extends Supabase auth.users with profile information

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- =====================================================
-- 2. USER ORGANIZATIONS TABLE (Many-to-Many)
-- =====================================================
-- Links users to organizations with roles

CREATE TABLE IF NOT EXISTS user_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
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

-- =====================================================
-- 3. ORGANIZATION INVITES TABLE
-- =====================================================
-- Pending invitations to join organizations

CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')) DEFAULT 'member',
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate pending invites
  UNIQUE(org_id, email)
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);

-- =====================================================
-- 4. TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Auto-update updated_at for user_profiles
CREATE OR REPLACE FUNCTION update_user_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE TRIGGER trigger_update_user_org_timestamp
  BEFORE UPDATE ON user_organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_org_timestamp();

-- =====================================================
-- 5. FUNCTION: CREATE USER PROFILE ON SIGNUP
-- =====================================================
-- Automatically create profile when user signs up

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- 6. FUNCTION: AUTO-ASSIGN TO ORGANIZATION
-- =====================================================
-- If user signs up with a pending invite, auto-assign them

CREATE OR REPLACE FUNCTION handle_user_organization_assignment()
RETURNS TRIGGER AS $$
DECLARE
  pending_invite organization_invites%ROWTYPE;
BEGIN
  -- Check for pending invites for this email
  SELECT * INTO pending_invite
  FROM organization_invites
  WHERE email = NEW.email
    AND accepted_at IS NULL
    AND expires_at > NOW()
  LIMIT 1;

  -- If invite exists, create user_organization record
  IF FOUND THEN
    INSERT INTO user_organizations (user_id, org_id, role)
    VALUES (NEW.id, pending_invite.org_id, pending_invite.role);

    -- Mark invite as accepted
    UPDATE organization_invites
    SET accepted_at = NOW()
    WHERE id = pending_invite.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user_profiles insert
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_user_organization_assignment();

-- =====================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;

-- USER PROFILES POLICIES
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- USER ORGANIZATIONS POLICIES
-- Users can view their own organization memberships
CREATE POLICY "Users can view own org memberships"
  ON user_organizations FOR SELECT
  USING (auth.uid() = user_id);

-- Org owners/admins can view all members of their orgs
CREATE POLICY "Org admins can view org members"
  ON user_organizations FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Org owners can manage members
CREATE POLICY "Org owners can manage members"
  ON user_organizations FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
        AND role = 'owner'
    )
  );

-- ORGANIZATION INVITES POLICIES
-- Org owners/admins can create invites
CREATE POLICY "Org admins can create invites"
  ON organization_invites FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Org owners/admins can view invites for their org
CREATE POLICY "Org admins can view invites"
  ON organization_invites FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Users can view invites sent to their email
CREATE POLICY "Users can view own invites"
  ON organization_invites FOR SELECT
  USING (email = (SELECT email FROM user_profiles WHERE id = auth.uid()));

-- =====================================================
-- 8. UPDATE EXISTING TABLES RLS
-- =====================================================

-- Update team_members RLS to use user_organizations
DROP POLICY IF EXISTS "Users can view team members in their org" ON team_members;
CREATE POLICY "Users can view team members in their org"
  ON team_members FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Update projects RLS
DROP POLICY IF EXISTS "Users can view projects in their org" ON projects;
CREATE POLICY "Users can view projects in their org"
  ON projects FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Update approvals RLS
DROP POLICY IF EXISTS "Users can view approvals in their org" ON approvals;
CREATE POLICY "Users can view approvals in their org"
  ON approvals FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Get user's role in an organization
CREATE OR REPLACE FUNCTION get_user_org_role(user_uuid UUID, org_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_organizations
  WHERE user_id = user_uuid
    AND org_id = org_uuid
    AND is_active = true;

  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has permission in org
CREATE OR REPLACE FUNCTION user_has_org_permission(
  user_uuid UUID,
  org_uuid UUID,
  required_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['viewer', 'member', 'admin', 'owner'];
  user_level INT;
  required_level INT;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM user_organizations
  WHERE user_id = user_uuid
    AND org_id = org_uuid
    AND is_active = true;

  -- If user not in org, return false
  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Get hierarchy levels
  SELECT array_position(role_hierarchy, user_role) INTO user_level;
  SELECT array_position(role_hierarchy, required_role) INTO required_level;

  -- Check if user level >= required level
  RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'User profile information extending auth.users';
COMMENT ON TABLE user_organizations IS 'Many-to-many relationship between users and organizations with roles';
COMMENT ON TABLE organization_invites IS 'Pending invitations for users to join organizations';
COMMENT ON FUNCTION get_user_org_role IS 'Returns user role in specified organization';
COMMENT ON FUNCTION user_has_org_permission IS 'Checks if user has required permission level in organization';
