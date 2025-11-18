-- CREATE MISSING USER PROFILE
-- User ID: 0082768b-c40a-4c4e-8150-84a3dd406cbc
-- Email: phill.mcgurk@gmail.com

-- First, check if profile already exists
SELECT
  id,
  email,
  full_name,
  created_at
FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- If above returns no rows, create the profile
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  avatar_url,
  created_at,
  updated_at
)
VALUES (
  '0082768b-c40a-4c4e-8150-84a3dd406cbc',
  'phill.mcgurk@gmail.com',
  'Phill McGurk',
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify profile was created
SELECT
  id,
  email,
  full_name,
  created_at
FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Also verify organization link exists
SELECT
  uo.id,
  uo.user_id,
  uo.org_id,
  uo.role,
  uo.is_active,
  o.name as org_name
FROM user_organizations uo
LEFT JOIN organizations o ON o.id = uo.org_id
WHERE uo.user_id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';
