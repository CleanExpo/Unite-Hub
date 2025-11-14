-- =====================================================
-- CREATE USER PROFILE AND LINK TO ORGANIZATION (FIXED)
-- =====================================================
-- This fixes "Error fetching organizations" by properly
-- setting up your Google user with an organization

-- =====================================================
-- 1. CHECK CURRENT STATE
-- =====================================================

-- Show current user from auth.users
SELECT
  'Auth User' as type,
  id::TEXT,
  email,
  raw_user_meta_data->>'full_name' as name,
  created_at
FROM auth.users
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Show if profile exists
SELECT
  'User Profile' as type,
  id::TEXT,
  email,
  full_name,
  created_at
FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Show existing organizations
SELECT
  'Existing Org' as type,
  id,
  name
FROM organizations
LIMIT 5;

-- =====================================================
-- 2. CREATE OR UPDATE USER PROFILE
-- =====================================================

-- Insert or update user profile
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
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = NOW();

-- =====================================================
-- 3. CREATE ORGANIZATION OR USE EXISTING
-- =====================================================

DO $$
DECLARE
  v_org_id VARCHAR;
  v_user_email TEXT;
  v_org_name TEXT;
  v_org_exists BOOLEAN;
BEGIN
  -- Get user email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

  RAISE NOTICE 'User email: %', v_user_email;

  -- Check if user already has an organization link
  SELECT org_id INTO v_org_id
  FROM user_organizations
  WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    RAISE NOTICE 'User already linked to org: %', v_org_id;
  ELSE
    RAISE NOTICE 'User not linked to any organization, creating one...';

    -- Create organization name from email
    v_org_name := split_part(v_user_email, '@', 1) || '''s Organization';

    -- Create new organization
    INSERT INTO organizations (name, plan, status)
    VALUES (v_org_name, 'starter', 'active')
    RETURNING id INTO v_org_id;

    RAISE NOTICE 'Created new organization: % (ID: %)', v_org_name, v_org_id;

    -- Link user to organization as owner
    INSERT INTO user_organizations (user_id, org_id, role, is_active)
    VALUES (
      '0082768b-c40a-4c4e-8150-84a3dd406cbc',
      v_org_id,
      'owner',
      true
    )
    ON CONFLICT (user_id, org_id) DO UPDATE SET
      is_active = true,
      role = 'owner';

    RAISE NOTICE 'User linked to organization as owner';
  END IF;
END $$;

-- =====================================================
-- 4. CREATE DEFAULT WORKSPACE
-- =====================================================

DO $$
DECLARE
  v_org_id VARCHAR;
  v_workspace_id UUID;
  v_workspace_count INTEGER;
BEGIN
  -- Get user's organization
  SELECT org_id INTO v_org_id
  FROM user_organizations
  WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    -- Check if workspace exists
    SELECT COUNT(*) INTO v_workspace_count
    FROM workspaces
    WHERE org_id = v_org_id;

    IF v_workspace_count = 0 THEN
      -- Create default workspace
      INSERT INTO workspaces (org_id, name, description)
      VALUES (
        v_org_id,
        'Main Workspace',
        'Your primary workspace for managing contacts and campaigns'
      )
      RETURNING id INTO v_workspace_id;

      RAISE NOTICE 'Created default workspace: %', v_workspace_id;
    ELSE
      RAISE NOTICE 'Workspace(s) already exist for this organization: %', v_workspace_count;
    END IF;
  ELSE
    RAISE NOTICE 'No organization found for user - something went wrong!';
  END IF;
END $$;

-- =====================================================
-- 5. VERIFY FINAL STATE
-- =====================================================

-- Show complete user setup
SELECT
  up.email as user_email,
  up.full_name as user_name,
  uo.role as role_in_org,
  o.id as org_id,
  o.name as org_name,
  o.plan as org_plan
FROM user_profiles up
LEFT JOIN user_organizations uo ON uo.user_id = up.id
LEFT JOIN organizations o ON o.id = uo.org_id
WHERE up.id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Show workspaces
SELECT
  w.id as workspace_id,
  w.name as workspace_name,
  w.org_id
FROM user_organizations uo
JOIN workspaces w ON w.org_id = uo.org_id
WHERE uo.user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- =====================================================
-- SUCCESS!
-- =====================================================
-- Your user should now be fully set up with:
-- ✅ User profile
-- ✅ Organization (as owner)
-- ✅ Default workspace
--
-- Refresh your dashboard: http://localhost:3008/dashboard/overview
-- The "Error fetching organizations" should be GONE!
