-- Set a test password for phill.mcgurk@gmail.com
-- This allows email/password signin without Google OAuth

-- Run this in Supabase SQL Editor:

-- Option 1: Use Supabase Dashboard UI
-- Go to: Authentication > Users > phill.mcgurk@gmail.com > Click "..." > Reset Password
-- Set password to: TestPass123!

-- Option 2: Direct SQL (requires service role / admin access)
-- Note: This uses pgcrypto extension which should already be enabled

UPDATE auth.users
SET
  encrypted_password = crypt('TestPass123!', gen_salt('bf')),
  email_confirmed_at = NOW(),
  confirmation_token = '',
  recovery_token = ''
WHERE email = 'phill.mcgurk@gmail.com';

-- Verify user can now login
SELECT
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'guardian_role' as guardian_role
FROM auth.users
WHERE email = 'phill.mcgurk@gmail.com';

-- Now you can login at: http://localhost:3008/login
-- Email: phill.mcgurk@gmail.com
-- Password: TestPass123!
