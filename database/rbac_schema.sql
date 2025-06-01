-- Create tables for RBAC system that integrate with existing profiles
CREATE TABLE IF NOT EXISTS permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  business_unit VARCHAR(50) CHECK (business_unit IN ('CARSI', 'Website Builder', 'Directory', 'AGI Builder', 'Oz-Invoice', NULL)),
  resource VARCHAR(100),
  action VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);

-- Add updated_at triggers
CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON permissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
BEFORE UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Predefined roles
INSERT INTO roles (name, description) VALUES 
('Super Admin', 'Full system access'),
('Platform Managers', 'Manages platform operations'),
('Sales Manager', 'Manages sales operations'),
('Support Agent', 'Provides customer support'),
('CARSI Instructor', 'Manages CARSI training'),
('Content Creator', 'Creates platform content'),
('Contractor', 'External contractor with limited access')
ON CONFLICT (name) DO NOTHING;

-- Insert comprehensive permissions for all business units
INSERT INTO permissions (name, description, business_unit, resource, action)
VALUES 
  -- System permissions
  ('system.users.view', 'View system users', NULL, 'users', 'view'),
  ('system.users.create', 'Create system users', NULL, 'users', 'create'),
  ('system.users.update', 'Update system users', NULL, 'users', 'update'),
  ('system.users.delete', 'Delete system users', NULL, 'users', 'delete'),
  ('system.roles.view', 'View roles', NULL, 'roles', 'view'),
  ('system.roles.create', 'Create roles', NULL, 'roles', 'create'),
  ('system.roles.update', 'Update roles', NULL, 'roles', 'update'),
  ('system.roles.delete', 'Delete roles', NULL, 'roles', 'delete'),
  ('system.permissions.view', 'View permissions', NULL, 'permissions', 'view'),
  ('system.permissions.assign', 'Assign permissions', NULL, 'permissions', 'assign'),
  
  -- CARSI permissions
  ('carsi.courses.view', 'View CARSI courses', 'CARSI', 'courses', 'view'),
  ('carsi.courses.create', 'Create CARSI courses', 'CARSI', 'courses', 'create'),
  ('carsi.courses.update', 'Update CARSI courses', 'CARSI', 'courses', 'update'),
  ('carsi.courses.delete', 'Delete CARSI courses', 'CARSI', 'courses', 'delete'),
  ('carsi.students.view', 'View CARSI students', 'CARSI', 'students', 'view'),
  ('carsi.students.manage', 'Manage CARSI students', 'CARSI', 'students', 'manage'),
  
  -- Website Builder permissions
  ('website_builder.sites.view', 'View websites', 'Website Builder', 'sites', 'view'),
  ('website_builder.sites.create', 'Create websites', 'Website Builder', 'sites', 'create'),
  ('website_builder.sites.update', 'Update websites', 'Website Builder', 'sites', 'update'),
  ('website_builder.sites.delete', 'Delete websites', 'Website Builder', 'sites', 'delete'),
  ('website_builder.templates.manage', 'Manage templates', 'Website Builder', 'templates', 'manage'),
  
  -- Directory permissions
  ('directory.listings.view', 'View directory listings', 'Directory', 'listings', 'view'),
  ('directory.listings.create', 'Create directory listings', 'Directory', 'listings', 'create'),
  ('directory.listings.update', 'Update directory listings', 'Directory', 'listings', 'update'),
  ('directory.listings.delete', 'Delete directory listings', 'Directory', 'listings', 'delete'),
  ('directory.categories.manage', 'Manage directory categories', 'Directory', 'categories', 'manage'),
  
  -- AGI Builder permissions
  ('agi_builder.agents.view', 'View AGI agents', 'AGI Builder', 'agents', 'view'),
  ('agi_builder.agents.create', 'Create AGI agents', 'AGI Builder', 'agents', 'create'),
  ('agi_builder.agents.update', 'Update AGI agents', 'AGI Builder', 'agents', 'update'),
  ('agi_builder.agents.delete', 'Delete AGI agents', 'AGI Builder', 'agents', 'delete'),
  ('agi_builder.models.manage', 'Manage AI models', 'AGI Builder', 'models', 'manage'),
  
  -- Oz-Invoice permissions
  ('oz_invoice.invoices.view', 'View invoices', 'Oz-Invoice', 'invoices', 'view'),
  ('oz_invoice.invoices.create', 'Create invoices', 'Oz-Invoice', 'invoices', 'create'),
  ('oz_invoice.invoices.update', 'Update invoices', 'Oz-Invoice', 'invoices', 'update'),
  ('oz_invoice.invoices.delete', 'Delete invoices', 'Oz-Invoice', 'invoices', 'delete'),
  ('oz_invoice.clients.manage', 'Manage invoice clients', 'Oz-Invoice', 'clients', 'manage'),
  ('oz_invoice.reports.view', 'View financial reports', 'Oz-Invoice', 'reports', 'view')
ON CONFLICT (name) DO NOTHING;

-- Create function to assign default permissions to roles
CREATE OR REPLACE FUNCTION assign_role_permissions() RETURNS void AS $$
DECLARE
  super_admin_id UUID;
  platform_manager_id UUID;
  sales_manager_id UUID;
  support_agent_id UUID;
  carsi_instructor_id UUID;
  content_creator_id UUID;
  contractor_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM roles WHERE name = 'Super Admin';
  SELECT id INTO platform_manager_id FROM roles WHERE name = 'Platform Managers';
  SELECT id INTO sales_manager_id FROM roles WHERE name = 'Sales Manager';
  SELECT id INTO support_agent_id FROM roles WHERE name = 'Support Agent';
  SELECT id INTO carsi_instructor_id FROM roles WHERE name = 'CARSI Instructor';
  SELECT id INTO content_creator_id FROM roles WHERE name = 'Content Creator';
  SELECT id INTO contractor_id FROM roles WHERE name = 'Contractor';
  
  -- Super Admin gets all permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT super_admin_id, id FROM permissions
  ON CONFLICT DO NOTHING;
  
  -- Platform Managers get most permissions except user management
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT platform_manager_id, id FROM permissions
  WHERE name NOT LIKE 'system.users.%' 
    AND name NOT LIKE 'system.roles.%'
  ON CONFLICT DO NOTHING;
  
  -- Sales Manager permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT sales_manager_id, id FROM permissions
  WHERE name IN (
    'oz_invoice.invoices.view',
    'oz_invoice.invoices.create',
    'oz_invoice.invoices.update',
    'oz_invoice.clients.manage',
    'oz_invoice.reports.view',
    'directory.listings.view',
    'directory.listings.create',
    'directory.listings.update'
  )
  ON CONFLICT DO NOTHING;
  
  -- Support Agent permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT support_agent_id, id FROM permissions
  WHERE name LIKE '%.view' 
    OR name IN ('carsi.students.manage', 'directory.listings.update')
  ON CONFLICT DO NOTHING;
  
  -- CARSI Instructor permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT carsi_instructor_id, id FROM permissions
  WHERE name LIKE 'carsi.%'
  ON CONFLICT DO NOTHING;
  
  -- Content Creator permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT content_creator_id, id FROM permissions
  WHERE name IN (
    'website_builder.sites.view',
    'website_builder.sites.create',
    'website_builder.sites.update',
    'website_builder.templates.manage',
    'directory.listings.view',
    'directory.listings.create',
    'directory.listings.update'
  )
  ON CONFLICT DO NOTHING;
  
  -- Contractor permissions (minimal)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT contractor_id, id FROM permissions
  WHERE name IN (
    'website_builder.sites.view',
    'directory.listings.view',
    'oz_invoice.invoices.view'
  )
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute permission assignment
SELECT assign_role_permissions();

-- Create RLS policies
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for permissions table (read-only for most users)
CREATE POLICY "Permissions are viewable by authenticated users" ON permissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for roles table
CREATE POLICY "Roles are viewable by authenticated users" ON roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policies for user_roles table
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create helper functions
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id AND p.name = permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_permissions(user_id UUID)
RETURNS TABLE(permission_name TEXT, description TEXT, business_unit TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.name, p.description, p.business_unit
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = user_id
  ORDER BY p.business_unit, p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
