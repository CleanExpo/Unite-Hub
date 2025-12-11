-- Check if user exists and set as guardian_admin
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Check if user exists
SELECT 
  u.id,
  u.email,
  p.guardian_role
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'contact@unite-group.in';

-- Step 2: If user exists, set as guardian_admin
UPDATE profiles 
SET guardian_role = 'guardian_admin' 
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'contact@unite-group.in'
);

-- Step 3: Verify
SELECT 
  u.email,
  p.guardian_role
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'contact@unite-group.in';
