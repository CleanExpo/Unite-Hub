-- =====================================================
-- CREATE USER PROFILE AND LINK TO ORGANIZATION (SIMPLE)
-- =====================================================
-- Minimal script that only uses columns we know exist

-- =====================================================
-- 1. CREATE OR UPDATE USER PROFILE
-- =====================================================

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
-- 2. CREATE ORGANIZATION AND LINK USER
-- =====================================================

DO $$
DECLARE
  v_org_id VARCHAR;
  v_user_email TEXT;
  v_org_name TEXT;
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
    RAISE NOTICE 'Creating organization and linking user...';

    -- Create organization name from email
    v_org_name := split_part(v_user_email, '@', 1) || '''s Organization';

    -- Create new organization (only name column)
    INSERT INTO organizations (name)
    VALUES (v_org_name)
    RETURNING id INTO v_org_id;

    RAISE NOTICE 'Created organization: % (ID: %)', v_org_name, v_org_id;

    -- Link user to organization as owner
    INSERT INTO user_organizations (user_id, org_id, role, is_active)
    VALUES (
      '0082768b-c40a-4c4e-8150-84a3dd406cbc',
      v_org_id,
      'owner',
      true
    );

    RAISE NOTICE 'User linked as owner';
  END IF;
END $$;

-- =====================================================
-- 3. CREATE DEFAULT WORKSPACE
-- =====================================================

DO $$
DECLARE
  v_org_id VARCHAR;
  v_workspace_id UUID;
BEGIN
  -- Get user's organization
  SELECT org_id INTO v_org_id
  FROM user_organizations
  WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    -- Check if workspace exists
    IF NOT EXISTS (SELECT 1 FROM workspaces WHERE org_id = v_org_id) THEN
      -- Create default workspace
      INSERT INTO workspaces (org_id, name, description)
      VALUES (
        v_org_id,
        'Main Workspace',
        'Your primary workspace for managing contacts and campaigns'
      )
      RETURNING id INTO v_workspace_id;

      RAISE NOTICE 'Created workspace: %', v_workspace_id;
    ELSE
      RAISE NOTICE 'Workspace already exists';
    END IF;
  END IF;
END $$;

-- =====================================================
-- 4. VERIFY SETUP
-- =====================================================

SELECT
  up.email as user_email,
  up.full_name as user_name,
  uo.role as role,
  o.id as org_id,
  o.name as org_name
FROM user_profiles up
LEFT JOIN user_organizations uo ON uo.user_id = up.id
LEFT JOIN organizations o ON o.id = uo.org_id
WHERE up.id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

SELECT
  w.id as workspace_id,
  w.name as workspace_name
FROM user_organizations uo
JOIN workspaces w ON w.org_id = uo.org_id
WHERE uo.user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';
