-- Check if user profile exists
SELECT 
  id,
  email,
  full_name,
  created_at
FROM user_profiles
WHERE id = '0082768b-c40a-4c4e-8150-84a3dd406cbc';

-- Check if user has organization
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
