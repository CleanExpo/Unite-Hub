-- ================================================
-- CREATE USER_PROFILES TABLE FROM SCRATCH
-- ================================================

-- 1. First enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create the user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'User' CHECK (role IN ('Master', 'Admin', 'Manager', 'User')),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,
    full_name VARCHAR(255),
    phone VARCHAR(50),
    department VARCHAR(100),
    job_title VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- 4. Check if the table was created
SELECT 'user_profiles table created successfully' as status
WHERE EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_profiles'
);

-- 5. Create profiles for all existing users
INSERT INTO user_profiles (id, role, is_active)
SELECT 
    id, 
    'User' as role, 
    true as is_active
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;

-- 6. Show all users with their profiles
SELECT 
    au.id,
    au.email,
    COALESCE(up.role, 'User') as role,
    COALESCE(up.is_active, true) as is_active
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
ORDER BY au.email;

-- 7. Update your specific user to Master role
UPDATE user_profiles 
SET role = 'Master' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'support@carsi.com.au');

-- 8. Verify the update
SELECT 
    au.email,
    up.role,
    up.is_active
FROM auth.users au
JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'support@carsi.com.au';
