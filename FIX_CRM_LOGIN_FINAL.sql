-- ========================================
-- FINAL CRM LOGIN FIX FOR PHILL
-- ========================================
-- This script does NOT require your password
-- It only fixes your database profile and permissions

-- Step 1: Check if your auth user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'phill.m@carsi.com.au';

-- If no results above, you need to create account first in Supabase Dashboard

-- Step 2: Create user_profiles table with proper constraints
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

-- Step 3: Add missing columns if needed
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

-- Step 4: Create or update Phill's profile
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get Phill's user ID
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'phill.m@carsi.com.au'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Check if profile exists
        IF EXISTS (SELECT 1 FROM user_profiles WHERE id = v_user_id) THEN
            -- Update existing profile
            UPDATE user_profiles 
            SET 
                role = 'Master',
                email = 'phill.m@carsi.com.au',
                full_name = 'Phill McGurk',
                department = 'Executive',
                job_title = 'Co-Founder & CEO',
                is_active = true,
                updated_at = NOW()
            WHERE id = v_user_id;
            
            RAISE NOTICE 'Updated existing profile for Phill';
        ELSE
            -- Create new profile
            INSERT INTO user_profiles (
                id, email, role, full_name, department, 
                job_title, is_active
            ) VALUES (
                v_user_id,
                'phill.m@carsi.com.au',
                'Master',
                'Phill McGurk',
                'Executive',
                'Co-Founder & CEO',
                true
            );
            
            RAISE NOTICE 'Created new profile for Phill';
        END IF;
    ELSE
        RAISE EXCEPTION 'User phill.m@carsi.com.au not found in auth.users. Please create the account first.';
    END IF;
END $$;

-- Step 5: Create trigger for future users
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Only insert if not exists
    IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = NEW.id) THEN
        INSERT INTO user_profiles (id, email, role, is_active)
        VALUES (NEW.id, NEW.email, 'User', true);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Step 6: Create profiles for other existing users
INSERT INTO user_profiles (id, email, role, is_active)
SELECT au.id, au.email, 'User', true
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE up.id IS NULL
  AND au.email != 'phill.m@carsi.com.au';

-- Step 7: Create permissions tables
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'permissions_resource_action_key'
    ) THEN
        ALTER TABLE permissions 
        ADD CONSTRAINT permissions_resource_action_key 
        UNIQUE(resource, action);
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'role_permissions_role_permission_id_key'
    ) THEN
        ALTER TABLE role_permissions 
        ADD CONSTRAINT role_permissions_role_permission_id_key 
        UNIQUE(role, permission_id);
    END IF;
END $$;

-- Step 8: Insert permissions (without ON CONFLICT)
DO $$
BEGIN
    -- CRM permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'crm' AND action = 'read') THEN
        INSERT INTO permissions (resource, action, description) 
        VALUES ('crm', 'read', 'View CRM data');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'crm' AND action = 'write') THEN
        INSERT INTO permissions (resource, action, description) 
        VALUES ('crm', 'write', 'Create and edit CRM data');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'crm' AND action = 'delete') THEN
        INSERT INTO permissions (resource, action, description) 
        VALUES ('crm', 'delete', 'Delete CRM data');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'crm' AND action = 'admin') THEN
        INSERT INTO permissions (resource, action, description) 
        VALUES ('crm', 'admin', 'Full CRM administration');
    END IF;
    
    -- User permissions
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'users' AND action = 'read') THEN
        INSERT INTO permissions (resource, action, description) 
        VALUES ('users', 'read', 'View user accounts');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'users' AND action = 'write') THEN
        INSERT INTO permissions (resource, action, description) 
        VALUES ('users', 'write', 'Create and edit user accounts');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'users' AND action = 'delete') THEN
        INSERT INTO permissions (resource, action, description) 
        VALUES ('users', 'delete', 'Delete user accounts');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM permissions WHERE resource = 'users' AND action = 'admin') THEN
        INSERT INTO permissions (resource, action, description) 
        VALUES ('users', 'admin', 'Full user administration');
    END IF;
END $$;

-- Step 9: Grant all permissions to Master role
INSERT INTO role_permissions (role, permission_id)
SELECT 'Master', p.id 
FROM permissions p
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions rp 
    WHERE rp.role = 'Master' 
    AND rp.permission_id = p.id
);

-- Step 10: Create permission check function
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

-- Step 11: Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS policies (drop existing first)
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Masters can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Masters can update all profiles" ON user_profiles;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Masters can read all profiles
CREATE POLICY "Masters can read all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'Master'
        )
    );

-- Masters can update all profiles
CREATE POLICY "Masters can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role = 'Master'
        )
    );

-- Step 13: FINAL VERIFICATION
SELECT 
    'Checking your account...' as status;

SELECT 
    'Auth User' as type,
    au.id,
    au.email,
    au.created_at::text as created_at
FROM auth.users au
WHERE au.email = 'phill.m@carsi.com.au'
UNION ALL
SELECT 
    'User Profile' as type,
    up.id,
    'Role: ' || up.role || ', Active: ' || up.is_active::text || ', Name: ' || COALESCE(up.full_name, 'Not set'),
    up.created_at::text
FROM user_profiles up
WHERE up.email = 'phill.m@carsi.com.au';

-- ========================================
-- TROUBLESHOOTING:
-- 
-- 1. If you see "Auth User" but no "User Profile":
--    The profile creation failed. Check error messages above.
--
-- 2. If you see neither:
--    You need to create your account first:
--    - Go to Supabase Dashboard > Authentication > Users
--    - Create account with email: phill.m@carsi.com.au
--    - Then run this script again
--
-- 3. Your password is NOT needed for this script
--    This only fixes your database profile
-- ========================================
