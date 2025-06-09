# CRM Login Fix for phill.m@carsi.com.au

## The Issue
You can't log into the CRM because the database authentication tables haven't been set up yet in Supabase.

## Quick Fix - Follow These Steps

### 1. Go to Supabase SQL Editor
Open your Supabase project and go to the SQL Editor.

### 2. Run This Check First
```sql
-- Check if user_profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
);
```

If it returns `false`, continue to step 3. If `true`, skip to step 4.

### 3. Create the Authentication Tables
Copy and paste the ENTIRE content from `database/crm-auth-permissions-schema-fixed.sql` into the SQL editor and run it.

This will create:
- user_profiles table
- permissions system
- role-based access control
- audit logging

### 4. Find Your User ID
```sql
-- Find your user ID
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';
```

Copy the `id` value from the result.

### 5. Set Yourself as Master User
Replace `YOUR-ID-HERE` with the ID from step 4:

```sql
-- First check if profile exists
SELECT * FROM user_profiles WHERE id = 'YOUR-ID-HERE';

-- If no result, create profile:
INSERT INTO user_profiles (id, role, full_name, is_active)
VALUES ('YOUR-ID-HERE', 'Master', 'Phill McGurk', true);

-- If profile exists, update it:
UPDATE user_profiles 
SET role = 'Master', is_active = true
WHERE id = 'YOUR-ID-HERE';
```

### 6. Verify Setup
```sql
-- Verify you're set as Master
SELECT 
    up.id,
    au.email,
    up.role,
    up.is_active
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'phill.m@carsi.com.au';
```

This should show:
- email: phill.m@carsi.com.au
- role: Master
- is_active: true

## After Setup
Once these steps are complete, you should be able to:
1. Log into the CRM at your-site.com/login
2. Access the dashboard at your-site.com/dashboard
3. Have full Master-level permissions

## If Still Having Issues
1. Clear your browser cache/cookies
2. Try an incognito/private window
3. Check the browser console for any error messages
4. Make sure you're using the correct password

## Need to Reset Password?
Use the "Forgot Password" link on the login page, or run this in Supabase:
```sql
-- This will send a password reset email
SELECT auth.admin_generate_link('recovery', 'phill.m@carsi.com.au');
