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
