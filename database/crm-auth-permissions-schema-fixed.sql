-- ================================================
-- CRM Authentication & Permissions Schema (FIXED)
-- ================================================
-- Works with Supabase auth.users table

-- 1. Create user_profiles table to extend auth.users
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

-- 2. Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_active ON user_profiles(is_active);

-- 3. Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, role, is_active)
    VALUES (NEW.id, 'User', true);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(resource, action)
);

-- 6. Create user_permissions table (user-specific permissions)
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, permission_id)
);

-- 7. Create role_permissions table (default permissions for roles)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Master', 'Admin', 'Manager', 'User')),
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(role, permission_id)
);

-- 8. Create permission audit log
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_user_id ON permission_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_audit_log_created_at ON permission_audit_log(created_at DESC);

-- 10. Insert default permissions
INSERT INTO permissions (resource, action, description) VALUES
    -- CRM Module Permissions
    ('crm', 'view', 'View CRM data'),
    ('crm', 'create', 'Create CRM records'),
    ('crm', 'edit', 'Edit CRM records'),
    ('crm', 'delete', 'Delete CRM records'),
    ('crm', 'export', 'Export CRM data'),
    
    -- User Management Permissions
    ('users', 'view', 'View user profiles'),
    ('users', 'create', 'Create new users'),
    ('users', 'edit', 'Edit user profiles'),
    ('users', 'delete', 'Delete users'),
    ('users', 'manage_roles', 'Manage user roles'),
    
    -- System Permissions
    ('system', 'view_logs', 'View system logs'),
    ('system', 'manage_settings', 'Manage system settings'),
    ('system', 'view_analytics', 'View analytics and reports'),
    ('system', 'manage_integrations', 'Manage system integrations'),
    
    -- Financial Permissions
    ('finance', 'view', 'View financial data'),
    ('finance', 'manage', 'Manage financial records')
ON CONFLICT (resource, action) DO NOTHING;

-- 11. Assign default permissions to roles
WITH permission_mapping AS (
    SELECT 
        role,
        resource,
        action
    FROM (VALUES
        -- Master has all permissions
        ('Master', 'crm', 'view'),
        ('Master', 'crm', 'create'),
        ('Master', 'crm', 'edit'),
        ('Master', 'crm', 'delete'),
        ('Master', 'crm', 'export'),
        ('Master', 'users', 'view'),
        ('Master', 'users', 'create'),
        ('Master', 'users', 'edit'),
        ('Master', 'users', 'delete'),
        ('Master', 'users', 'manage_roles'),
        ('Master', 'system', 'view_logs'),
        ('Master', 'system', 'manage_settings'),
        ('Master', 'system', 'view_analytics'),
        ('Master', 'system', 'manage_integrations'),
        ('Master', 'finance', 'view'),
        ('Master', 'finance', 'manage'),
        
        -- Admin has most permissions except system-critical ones
        ('Admin', 'crm', 'view'),
        ('Admin', 'crm', 'create'),
        ('Admin', 'crm', 'edit'),
        ('Admin', 'crm', 'delete'),
        ('Admin', 'crm', 'export'),
        ('Admin', 'users', 'view'),
        ('Admin', 'users', 'create'),
        ('Admin', 'users', 'edit'),
        ('Admin', 'users', 'manage_roles'),
        ('Admin', 'system', 'view_analytics'),
        ('Admin', 'finance', 'view'),
        
        -- Manager has CRM permissions and limited user view
        ('Manager', 'crm', 'view'),
        ('Manager', 'crm', 'create'),
        ('Manager', 'crm', 'edit'),
        ('Manager', 'crm', 'export'),
        ('Manager', 'users', 'view'),
        ('Manager', 'system', 'view_analytics'),
        
        -- User has basic view permissions
        ('User', 'crm', 'view'),
        ('User', 'system', 'view_analytics')
    ) AS pm(role, resource, action)
)
INSERT INTO role_permissions (role, permission_id)
SELECT 
    pm.role,
    p.id
FROM permission_mapping pm
JOIN permissions p ON p.resource = pm.resource AND p.action = pm.action
ON CONFLICT (role, permission_id) DO NOTHING;

-- 12. Create helper function to check permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource VARCHAR,
    p_action VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
    v_user_role VARCHAR(50);
BEGIN
    -- Get user's role
    SELECT role INTO v_user_role
    FROM user_profiles
    WHERE id = p_user_id AND is_active = true;
    
    -- Check if user has permission through role or individual assignment
    SELECT EXISTS (
        SELECT 1
        FROM permissions p
        WHERE p.resource = p_resource 
        AND p.action = p_action
        AND (
            -- Check role permissions
            EXISTS (
                SELECT 1 
                FROM role_permissions rp 
                WHERE rp.permission_id = p.id 
                AND rp.role = v_user_role
            )
            OR
            -- Check individual permissions
            EXISTS (
                SELECT 1 
                FROM user_permissions up 
                WHERE up.permission_id = p.id 
                AND up.user_id = p_user_id
                AND (up.expires_at IS NULL OR up.expires_at > NOW())
            )
        )
    ) INTO v_has_permission;
    
    RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create RLS policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users with user management permissions can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        check_user_permission(auth.uid(), 'users', 'view')
    );

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Only users with manage_roles permission can update roles
CREATE POLICY "Admins can manage user roles" ON user_profiles
    FOR UPDATE USING (
        check_user_permission(auth.uid(), 'users', 'manage_roles')
    );

-- 14. Create view for easy user data access
CREATE OR REPLACE VIEW user_profiles_with_email AS
SELECT 
    up.*,
    au.email,
    au.created_at as auth_created_at,
    au.last_sign_in_at
FROM user_profiles up
JOIN auth.users au ON up.id = au.id;

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON user_profiles_with_email TO authenticated;
GRANT ALL ON user_profiles TO authenticated;
GRANT ALL ON permissions TO authenticated;
GRANT ALL ON user_permissions TO authenticated;
GRANT ALL ON role_permissions TO authenticated;
GRANT ALL ON permission_audit_log TO authenticated;

-- 16. Create function to log permission events
CREATE OR REPLACE FUNCTION log_permission_event(
    p_action VARCHAR,
    p_resource VARCHAR,
    p_details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO permission_audit_log (user_id, action, resource, details)
    VALUES (auth.uid(), p_action, p_resource, p_details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'CRM Authentication schema created successfully!';
    RAISE NOTICE 'Run this query to see the created tables:';
    RAISE NOTICE 'SELECT * FROM user_profiles_with_email;';
END $$;
