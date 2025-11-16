-- Fix User Profiles Table Schema Cache
-- Run this in Supabase SQL Editor to refresh schema cache

-- Force schema cache refresh for user_profiles
SELECT pg_notify('pgrst', 'reload schema');

-- Check current columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Verify the profile exists
SELECT id, email, full_name
FROM user_profiles
LIMIT 5;
