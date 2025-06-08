-- IMMEDIATE CRM LOGIN FIX
-- Run this entire script in your Supabase SQL Editor

-- Step 1: Check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'permissions', 'role_permissions')
ORDER BY table_name;

-- Step 2: Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'User',
    full_name TEXT,
    phone TEXT,
    department TEXT,
    job_title TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create trigger to auto-create profiles
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, role, is_active)
    VALUES (NEW.id, 'User', true)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Step 4: Create profiles for existing users
INSERT INTO user_profiles (id, role, is_active)
SELECT id, 'User', true
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- Step 5: Find phill.m@carsi.com.au user ID
SELECT id, email 
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';

-- Step 6: Update Phill to Master role
-- IMPORTANT: Copy the ID from step 5 and replace YOUR-ID-HERE below
UPDATE user_profiles 
SET role = 'Master', 
    full_name = 'Phill McGurk',
    is_active = true
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'phill.m@carsi.com.au'
);

-- Step 7: Verify the update worked
SELECT 
    up.*,
    au.email
FROM user_profiles up
JOIN auth.users au ON up.id = au.id
WHERE au.email = 'phill.m@carsi.com.au';

-- You should see:
-- role: Master
-- is_active: true
-- email: phill.m@carsi.com.au
