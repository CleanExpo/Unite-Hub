-- Migration 424: Multi-Tenant Permission Matrix (RBAC v2) - Phase E09
-- Granular role-based access control for Synthex modules

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS user_roles_v2 CASCADE;
DROP TABLE IF EXISTS role_permissions_v2 CASCADE;
DROP TABLE IF EXISTS roles_v2 CASCADE;
DROP TABLE IF EXISTS permissions_v2 CASCADE;

-- Roles v2 table (tenant-scoped roles)
CREATE TABLE roles_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE, -- system-defined (owner, admin, member)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles_v2(tenant_id);

-- RLS for roles_v2
ALTER TABLE roles_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY roles_tenant_isolation ON roles_v2
  FOR ALL
  USING (tenant_id = auth.uid());

-- Permissions v2 table (module-level permissions)
CREATE TABLE permissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module TEXT NOT NULL, -- 'content', 'campaigns', 'analytics', 'automation'
  action TEXT NOT NULL, -- 'read', 'write', 'delete', 'publish'
  resource_type TEXT, -- optional resource filter (e.g., 'own', 'team', 'all')
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(module, action, resource_type)
);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON permissions_v2(module);

-- Seed default permissions
INSERT INTO permissions_v2 (module, action, resource_type, display_name, description)
VALUES
  -- Content permissions
  ('content', 'read', 'own', 'View Own Content', 'View your own content drafts'),
  ('content', 'read', 'all', 'View All Content', 'View all team content'),
  ('content', 'write', 'own', 'Edit Own Content', 'Create/edit your own content'),
  ('content', 'write', 'all', 'Edit All Content', 'Create/edit all team content'),
  ('content', 'publish', NULL, 'Publish Content', 'Publish content live'),
  ('content', 'delete', 'own', 'Delete Own Content', 'Delete your own content'),
  ('content', 'delete', 'all', 'Delete All Content', 'Delete any team content'),

  -- Campaign permissions
  ('campaigns', 'read', 'own', 'View Own Campaigns', 'View your own campaigns'),
  ('campaigns', 'read', 'all', 'View All Campaigns', 'View all team campaigns'),
  ('campaigns', 'write', 'own', 'Edit Own Campaigns', 'Create/edit your own campaigns'),
  ('campaigns', 'write', 'all', 'Edit All Campaigns', 'Create/edit all team campaigns'),
  ('campaigns', 'launch', NULL, 'Launch Campaigns', 'Launch campaigns live'),
  ('campaigns', 'delete', 'all', 'Delete Campaigns', 'Delete any campaign'),

  -- Analytics permissions
  ('analytics', 'read', NULL, 'View Analytics', 'View analytics dashboards'),
  ('analytics', 'export', NULL, 'Export Reports', 'Export analytics reports'),

  -- Automation permissions
  ('automation', 'read', NULL, 'View Automations', 'View automation workflows'),
  ('automation', 'write', NULL, 'Edit Automations', 'Create/edit automation workflows'),
  ('automation', 'execute', NULL, 'Run Automations', 'Manually trigger automations'),

  -- Audience permissions
  ('audience', 'read', NULL, 'View Audience', 'View audience segments'),
  ('audience', 'write', NULL, 'Edit Segments', 'Create/edit audience segments'),
  ('audience', 'export', NULL, 'Export Contacts', 'Export contact lists'),

  -- Settings permissions
  ('settings', 'read', NULL, 'View Settings', 'View workspace settings'),
  ('settings', 'write', NULL, 'Edit Settings', 'Modify workspace settings'),
  ('settings', 'billing', NULL, 'Manage Billing', 'Access billing and subscriptions'),
  ('settings', 'integrations', NULL, 'Manage Integrations', 'Connect third-party services'),

  -- Team permissions
  ('team', 'read', NULL, 'View Team', 'View team members'),
  ('team', 'invite', NULL, 'Invite Members', 'Send team invitations'),
  ('team', 'remove', NULL, 'Remove Members', 'Remove team members'),
  ('team', 'roles', NULL, 'Manage Roles', 'Assign/edit user roles')
ON CONFLICT (module, action, resource_type) DO NOTHING;

-- Role-Permission mappings
CREATE TABLE role_permissions_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles_v2(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions_v2(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions_v2(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_perm ON role_permissions_v2(permission_id);

-- User-Role assignments
CREATE TABLE user_roles_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles_v2(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_tenant ON user_roles_v2(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles_v2(role_id);

-- RLS for user_roles_v2
ALTER TABLE user_roles_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_roles_tenant_isolation ON user_roles_v2
  FOR ALL
  USING (tenant_id = auth.uid() OR user_id = auth.uid());

-- Function: Initialize default roles for a tenant
CREATE OR REPLACE FUNCTION init_default_roles(p_tenant_id UUID)
RETURNS VOID AS $$
DECLARE
  v_owner_role_id UUID;
  v_admin_role_id UUID;
  v_member_role_id UUID;
  v_perm_id UUID;
BEGIN
  -- Create Owner role (all permissions)
  INSERT INTO roles_v2 (tenant_id, name, display_name, description, is_system)
  VALUES (
    p_tenant_id,
    'owner',
    'Owner',
    'Full access to all features and settings',
    TRUE
  )
  RETURNING id INTO v_owner_role_id;

  -- Create Admin role (most permissions, except billing)
  INSERT INTO roles_v2 (tenant_id, name, display_name, description, is_system)
  VALUES (
    p_tenant_id,
    'admin',
    'Admin',
    'Manage content, campaigns, and team members',
    TRUE
  )
  RETURNING id INTO v_admin_role_id;

  -- Create Member role (limited permissions)
  INSERT INTO roles_v2 (tenant_id, name, display_name, description, is_system)
  VALUES (
    p_tenant_id,
    'member',
    'Member',
    'Create and manage own content and campaigns',
    TRUE
  )
  RETURNING id INTO v_member_role_id;

  -- Assign ALL permissions to Owner
  FOR v_perm_id IN SELECT id FROM permissions_v2 LOOP
    INSERT INTO role_permissions_v2 (role_id, permission_id)
    VALUES (v_owner_role_id, v_perm_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Assign Admin permissions (all except billing)
  INSERT INTO role_permissions_v2 (role_id, permission_id)
  SELECT v_admin_role_id, id
  FROM permissions_v2
  WHERE module != 'settings' OR action != 'billing'
  ON CONFLICT DO NOTHING;

  -- Assign Member permissions (own resources only)
  INSERT INTO role_permissions_v2 (role_id, permission_id)
  SELECT v_member_role_id, id
  FROM permissions_v2
  WHERE
    (module = 'content' AND action IN ('read', 'write', 'delete') AND resource_type = 'own')
    OR (module = 'campaigns' AND action IN ('read', 'write') AND resource_type = 'own')
    OR (module = 'analytics' AND action = 'read')
    OR (module = 'audience' AND action = 'read')
    OR (module = 'automation' AND action = 'read')
    OR (module = 'team' AND action = 'read')
  ON CONFLICT DO NOTHING;

  -- Assign Owner role to tenant
  INSERT INTO user_roles_v2 (user_id, tenant_id, role_id)
  VALUES (p_tenant_id, p_tenant_id, v_owner_role_id)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_tenant_id UUID,
  p_module TEXT,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_perm BOOLEAN;
BEGIN
  -- Check if user has any role with this permission
  SELECT EXISTS(
    SELECT 1
    FROM user_roles_v2 ur
    JOIN role_permissions_v2 rp ON rp.role_id = ur.role_id
    JOIN permissions_v2 p ON p.id = rp.permission_id
    WHERE ur.user_id = p_user_id
      AND ur.tenant_id = p_tenant_id
      AND p.module = p_module
      AND p.action = p_action
      AND (p_resource_type IS NULL OR p.resource_type = p_resource_type)
  ) INTO v_has_perm;

  RETURN v_has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: List user permissions
CREATE OR REPLACE FUNCTION list_user_permissions(
  p_user_id UUID,
  p_tenant_id UUID
) RETURNS TABLE (
  module TEXT,
  action TEXT,
  resource_type TEXT,
  display_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    p.module,
    p.action,
    p.resource_type,
    p.display_name
  FROM user_roles_v2 ur
  JOIN role_permissions_v2 rp ON rp.role_id = ur.role_id
  JOIN permissions_v2 p ON p.id = rp.permission_id
  WHERE ur.user_id = p_user_id
    AND ur.tenant_id = p_tenant_id
  ORDER BY p.module, p.action;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION init_default_roles TO authenticated;
GRANT EXECUTE ON FUNCTION has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION list_user_permissions TO authenticated;

-- Updated_at trigger for roles_v2
CREATE OR REPLACE FUNCTION update_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_timestamp();

-- Updated_at trigger for user_roles_v2
CREATE OR REPLACE FUNCTION update_user_roles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_roles_updated_at
  BEFORE UPDATE ON user_roles_v2
  FOR EACH ROW
  EXECUTE FUNCTION update_user_roles_timestamp();
