-- Migration 428: Security & RBAC Hardening (Phase E13)
-- Fine-grained role-based access control for Unite-Hub + Synthex

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS rbac_role_assignments CASCADE;
DROP TABLE IF EXISTS rbac_role_permissions CASCADE;
DROP TABLE IF EXISTS rbac_permissions CASCADE;
DROP TABLE IF EXISTS rbac_roles CASCADE;

-- RBAC Roles table (tenant-scoped or global)
CREATE TABLE rbac_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global role
  key TEXT NOT NULL, -- e.g., 'admin', 'manager', 'viewer', 'synthex.analyst'
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE, -- system roles cannot be deleted
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_rbac_roles_tenant ON rbac_roles(tenant_id);
CREATE INDEX idx_rbac_roles_key ON rbac_roles(key);

-- RBAC Permissions table (permission definitions)
CREATE TABLE rbac_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL = global permission
  key TEXT NOT NULL, -- e.g., 'synthex.analytics.view', 'campaigns.create'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- e.g., 'analytics', 'content', 'settings'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, key)
);

CREATE INDEX idx_rbac_permissions_tenant ON rbac_permissions(tenant_id);
CREATE INDEX idx_rbac_permissions_key ON rbac_permissions(key);
CREATE INDEX idx_rbac_permissions_category ON rbac_permissions(category);

-- RBAC Role-Permission mapping (many-to-many)
CREATE TABLE rbac_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES rbac_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_rbac_role_permissions_role ON rbac_role_permissions(role_id);
CREATE INDEX idx_rbac_role_permissions_permission ON rbac_role_permissions(permission_id);

-- RBAC Role Assignments (user-role mapping)
CREATE TABLE rbac_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ, -- NULL = permanent
  UNIQUE(tenant_id, user_id, role_id)
);

CREATE INDEX idx_rbac_role_assignments_tenant ON rbac_role_assignments(tenant_id);
CREATE INDEX idx_rbac_role_assignments_user ON rbac_role_assignments(user_id);
CREATE INDEX idx_rbac_role_assignments_role ON rbac_role_assignments(role_id);
CREATE INDEX idx_rbac_role_assignments_tenant_user ON rbac_role_assignments(tenant_id, user_id);

-- RLS for rbac_roles
ALTER TABLE rbac_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY rbac_roles_read_own ON rbac_roles
  FOR SELECT
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY rbac_roles_admin_write ON rbac_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- RLS for rbac_permissions
ALTER TABLE rbac_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rbac_permissions_read_own ON rbac_permissions
  FOR SELECT
  USING (tenant_id = auth.uid() OR tenant_id IS NULL);

CREATE POLICY rbac_permissions_admin_write ON rbac_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- RLS for rbac_role_permissions
ALTER TABLE rbac_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY rbac_role_permissions_read_all ON rbac_role_permissions
  FOR SELECT
  USING (TRUE);

CREATE POLICY rbac_role_permissions_admin_write ON rbac_role_permissions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- RLS for rbac_role_assignments
ALTER TABLE rbac_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY rbac_role_assignments_read_own ON rbac_role_assignments
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY rbac_role_assignments_admin_write ON rbac_role_assignments
  FOR ALL
  USING (
    tenant_id = auth.uid() AND EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    )
  );

-- Function: Get user permissions for tenant
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_tenant_id UUID,
  p_user_id UUID
) RETURNS TABLE(permission_key TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.key
  FROM rbac_permissions p
  JOIN rbac_role_permissions rp ON rp.permission_id = p.id
  JOIN rbac_roles r ON r.id = rp.role_id
  JOIN rbac_role_assignments ra ON ra.role_id = r.id
  WHERE ra.tenant_id = p_tenant_id
    AND ra.user_id = p_user_id
    AND (ra.expires_at IS NULL OR ra.expires_at > now())
    AND (r.tenant_id = p_tenant_id OR r.tenant_id IS NULL)
    AND (p.tenant_id = p_tenant_id OR p.tenant_id IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(
  p_tenant_id UUID,
  p_user_id UUID,
  p_permission_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM get_user_permissions(p_tenant_id, p_user_id)
    WHERE permission_key = p_permission_key
  ) INTO v_has_permission;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
  p_tenant_id UUID,
  p_user_id UUID,
  p_role_key TEXT,
  p_assigned_by UUID DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_role_id UUID;
  v_assignment_id UUID;
BEGIN
  -- Get role ID
  SELECT id INTO v_role_id
  FROM rbac_roles
  WHERE (tenant_id = p_tenant_id OR tenant_id IS NULL)
    AND key = p_role_key
  ORDER BY tenant_id NULLS LAST
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Role not found: %', p_role_key;
  END IF;

  -- Create or update assignment
  INSERT INTO rbac_role_assignments (
    tenant_id,
    user_id,
    role_id,
    assigned_by,
    expires_at
  ) VALUES (
    p_tenant_id,
    p_user_id,
    v_role_id,
    p_assigned_by,
    p_expires_at
  )
  ON CONFLICT (tenant_id, user_id, role_id)
  DO UPDATE SET
    expires_at = EXCLUDED.expires_at,
    assigned_by = EXCLUDED.assigned_by
  RETURNING id INTO v_assignment_id;

  RETURN v_assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_permissions TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_permission TO authenticated;
GRANT EXECUTE ON FUNCTION assign_user_role TO authenticated;

-- Seed global system roles
INSERT INTO rbac_roles (tenant_id, key, name, description, is_system)
VALUES
  (NULL, 'global.admin', 'Global Administrator', 'Full system access across all tenants', TRUE),
  (NULL, 'tenant.owner', 'Tenant Owner', 'Full access within tenant workspace', TRUE),
  (NULL, 'tenant.manager', 'Tenant Manager', 'Manage content, campaigns, and team members', TRUE),
  (NULL, 'tenant.analyst', 'Tenant Analyst', 'View analytics and reports, no editing', TRUE),
  (NULL, 'tenant.viewer', 'Tenant Viewer', 'Read-only access to workspace', TRUE)
ON CONFLICT (tenant_id, key) DO NOTHING;

-- Seed global permissions
INSERT INTO rbac_permissions (tenant_id, key, name, description, category)
VALUES
  -- Analytics
  (NULL, 'analytics.view', 'View Analytics', 'Access analytics dashboards and reports', 'analytics'),
  (NULL, 'analytics.export', 'Export Analytics', 'Download analytics data', 'analytics'),

  -- Content
  (NULL, 'content.view', 'View Content', 'View content library', 'content'),
  (NULL, 'content.create', 'Create Content', 'Create new content items', 'content'),
  (NULL, 'content.edit', 'Edit Content', 'Edit existing content', 'content'),
  (NULL, 'content.delete', 'Delete Content', 'Delete content items', 'content'),
  (NULL, 'content.publish', 'Publish Content', 'Publish content to channels', 'content'),

  -- Campaigns
  (NULL, 'campaigns.view', 'View Campaigns', 'View campaign list and details', 'campaigns'),
  (NULL, 'campaigns.create', 'Create Campaigns', 'Create new campaigns', 'campaigns'),
  (NULL, 'campaigns.edit', 'Edit Campaigns', 'Edit campaign settings', 'campaigns'),
  (NULL, 'campaigns.delete', 'Delete Campaigns', 'Delete campaigns', 'campaigns'),

  -- Audience
  (NULL, 'audience.view', 'View Audience', 'View audience segments and contacts', 'audience'),
  (NULL, 'audience.edit', 'Edit Audience', 'Manage contacts and segments', 'audience'),

  -- Automation
  (NULL, 'automation.view', 'View Automation', 'View automation workflows', 'automation'),
  (NULL, 'automation.create', 'Create Automation', 'Create workflows', 'automation'),
  (NULL, 'automation.edit', 'Edit Automation', 'Edit workflows', 'automation'),

  -- Settings
  (NULL, 'settings.view', 'View Settings', 'View workspace settings', 'settings'),
  (NULL, 'settings.edit', 'Edit Settings', 'Modify workspace settings', 'settings'),
  (NULL, 'settings.billing', 'Manage Billing', 'Access billing and subscription settings', 'settings'),

  -- Team
  (NULL, 'team.view', 'View Team', 'View team members', 'team'),
  (NULL, 'team.invite', 'Invite Team Members', 'Send team invitations', 'team'),
  (NULL, 'team.manage', 'Manage Team', 'Edit roles and remove members', 'team')
ON CONFLICT (tenant_id, key) DO NOTHING;

-- Map permissions to system roles
DO $$
DECLARE
  v_admin_role UUID;
  v_owner_role UUID;
  v_manager_role UUID;
  v_analyst_role UUID;
  v_viewer_role UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO v_admin_role FROM rbac_roles WHERE key = 'global.admin';
  SELECT id INTO v_owner_role FROM rbac_roles WHERE key = 'tenant.owner';
  SELECT id INTO v_manager_role FROM rbac_roles WHERE key = 'tenant.manager';
  SELECT id INTO v_analyst_role FROM rbac_roles WHERE key = 'tenant.analyst';
  SELECT id INTO v_viewer_role FROM rbac_roles WHERE key = 'tenant.viewer';

  -- Global Admin: all permissions
  INSERT INTO rbac_role_permissions (role_id, permission_id)
  SELECT v_admin_role, id FROM rbac_permissions
  ON CONFLICT DO NOTHING;

  -- Tenant Owner: all tenant permissions
  INSERT INTO rbac_role_permissions (role_id, permission_id)
  SELECT v_owner_role, id FROM rbac_permissions WHERE tenant_id IS NULL
  ON CONFLICT DO NOTHING;

  -- Tenant Manager: no billing, team management, or delete
  INSERT INTO rbac_role_permissions (role_id, permission_id)
  SELECT v_manager_role, id FROM rbac_permissions
  WHERE key NOT IN ('settings.billing', 'team.manage', 'content.delete', 'campaigns.delete')
    AND tenant_id IS NULL
  ON CONFLICT DO NOTHING;

  -- Tenant Analyst: view analytics, content, campaigns
  INSERT INTO rbac_role_permissions (role_id, permission_id)
  SELECT v_analyst_role, id FROM rbac_permissions
  WHERE key IN (
    'analytics.view', 'analytics.export',
    'content.view', 'campaigns.view', 'audience.view',
    'automation.view', 'settings.view'
  )
  ON CONFLICT DO NOTHING;

  -- Tenant Viewer: view-only
  INSERT INTO rbac_role_permissions (role_id, permission_id)
  SELECT v_viewer_role, id FROM rbac_permissions
  WHERE key LIKE '%.view'
  ON CONFLICT DO NOTHING;
END $$;

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_rbac_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rbac_roles_updated_at
  BEFORE UPDATE ON rbac_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_rbac_timestamp();
