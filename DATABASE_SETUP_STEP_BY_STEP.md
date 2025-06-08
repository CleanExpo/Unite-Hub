# Database Setup - Step by Step Guide

## Prerequisites
Make sure you have:
1. Access to your Supabase project SQL editor
2. At least one user already registered in your Supabase auth

## Step 1: Check if Tables Already Exist

Run this query first to see what tables exist:

```sql
-- Check existing tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

## Step 2: Create the CRM Tables (if needed)

If the basic CRM tables don't exist, run this first:

```sql
-- Run the content from database/setup-crm-tables-only.sql
-- This creates: clients, projects, deals, tasks, interactions, pipelines, pipeline_stages
```

## Step 3: Create the Authentication Tables

Run this to create the authentication schema:

```sql
-- IMPORTANT: Run the ENTIRE content from database/crm-auth-permissions-schema-fixed.sql
-- This creates: user_profiles, permissions, role_permissions, user_permissions, permission_audit_log
```

## Step 4: Verify Tables Were Created

```sql
-- Check if user_profiles was created
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```

## Step 5: Check Existing Users

```sql
-- See all users in auth.users
SELECT id, email, created_at 
FROM auth.users;
```

## Step 6: Check User Profiles

```sql
-- See if user profiles were created
SELECT * FROM user_profiles;
```

## Step 7: Update Your User to Master Role

Only run this AFTER confirming user_profiles table exists:

```sql
-- First, find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- Then update the role (replace 'your-user-id' with the actual ID)
UPDATE user_profiles 
SET role = 'Master' 
WHERE id = 'your-user-id';
```

## Troubleshooting

### If user_profiles table doesn't exist:
1. Make sure you ran the ENTIRE content of `database/crm-auth-permissions-schema-fixed.sql`
2. Check for any error messages when running the script

### If user_profiles exists but is empty:
The trigger might not have fired for existing users. Manually insert profiles:

```sql
-- Create profiles for existing users
INSERT INTO user_profiles (id, role, is_active)
SELECT id, 'User', true
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);
```

### If you get permission errors:
Make sure you're running the queries as a database admin in Supabase.

## Expected Result

After successful setup, this query should return your user with Master role:

```sql
SELECT 
    up.id,
    au.email,
    up.role,
    up.is_active
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE up.role = 'Master';
