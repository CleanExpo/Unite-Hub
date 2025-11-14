-- =====================================================
-- DEBUG USER SETUP - Check What Data Exists
-- =====================================================

-- 1. Check auth.users
SELECT
  'AUTH USER' as check_type,
  id::TEXT as user_id,
  email,
  raw_user_meta_data->>'full_name' as full_name,
  created_at
FROM auth.users
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- 2. Check user_profiles
SELECT
  'USER PROFILE' as check_type,
  id::TEXT as user_id,
  email,
  full_name,
  created_at
FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- 3. Check user_organizations (THIS IS THE PROBLEM TABLE)
SELECT
  'USER ORGANIZATIONS' as check_type,
  id::TEXT,
  user_id::TEXT,
  org_id,
  role,
  is_active,
  created_at
FROM user_organizations
WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- 4. Check organizations
SELECT
  'ORGANIZATIONS' as check_type,
  id,
  name,
  created_at
FROM organizations
WHERE id IN (
  SELECT org_id FROM user_organizations
  WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
);

-- 5. Check workspaces
SELECT
  'WORKSPACES' as check_type,
  id::TEXT,
  org_id,
  name,
  created_at
FROM workspaces
WHERE org_id IN (
  SELECT org_id FROM user_organizations
  WHERE user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc'
);

-- 6. Check RLS policies on user_organizations
SELECT
  'RLS POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_organizations';
