/**
 * Migration 483: Permission Matrix (Phase E3)
 *
 * Role-based access control (RBAC) system:
 * - Roles (admin, editor, viewer, custom)
 * - Permissions (granular actions)
 * - Role-permission assignments
 * - User-role assignments
 *
 * Related to: E-Series Security & Governance Foundation
 */

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_system boolean DEFAULT false, -- System roles can't be deleted
  created_at timestamptz DEFAULT now(),
  CONSTRAINT roles_tenant_name UNIQUE (tenant_id, name)
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  resource_type text, -- e.g. 'invoice', 'erp', 'settings'
  action text, -- e.g. 'create', 'read', 'update', 'delete'
  created_at timestamptz DEFAULT now()
);

-- Role-permission assignments
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

-- User-role assignments
CREATE TABLE IF NOT EXISTS role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT role_assignments_tenant_user_role UNIQUE (tenant_id, user_id, role_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON roles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_user ON role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_role_assignments_tenant ON role_assignments(tenant_id);

-- RLS Policies
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant roles" ON roles;
CREATE POLICY "Users can view their tenant roles"
  ON roles FOR SELECT
  USING (auth.uid() IS NOT NULL AND tenant_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can view permissions" ON permissions;
CREATE POLICY "Users can view permissions"
  ON permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view role permissions" ON role_permissions;
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can view their tenant role assignments" ON role_assignments;
CREATE POLICY "Users can view their tenant role assignments"
  ON role_assignments FOR SELECT
  USING (auth.uid() IS NOT NULL AND tenant_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));
