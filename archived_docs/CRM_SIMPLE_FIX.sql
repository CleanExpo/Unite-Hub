-- ========================================
-- SIMPLE CRM LOGIN FIX - PHILL
-- ========================================

-- PART 1: FIX YOUR PROFILE
-- This ensures you have Master access

-- First check if you exist
SELECT 'Checking if your account exists...' as status;
SELECT id, email FROM auth.users WHERE email = 'phill.m@carsi.com.au';

-- Create user_profiles table if needed
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'User',
    full_name TEXT,
    phone TEXT,
    department TEXT,
    job_title TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fix or create your profile
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get your user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'phill.m@carsi.com.au'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE 'USER NOT FOUND! You need to create account first in Supabase Dashboard';
    ELSE
        -- Delete any existing profile
        DELETE FROM user_profiles WHERE id = v_user_id;
        
        -- Create fresh profile
        INSERT INTO user_profiles (
            id, 
            email, 
            role, 
            full_name, 
            department, 
            job_title, 
            is_active
        ) VALUES (
            v_user_id,
            'phill.m@carsi.com.au',
            'Master',
            'Phill McGurk',
            'Executive',
            'Co-Founder & CEO',
            true
        );
        
        RAISE NOTICE 'SUCCESS! Profile created with Master role';
    END IF;
END $$;

-- PART 2: SIMPLE PERMISSIONS SETUP
-- Drop and recreate permission tables to avoid conflicts

DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;

-- Create permissions table
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource, action)
);

-- Create role_permissions table with correct structure
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- Insert basic permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('crm', 'read', 'View CRM data'),
    ('crm', 'write', 'Create and edit CRM data'),
    ('crm', 'delete', 'Delete CRM data'),
    ('crm', 'admin', 'Full CRM administration'),
    ('users', 'read', 'View user accounts'),
    ('users', 'write', 'Create and edit user accounts'),
    ('users', 'delete', 'Delete user accounts'),
    ('users', 'admin', 'Full user administration');

-- Grant all permissions to Master role
INSERT INTO role_permissions (role, permission_id)
SELECT 'Master', id FROM permissions;

-- PART 3: PERMISSION CHECK FUNCTION
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
BEGIN
    -- Get user role
    SELECT role INTO v_role
    FROM user_profiles
    WHERE id = p_user_id AND is_active = true;
    
    -- Master has all permissions
    IF v_role = 'Master' THEN
        RETURN true;
    END IF;
    
    -- Check specific permission
    RETURN EXISTS(
        SELECT 1
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = v_role
        AND p.resource = p_resource
        AND p.action = p_action
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PART 4: ENABLE RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Masters can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Masters can update all profiles" ON user_profiles;

-- Create simple policies
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Masters can do everything" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'Master'
        )
    );

-- PART 5: VERIFY EVERYTHING
SELECT 'FINAL CHECK:' as status;

SELECT 
    CASE 
        WHEN au.id IS NULL THEN '❌ NO ACCOUNT - Create in Supabase first!'
        WHEN up.id IS NULL THEN '⚠️ Account exists but no profile - Script failed!'
        WHEN up.role = 'Master' AND up.is_active THEN '✅ SUCCESS - You can login!'
        ELSE '❓ Unknown status'
    END as status,
    au.email,
    up.role,
    up.is_active
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'phill.m@carsi.com.au';

-- ========================================
-- WHAT TO DO NEXT:
-- 
-- ✅ If you see "SUCCESS - You can login!"
--    Try logging in with your email and password
--
-- ❌ If you see "NO ACCOUNT"
--    1. Go to Supabase Dashboard > Authentication > Users
--    2. Create account with phill.m@carsi.com.au
--    3. Run this script again
--
-- ⚠️ If you see "Account exists but no profile"
--    Check for error messages above
-- ========================================
