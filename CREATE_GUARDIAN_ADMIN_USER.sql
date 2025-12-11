-- Create Guardian Admin User and Set Role
-- Run in Supabase Dashboard → SQL Editor

-- This will create the user via Supabase Auth
-- Then set guardian_admin role in profiles table

-- Note: You need to create the user via Supabase Dashboard → Authentication → Add User
-- Email: contact@unite-group.in
-- Password: Support2025!@

-- After user is created, run this to set guardian_admin role:
UPDATE profiles 
SET guardian_role = 'guardian_admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'contact@unite-group.in'
);

-- Verify it worked:
SELECT 
  u.email,
  p.guardian_role,
  p.created_at
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'contact@unite-group.in';
