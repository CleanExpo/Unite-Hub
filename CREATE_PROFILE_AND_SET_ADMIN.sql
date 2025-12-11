-- Create profile row and set guardian_admin
-- Run in Supabase Dashboard → SQL Editor

-- Step 1: Insert profile if it doesn't exist
INSERT INTO profiles (id, guardian_role)
SELECT id, 'guardian_admin'
FROM auth.users 
WHERE email = 'contact@unite-group.in'
ON CONFLICT (id) DO UPDATE 
SET guardian_role = 'guardian_admin';

-- Step 2: Verify it worked
SELECT 
  u.id,
  u.email,
  p.guardian_role,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'contact@unite-group.in';
