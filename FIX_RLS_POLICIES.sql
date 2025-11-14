-- =====================================================
-- FIX RLS POLICIES - Allow Users to Read Their Data
-- =====================================================
-- This fixes the 500 error by updating RLS policies

-- =====================================================
-- 1. DROP AND RECREATE USER_ORGANIZATIONS POLICIES
-- =====================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own org memberships" ON user_organizations;
DROP POLICY IF EXISTS "Org admins can view org members" ON user_organizations;

-- Allow users to read their own org memberships
CREATE POLICY "Users can view own org memberships"
  ON user_organizations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow users to insert their own org memberships (for new signups)
CREATE POLICY "Users can create own org memberships"
  ON user_organizations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Allow org owners to view all members
CREATE POLICY "Org owners can view members"
  ON user_organizations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations uo
      WHERE uo.org_id = user_organizations.org_id
        AND uo.user_id = auth.uid()
        AND uo.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- 2. FIX USER_PROFILES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow users to insert their own profile (for new signups)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- =====================================================
-- 3. ENABLE PUBLIC READ FOR ORGANIZATIONS
-- =====================================================

-- Allow authenticated users to read organizations they're members of
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- 4. VERIFY YOUR USER EXISTS
-- =====================================================

-- Check if your user profile exists
DO $$
DECLARE
  profile_exists BOOLEAN;
  org_link_exists BOOLEAN;
BEGIN
  -- Check user_profiles
  SELECT EXISTS(
    SELECT 1 FROM user_profiles
    WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
  ) INTO profile_exists;

  IF NOT profile_exists THEN
    RAISE NOTICE 'Creating user profile...';
    INSERT INTO user_profiles (id, email, full_name)
    SELECT
      id,
      email,
      COALESCE(
        raw_user_meta_data->>'full_name',
        raw_user_meta_data->>'name',
        split_part(email, '@', 1)
      )
    FROM auth.users
    WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
    ON CONFLICT (id) DO NOTHING;
  ELSE
    RAISE NOTICE 'User profile already exists';
  END IF;

  -- Check user_organizations
  SELECT EXISTS(
    SELECT 1 FROM user_organizations
    WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
  ) INTO org_link_exists;

  IF NOT org_link_exists THEN
    RAISE NOTICE 'User not linked to any organization - need to create org first';
  ELSE
    RAISE NOTICE 'User already linked to organization';
  END IF;
END $$;

-- =====================================================
-- 5. CREATE DEFAULT ORGANIZATION IF NEEDED
-- =====================================================

-- Only create org if user has no organizations
DO $$
DECLARE
  org_count INTEGER;
  new_org_id VARCHAR;
  user_email TEXT;
BEGIN
  -- Count user's organizations
  SELECT COUNT(*) INTO org_count
  FROM user_organizations
  WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

  IF org_count = 0 THEN
    RAISE NOTICE 'Creating default organization for user...';

    -- Get user email
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

    -- Create organization
    INSERT INTO organizations (name, email)
    VALUES (
      split_part(user_email, '@', 1) || '''s Organization',
      user_email
    )
    RETURNING id INTO new_org_id;

    -- Link user to organization
    INSERT INTO user_organizations (user_id, org_id, role)
    VALUES (
      '0082768b-c40a-4c4e-8150-84a3dd406cbc',
      new_org_id,
      'owner'
    );

    RAISE NOTICE 'Organization created: %', new_org_id;
  ELSE
    RAISE NOTICE 'User already has % organization(s)', org_count;
  END IF;
END $$;

-- =====================================================
-- 6. VERIFY SETUP
-- =====================================================

-- Show user's profile and organizations
SELECT
  'User Profile' as type,
  up.id::TEXT as id,
  up.email,
  up.full_name
FROM user_profiles up
WHERE up.id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'

UNION ALL

SELECT
  'Organization Link' as type,
  uo.id::TEXT as id,
  o.name as email,
  uo.role as full_name
FROM user_organizations uo
JOIN organizations o ON o.id = uo.org_id
WHERE uo.user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- =====================================================
-- DONE!
-- =====================================================
-- Refresh your dashboard after running this script
-- The 500 errors should be fixed!
