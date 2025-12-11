-- Create a test session for existing user
-- This generates a temporary access token you can use to bypass OAuth setup

-- 1. Get user ID for phill.mcgurk@gmail.com
SELECT
  id,
  email,
  raw_user_meta_data->>'guardian_role' as guardian_role
FROM auth.users
WHERE email = 'phill.mcgurk@gmail.com';

-- 2. For testing, you can manually set a session in browser DevTools:
-- Open browser console and run:
-- localStorage.setItem('sb-lksfwktwtmyznckodsau-auth-token', '{"access_token":"YOUR_TOKEN","refresh_token":"YOUR_REFRESH","user":{"id":"USER_ID_FROM_ABOVE","email":"phill.mcgurk@gmail.com"}}')

-- ALTERNATIVE: Set up Google OAuth in Supabase Dashboard
-- 1. Go to: https://console.supabase.com/project/[YOUR_PROJECT]/auth/providers
-- 2. Enable Google provider
-- 3. Add OAuth credentials from Google Cloud Console
-- 4. Set redirect URL: http://localhost:3008/auth/callback
