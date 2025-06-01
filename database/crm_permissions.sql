-- Add CRM permissions to the permission system
INSERT INTO permissions (name, description, business_unit, resource, action)
VALUES 
  -- CRM Client permissions
  ('crm.clients.view', 'View CRM clients', 'CRM', 'clients', 'view'),
  ('crm.clients.create', 'Create CRM clients', 'CRM', 'clients', 'create'),
  ('crm.clients.update', 'Update CRM clients', 'CRM', 'clients', 'update'),
  ('crm.clients.delete', 'Delete CRM clients', 'CRM', 'clients', 'delete'),
  
  -- CRM Project permissions
  ('crm.projects.view', 'View CRM projects', 'CRM', 'projects', 'view'),
  ('crm.projects.create', 'Create CRM projects', 'CRM', 'projects', 'create'),
  ('crm.projects.update', 'Update CRM projects', 'CRM', 'projects', 'update'),
  ('crm.projects.delete', 'Delete CRM projects', 'CRM', 'projects', 'delete'),
  
  -- CRM Task permissions
  ('crm.tasks.view', 'View CRM tasks', 'CRM', 'tasks', 'view'),
  ('crm.tasks.create', 'Create CRM tasks', 'CRM', 'tasks', 'create'),
  ('crm.tasks.update', 'Update CRM tasks', 'CRM', 'tasks', 'update'),
  ('crm.tasks.delete', 'Delete CRM tasks', 'CRM', 'tasks', 'delete'),
  
  -- CRM Reports and Export permissions
  ('crm.reports.view', 'View CRM reports', 'CRM', 'reports', 'view'),
  ('crm.exports.create', 'Export CRM data', 'CRM', 'exports', 'create')
ON CONFLICT (name) DO NOTHING;

-- Create CRM-specific roles
INSERT INTO roles (name, description) VALUES 
  ('CRM Manager', 'Full access to CRM module'),
  ('CRM User', 'Create, view, and update CRM data (no delete)'),
  ('CRM Viewer', 'Read-only access to CRM data')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to CRM roles
CREATE OR REPLACE FUNCTION assign_crm_role_permissions() RETURNS void AS $$
DECLARE
  crm_manager_id UUID;
  crm_user_id UUID;
  crm_viewer_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO crm_manager_id FROM roles WHERE name = 'CRM Manager';
  SELECT id INTO crm_user_id FROM roles WHERE name = 'CRM User';
  SELECT id INTO crm_viewer_id FROM roles WHERE name = 'CRM Viewer';
  
  -- CRM Manager gets all CRM permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT crm_manager_id, id FROM permissions
  WHERE name LIKE 'crm.%'
  ON CONFLICT DO NOTHING;
  
  -- CRM User gets view, create, and update permissions (no delete)
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT crm_user_id, id FROM permissions
  WHERE name LIKE 'crm.%' 
    AND name NOT LIKE '%.delete'
  ON CONFLICT DO NOTHING;
  
  -- CRM Viewer gets only view permissions
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT crm_viewer_id, id FROM permissions
  WHERE name LIKE 'crm.%.view'
  ON CONFLICT DO NOTHING;
  
  -- Also assign CRM permissions to Super Admin and Platform Managers
  INSERT INTO role_permissions (role_id, permission_id)
  SELECT r.id, p.id 
  FROM roles r, permissions p
  WHERE r.name IN ('Super Admin', 'Platform Managers')
    AND p.name LIKE 'crm.%'
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Execute permission assignment
SELECT assign_crm_role_permissions();
