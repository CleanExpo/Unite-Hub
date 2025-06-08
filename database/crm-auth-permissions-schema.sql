-- ================================================
-- CRM Authentication & Permissions Schema
-- Safe database migration script with validation
-- ================================================

-- First, ensure we're using the correct schema
SET search_path TO public;

-- Check and add columns to users table safely
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'User';
        COMMENT ON COLUMN users.role IS 'User role: Master, Admin, Manager, or User';
    END IF;
    
    -- Add created_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'created_by') THEN
        ALTER TABLE users ADD COLUMN created_by UUID REFERENCES users(id);
        COMMENT ON COLUMN users.created_by IS 'ID of user who created this account';
    END IF;
    
    -- Add is_active column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
    END IF;

    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'last_login') THEN
        ALTER TABLE users ADD COLUMN last_login TIMESTAMPTZ;
        COMMENT ON COLUMN users.last_login IS 'Last login timestamp';
    END IF;

    -- Add login_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'users' 
                   AND column_name = 'login_count') THEN
        ALTER TABLE users ADD COLUMN login_count INTEGER DEFAULT 0;
        COMMENT ON COLUMN users.login_count IS 'Number of successful logins';
    END IF;
END $$;

-- Create user_permissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    CONSTRAINT unique_user_permission UNIQUE(user_id, permission_level, resource_type, resource_id),
    CONSTRAINT check_permission_level CHECK (
        permission_level IN ('read', 'write', 'delete', 'admin', 'super_admin')
    )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_resource ON user_permissions(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_active ON user_permissions(is_active) WHERE is_active = TRUE;

-- Create permission_audit_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS permission_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(50) NOT NULL,
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('grant', 'revoke', 'modify', 'login', 'logout', 'failed_login')),
    target_user_id UUID REFERENCES users(id),
    target_user_email VARCHAR(255),
    performed_by_id UUID REFERENCES users(id),
    performed_by_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    details JSONB,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);

-- Create indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON permission_audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_target_user ON permission_audit_log(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON permission_audit_log(performed_by_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action_type ON permission_audit_log(action_type);

-- Create role_permissions table for defining what each role can do
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    module VARCHAR(100) NOT NULL,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    can_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_role_module UNIQUE(role, module)
);

-- Insert default role permissions
INSERT INTO role_permissions (role, module, can_read, can_write, can_delete, can_admin)
VALUES 
    -- Master role has all permissions
    ('Master', 'users', TRUE, TRUE, TRUE, TRUE),
    ('Master', 'crm', TRUE, TRUE, TRUE, TRUE),
    ('Master', 'analytics', TRUE, TRUE, TRUE, TRUE),
    ('Master', 'settings', TRUE, TRUE, TRUE, TRUE),
    ('Master', 'billing', TRUE, TRUE, TRUE, TRUE),
    
    -- Admin role
    ('Admin', 'users', TRUE, TRUE, TRUE, FALSE),
    ('Admin', 'crm', TRUE, TRUE, TRUE, TRUE),
    ('Admin', 'analytics', TRUE, TRUE, FALSE, FALSE),
    ('Admin', 'settings', TRUE, TRUE, FALSE, FALSE),
    ('Admin', 'billing', TRUE, FALSE, FALSE, FALSE),
    
    -- Manager role
    ('Manager', 'users', TRUE, FALSE, FALSE, FALSE),
    ('Manager', 'crm', TRUE, TRUE, FALSE, FALSE),
    ('Manager', 'analytics', TRUE, FALSE, FALSE, FALSE),
    ('Manager', 'settings', TRUE, FALSE, FALSE, FALSE),
    ('Manager', 'billing', FALSE, FALSE, FALSE, FALSE),
    
    -- User role
    ('User', 'users', FALSE, FALSE, FALSE, FALSE),
    ('User', 'crm', TRUE, TRUE, FALSE, FALSE),
    ('User', 'analytics', TRUE, FALSE, FALSE, FALSE),
    ('User', 'settings', FALSE, FALSE, FALSE, FALSE),
    ('User', 'billing', FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (role, module) DO UPDATE SET
    can_read = EXCLUDED.can_read,
    can_write = EXCLUDED.can_write,
    can_delete = EXCLUDED.can_delete,
    can_admin = EXCLUDED.can_admin,
    updated_at = CURRENT_TIMESTAMP;

-- Create function to log permission changes
CREATE OR REPLACE FUNCTION log_permission_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO permission_audit_log (
            action,
            action_type,
            target_user_id,
            performed_by_id,
            details
        ) VALUES (
            'Permission granted',
            'grant',
            NEW.user_id,
            NEW.granted_by,
            jsonb_build_object(
                'permission_level', NEW.permission_level,
                'resource_type', NEW.resource_type,
                'resource_id', NEW.resource_id
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO permission_audit_log (
            action,
            action_type,
            target_user_id,
            performed_by_id,
            details
        ) VALUES (
            'Permission modified',
            'modify',
            NEW.user_id,
            NEW.granted_by,
            jsonb_build_object(
                'old', row_to_json(OLD),
                'new', row_to_json(NEW)
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO permission_audit_log (
            action,
            action_type,
            target_user_id,
            performed_by_id,
            details
        ) VALUES (
            'Permission revoked',
            'revoke',
            OLD.user_id,
            OLD.granted_by,
            jsonb_build_object(
                'permission_level', OLD.permission_level,
                'resource_type', OLD.resource_type,
                'resource_id', OLD.resource_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for permission changes if it doesn't exist
DROP TRIGGER IF EXISTS trigger_log_permission_change ON user_permissions;
CREATE TRIGGER trigger_log_permission_change
    AFTER INSERT OR UPDATE OR DELETE ON user_permissions
    FOR EACH ROW
    EXECUTE FUNCTION log_permission_change();

-- Create function to check user permissions
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id UUID,
    p_resource_type VARCHAR,
    p_resource_id UUID,
    p_permission_level VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN;
    v_user_role VARCHAR(50);
BEGIN
    -- Get user role
    SELECT role INTO v_user_role
    FROM users
    WHERE id = p_user_id AND is_active = TRUE;
    
    -- Master role always has permission
    IF v_user_role = 'Master' THEN
        RETURN TRUE;
    END IF;
    
    -- Check specific permissions
    SELECT EXISTS(
        SELECT 1
        FROM user_permissions
        WHERE user_id = p_user_id
        AND resource_type = p_resource_type
        AND (resource_id = p_resource_id OR resource_id IS NULL)
        AND permission_level = p_permission_level
        AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    ) INTO v_has_permission;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql;

-- Create view for active user permissions
CREATE OR REPLACE VIEW v_active_user_permissions AS
SELECT 
    u.id AS user_id,
    u.email,
    u.role,
    up.permission_level,
    up.resource_type,
    up.resource_id,
    up.granted_by,
    ug.email AS granted_by_email,
    up.granted_at,
    up.expires_at
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN users ug ON up.granted_by = ug.id
WHERE u.is_active = TRUE
AND (up.is_active = TRUE OR up.is_active IS NULL)
AND (up.expires_at IS NULL OR up.expires_at > CURRENT_TIMESTAMP);

-- Grant necessary permissions
GRANT SELECT ON v_active_user_permissions TO authenticated;
GRANT SELECT, INSERT ON permission_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission TO authenticated;
