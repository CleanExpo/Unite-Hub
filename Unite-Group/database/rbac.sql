-- Role-Based Access Control (RBAC) Database Schema
-- Unite Group Advanced Security System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Roles table - Define system roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0, -- Higher numbers = more privileges
    is_system BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Permissions table - Define granular permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(150) NOT NULL,
    description TEXT,
    resource VARCHAR(50) NOT NULL, -- e.g., 'users', 'projects', 'analytics'
    action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
    scope VARCHAR(50) DEFAULT 'all', -- e.g., 'all', 'own', 'team'
    is_system BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role-Permission mapping
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    granted_by UUID REFERENCES auth.users(id),
    UNIQUE(role_id, permission_id)
);

-- User-Role assignments
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE, -- NULL = no expiry
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id)
);

-- Role hierarchy for inheritance
CREATE TABLE IF NOT EXISTS role_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    child_role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(parent_role_id, child_role_id),
    CHECK(parent_role_id != child_role_id) -- Prevent self-reference
);

-- Audit log for RBAC changes
CREATE TABLE IF NOT EXISTS rbac_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL, -- 'role_assigned', 'permission_granted', etc.
    entity_type VARCHAR(50) NOT NULL, -- 'role', 'permission', 'user_role'
    entity_id UUID NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_roles_active ON roles(is_active);

CREATE INDEX idx_permissions_resource_action ON permissions(resource, action);
CREATE INDEX idx_permissions_active ON permissions(is_active);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(is_active);
CREATE INDEX idx_user_roles_expires ON user_roles(expires_at);

CREATE INDEX idx_role_hierarchy_parent ON role_hierarchy(parent_role_id);
CREATE INDEX idx_role_hierarchy_child ON role_hierarchy(child_role_id);

CREATE INDEX idx_rbac_audit_user ON rbac_audit_log(user_id);
CREATE INDEX idx_rbac_audit_action ON rbac_audit_log(action);
CREATE INDEX idx_rbac_audit_created ON rbac_audit_log(created_at);

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default system roles
INSERT INTO roles (name, display_name, description, level, is_system) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', 1000, TRUE),
('admin', 'Administrator', 'Administrative access to most system functions', 800, TRUE),
('manager', 'Manager', 'Management access to projects and team operations', 600, TRUE),
('consultant', 'Consultant', 'Access to client projects and consultation tools', 400, TRUE),
('client', 'Client', 'Client portal access with project visibility', 200, TRUE),
('guest', 'Guest', 'Limited read-only access to public content', 100, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default system permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
-- User management
('users.create', 'Create Users', 'Create new user accounts', 'users', 'create'),
('users.read', 'View Users', 'View user information and profiles', 'users', 'read'),
('users.update', 'Update Users', 'Modify user accounts and profiles', 'users', 'update'),
('users.delete', 'Delete Users', 'Remove user accounts from system', 'users', 'delete'),
('users.impersonate', 'Impersonate Users', 'Login as another user for support', 'users', 'impersonate'),

-- Role management
('roles.create', 'Create Roles', 'Create new roles in the system', 'roles', 'create'),
('roles.read', 'View Roles', 'View roles and their permissions', 'roles', 'read'),
('roles.update', 'Update Roles', 'Modify role permissions and settings', 'roles', 'update'),
('roles.delete', 'Delete Roles', 'Remove roles from the system', 'roles', 'delete'),
('roles.assign', 'Assign Roles', 'Assign roles to users', 'roles', 'assign'),

-- Project management
('projects.create', 'Create Projects', 'Create new client projects', 'projects', 'create'),
('projects.read', 'View Projects', 'View project details and status', 'projects', 'read'),
('projects.update', 'Update Projects', 'Modify project information and status', 'projects', 'update'),
('projects.delete', 'Delete Projects', 'Remove projects from system', 'projects', 'delete'),

-- Consultation management
('consultations.create', 'Schedule Consultations', 'Create new consultation bookings', 'consultations', 'create'),
('consultations.read', 'View Consultations', 'View consultation schedules and details', 'consultations', 'read'),
('consultations.update', 'Update Consultations', 'Modify consultation details and status', 'consultations', 'update'),
('consultations.delete', 'Cancel Consultations', 'Cancel or remove consultations', 'consultations', 'delete'),

-- Analytics and reporting
('analytics.read', 'View Analytics', 'Access analytics dashboards and reports', 'analytics', 'read'),
('analytics.export', 'Export Analytics', 'Export analytics data and reports', 'analytics', 'export'),

-- Content management
('content.create', 'Create Content', 'Create blog posts and resources', 'content', 'create'),
('content.read', 'View Content', 'View content and resources', 'content', 'read'),
('content.update', 'Update Content', 'Modify existing content', 'content', 'update'),
('content.delete', 'Delete Content', 'Remove content from system', 'content', 'delete'),
('content.publish', 'Publish Content', 'Publish content to public', 'content', 'publish'),

-- Payment management
('payments.read', 'View Payments', 'View payment information and history', 'payments', 'read'),
('payments.process', 'Process Payments', 'Handle payment processing', 'payments', 'process'),
('payments.refund', 'Process Refunds', 'Issue payment refunds', 'payments', 'refund'),

-- System administration
('system.backup', 'System Backup', 'Perform system backups', 'system', 'backup'),
('system.maintenance', 'System Maintenance', 'Perform system maintenance tasks', 'system', 'maintenance'),
('system.logs', 'View System Logs', 'Access system logs and audit trails', 'system', 'logs'),
('system.settings', 'System Settings', 'Modify system-wide settings', 'system', 'settings')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to default roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Admin role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.name IN (
    'users.read', 'users.update',
    'roles.read', 'roles.assign',
    'projects.create', 'projects.read', 'projects.update',
    'consultations.create', 'consultations.read', 'consultations.update',
    'analytics.read', 'analytics.export',
    'content.create', 'content.read', 'content.update', 'content.publish',
    'payments.read', 'payments.process',
    'system.logs'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Manager role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'manager'
AND p.name IN (
    'users.read',
    'projects.create', 'projects.read', 'projects.update',
    'consultations.create', 'consultations.read', 'consultations.update',
    'analytics.read',
    'content.read', 'content.update'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Consultant role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'consultant'
AND p.name IN (
    'projects.read', 'projects.update',
    'consultations.read', 'consultations.update',
    'content.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Client role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'client'
AND p.name IN (
    'projects.read',
    'consultations.create', 'consultations.read',
    'content.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Guest role permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'guest'
AND p.name IN (
    'content.read'
)
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- Create helper functions for RBAC
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS TABLE(permission_name TEXT, resource TEXT, action TEXT, scope TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.name, p.resource, p.action, p.scope
    FROM permissions p
    JOIN role_permissions rp ON p.id = rp.permission_id
    JOIN roles r ON rp.role_id = r.id
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND r.is_active = TRUE
    AND p.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM get_user_permissions(user_uuid) gup
        WHERE gup.permission_name = user_has_permission.permission_name
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS TABLE(role_name TEXT, display_name TEXT, level INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT r.name, r.display_name, r.level
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = TRUE
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    AND r.is_active = TRUE
    ORDER BY r.level DESC;
END;
$$ LANGUAGE plpgsql;

-- Create policies for row-level security (if using RLS)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rbac_audit_log ENABLE ROW LEVEL SECURITY;

-- Policies (these can be customized based on your specific security requirements)
CREATE POLICY "Allow authenticated users to read roles" ON roles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read permissions" ON permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read role permissions" ON role_permissions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view their own role assignments" ON user_roles
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their own audit logs" ON rbac_audit_log
    FOR SELECT TO authenticated 
    USING (user_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON permissions TO authenticated;
GRANT SELECT ON role_permissions TO authenticated;
GRANT SELECT ON user_roles TO authenticated;
GRANT SELECT ON rbac_audit_log TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_user_permissions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;
