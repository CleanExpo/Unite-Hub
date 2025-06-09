# 🔧 Immediate Fix for "column role does not exist"

The error suggests you have an existing `user_profiles` table that's missing the `role` column.

## Quick Fix: Run This SQL

```sql
-- Add the missing role column to existing user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'User' 
CHECK (role IN ('Master', 'Admin', 'Manager', 'User'));

-- Check if it worked
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'role';

-- Now update your role
UPDATE user_profiles 
SET role = 'Master' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

## Alternative: Drop and Recreate (if the above doesn't work)

```sql
-- 1. Drop the existing table
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. Run the full script from database/crm-auth-permissions-schema-fixed.sql

-- 3. Create profiles for existing users
INSERT INTO user_profiles (id, role, is_active)
SELECT id, 'User', true
FROM auth.users;

-- 4. Update your role
UPDATE user_profiles 
SET role = 'Master' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
```

## What Went Wrong?
You likely have an older version of the user_profiles table that doesn't include the role column. This fix adds it.
