-- ================================================
-- Quick Diagnostic Script for Authentication Setup
-- ================================================

-- 1. Check if user_profiles table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
) as user_profiles_exists;

-- 2. If it exists, show its columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 3. Check how many users you have
SELECT COUNT(*) as total_users FROM auth.users;

-- 4. Show your users (without sensitive data)
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check if any user profiles exist (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
        RAISE NOTICE 'user_profiles table exists. Checking count...';
        EXECUTE 'SELECT COUNT(*) FROM user_profiles';
    ELSE
        RAISE NOTICE 'user_profiles table does NOT exist. You need to create it first!';
    END IF;
END $$;

-- If user_profiles doesn't exist, you need to run this entire file:
-- database/crm-auth-permissions-schema-fixed.sql

-- If user_profiles exists but is empty, run this to create profiles for existing users:
/*
INSERT INTO user_profiles (id, role, is_active)
SELECT id, 'User', true
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles);
*/
