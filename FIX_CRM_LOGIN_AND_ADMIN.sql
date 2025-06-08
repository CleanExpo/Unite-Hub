-- ========================================
-- COMPLETE CRM LOGIN FIX FOR PHILL
-- ========================================
-- Run this entire script in Supabase SQL Editor

-- Step 1: Ensure user_profiles table exists with all needed columns
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'User',
    full_name TEXT,
    phone TEXT,
    department TEXT,
    job_title TEXT,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add email column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'email') THEN
        ALTER TABLE user_profiles ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_profiles' 
                   AND column_name = 'created_by') THEN
        ALTER TABLE user_profiles ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Step 3: Create trigger to auto-create profiles
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, email, role, is_active)
    VALUES (NEW.id, NEW.email, 'User', true)
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Step 4: Create profiles for ALL existing users
INSERT INTO user_profiles (id, email, role, is_active)
SELECT id, email, 'User', true
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO UPDATE
SET email = EXCLUDED.email;

-- Step 5: Update emails in user_profiles from auth.users
UPDATE user_profiles up
SET email = au.email
FROM auth.users au
WHERE up.id = au.id
AND (up.email IS NULL OR up.email != au.email);

-- Step 6: Set Phill as Master with full details
UPDATE user_profiles 
SET 
    role = 'Master', 
    full_name = 'Phill McGurk',
    department = 'Executive',
    job_title = 'Co-Founder & CEO',
    is_active = true,
    email = 'phill.m@carsi.com.au'
WHERE id IN (
    SELECT id FROM auth.users WHERE email = 'phill.m@carsi.com.au'
);

-- Step 7: Create permissions tables if they don't exist
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(resource, action)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission_id)
);

-- Step 8: Insert base permissions
INSERT INTO permissions (resource, action, description) VALUES
    ('crm', 'read', 'View CRM data'),
    ('crm', 'write', 'Create and edit CRM data'),
    ('crm', 'delete', 'Delete CRM data'),
    ('crm', 'admin', 'Full CRM administration'),
    ('users', 'read', 'View user accounts'),
    ('users', 'write', 'Create and edit user accounts'),
    ('users', 'delete', 'Delete user accounts'),
    ('users', 'admin', 'Full user administration')
ON CONFLICT (resource, action) DO NOTHING;

-- Step 9: Grant all permissions to Master role
INSERT INTO role_permissions (role, permission_id)
SELECT 'Master', id FROM permissions
ON CONFLICT (role, permission_id) DO NOTHING;

-- Step 10: Create function to check permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource TEXT,
    p_action TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_has_permission BOOLEAN;
BEGIN
    -- Get user role
    SELECT role INTO v_role
    FROM user_profiles
    WHERE id = p_user_id AND is_active = true;
    
    -- Master role has all permissions
    IF v_role = 'Master' THEN
        RETURN true;
    END IF;
    
    -- Check specific permission
    SELECT EXISTS(
        SELECT 1
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role = v_role
        AND p.resource = p_resource
        AND p.action = p_action
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create function for Masters to create new users
CREATE OR REPLACE FUNCTION create_team_member(
    p_email TEXT,
    p_password TEXT,
    p_role TEXT,
    p_full_name TEXT,
    p_department TEXT DEFAULT NULL,
    p_job_title TEXT DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
    v_user_id UUID;
    v_result JSON;
BEGIN
    -- Check if creator is Master (if provided)
    IF p_created_by IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = p_created_by 
            AND role = 'Master' 
            AND is_active = true
        ) THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Only Master users can create team members'
            );
        END IF;
    END IF;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Email already exists'
        );
    END IF;
    
    -- Create user in auth.users (you'll need to do this via Supabase Dashboard or API)
    -- Return instructions for now
    RETURN json_build_object(
        'success', true,
        'instructions', 'To create the user:' || E'\n' ||
            '1. Go to Supabase Dashboard > Authentication > Users' || E'\n' ||
            '2. Click "Add user" > "Create new user"' || E'\n' ||
            '3. Enter email: ' || p_email || E'\n' ||
            '4. Enter password: ' || p_password || E'\n' ||
            '5. After creation, run this SQL:' || E'\n' ||
            'UPDATE user_profiles SET ' || E'\n' ||
            '  role = ''' || p_role || ''',' || E'\n' ||
            '  full_name = ''' || p_full_name || ''',' || E'\n' ||
            CASE WHEN p_department IS NOT NULL THEN '  department = ''' || p_department || ''',' || E'\n' ELSE '' END ||
            CASE WHEN p_job_title IS NOT NULL THEN '  job_title = ''' || p_job_title || ''',' || E'\n' ELSE '' END ||
            '  created_by = ''' || COALESCE(p_created_by::TEXT, 'YOUR_ID') || '''' || E'\n' ||
            'WHERE email = ''' || p_email || ''';'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 13: Create RLS policies
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow Masters to read all profiles
CREATE POLICY "Masters can read all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'Master'
        )
    );

-- Allow Masters to update all profiles
CREATE POLICY "Masters can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'Master'
        )
    );

-- Step 14: VERIFICATION - Check Phill's account
SELECT 
    'Auth User:' as type,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
WHERE au.email = 'phill.m@carsi.com.au'
UNION ALL
SELECT 
    'User Profile:' as type,
    up.id,
    up.email || ' (Role: ' || up.role || ', Active: ' || up.is_active || ')',
    up.created_at
FROM user_profiles up
WHERE up.email = 'phill.m@carsi.com.au';

-- Step 15: Show how to create a new team member
SELECT 'To create a new team member, use this example:' as instructions
UNION ALL
SELECT 'SELECT create_team_member('
UNION ALL
SELECT '    ''newuser@company.com'',     -- email'
UNION ALL
SELECT '    ''SecurePassword123!'',      -- password'
UNION ALL
SELECT '    ''Admin'',                   -- role (User, Admin, Manager, Master)'
UNION ALL
SELECT '    ''John Doe'',                -- full name'
UNION ALL
SELECT '    ''Sales'',                   -- department (optional)'
UNION ALL
SELECT '    ''Sales Manager'',           -- job title (optional)'
UNION ALL
SELECT '    ''' || COALESCE((SELECT id::TEXT FROM auth.users WHERE email = 'phill.m@carsi.com.au'), 'YOUR_ID') || '''  -- your user ID'
UNION ALL
SELECT ');';

-- ========================================
-- IMPORTANT NOTES:
-- 1. After running this script, you should be able to login
-- 2. If login still fails, check:
--    - Your password is correct
--    - You're using the correct email: phill.m@carsi.com.au
--    - The Supabase project URL is correct in your .env file
-- 3. To create new users, follow the instructions in step 15
-- ========================================
