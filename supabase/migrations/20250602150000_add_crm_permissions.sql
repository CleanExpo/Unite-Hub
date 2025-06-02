-- Add CRM and SQL editor permissions
INSERT INTO permissions (name, description, category, subcategory, action)
VALUES
  -- CRM permissions
  ('crm.clients.view', 'View CRM clients', 'CRM', 'clients', 'view'),
  ('crm.clients.create', 'Create CRM clients', 'CRM', 'clients', 'create'),
  ('crm.clients.update', 'Update CRM clients', 'CRM', 'clients', 'update'),
  ('crm.clients.delete', 'Delete CRM clients', 'CRM', 'clients', 'delete'),
  ('crm.projects.view', 'View CRM projects', 'CRM', 'projects', 'view'),
  ('crm.projects.create', 'Create CRM projects', 'CRM', 'projects', 'create'),
  ('crm.projects.update', 'Update CRM projects', 'CRM', 'projects', 'update'),
  ('crm.projects.delete', 'Delete CRM projects', 'CRM', 'projects', 'delete'),
  ('crm.tasks.view', 'View CRM tasks', 'CRM', 'tasks', 'view'),
  ('crm.tasks.create', 'Create CRM tasks', 'CRM', 'tasks', 'create'),
  ('crm.tasks.update', 'Update CRM tasks', 'CRM', 'tasks', 'update'),
  ('crm.tasks.delete', 'Delete CRM tasks', 'CRM', 'tasks', 'delete'),
  ('crm.reports.view', 'View CRM reports', 'CRM', 'reports', 'view'),
  ('crm.exports.create', 'Export CRM data', 'CRM', 'exports', 'create'),
  
  -- SQL Editor permissions
  ('sql.editor.execute', 'Execute SQL queries', 'SQL', 'editor', 'execute'),
  ('sql.editor.view', 'View SQL editor', 'SQL', 'editor', 'view');
