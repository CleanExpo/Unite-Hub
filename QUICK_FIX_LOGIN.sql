-- EMERGENCY LOGIN FIX
-- Run this in Supabase SQL Editor to set password WITHOUT email

-- Set password to: TestPass123!
UPDATE auth.users
SET
  encrypted_password = crypt('TestPass123!', gen_salt('bf')),
  email_confirmed_at = NOW(),
  confirmation_token = '',
  recovery_token = '',
  confirmed_at = NOW()
WHERE email = 'phill.mcgurk@gmail.com';

-- Verify it worked - should show confirmed timestamp
SELECT
  email,
  email_confirmed_at,
  confirmed_at,
  raw_user_meta_data->>'guardian_role' as guardian_role
FROM auth.users
WHERE email = 'phill.mcgurk@gmail.com';

-- RESULT SHOULD SHOW:
-- email: phill.mcgurk@gmail.com
-- email_confirmed_at: [timestamp]
-- confirmed_at: [timestamp]
-- guardian_role: guardian_admin

-- NOW GO TO: http://localhost:3008/login
-- Email: phill.mcgurk@gmail.com
-- Password: TestPass123!
