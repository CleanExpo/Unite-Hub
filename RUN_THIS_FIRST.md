# 🚨 IMPORTANT: Run This First!

The `user_profiles` table doesn't exist yet. You need to create it before you can update any roles.

## Step 1: Create the Authentication Tables

Copy ALL content from `database/crm-auth-permissions-schema-fixed.sql` and run it in your Supabase SQL editor.

This will create:
- `user_profiles` table (where the 'role' column lives)
- All permission tables
- Automatic triggers

## Step 2: Verify Creation

After running the script, check if it worked:

```sql
-- This should return true
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
) as user_profiles_exists;
```

## Step 3: Create Profiles for Existing Users

Since you already have users, run this to create their profiles:

```sql
-- Create profiles for all existing users
INSERT INTO user_profiles (id, role, is_active)
SELECT id, 'User', true
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);
```

## Step 4: Update Your Role to Master

Now you can update your role:

```sql
-- First find your user ID
SELECT id, email FROM auth.users;

-- Then update your role (replace the ID)
UPDATE user_profiles 
SET role = 'Master' 
WHERE id = 'paste-your-id-here';
```

## ⚠️ Common Issues

### "relation user_profiles does not exist"
This means Step 1 wasn't completed. Make sure you run the ENTIRE content of `database/crm-auth-permissions-schema-fixed.sql`.

### "column role does not exist"
Same issue - the table doesn't exist yet. Complete Step 1.

### The script runs but nothing happens
Check for error messages in the Supabase SQL editor. You might need to run it in smaller chunks.
