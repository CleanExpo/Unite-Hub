-- Projects schema for the Unite Group CRM
-- Part of Version 4.0 CRM Enhancement

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planning', -- planning, in-progress, review, completed, on-hold, cancelled
  start_date TIMESTAMP WITH TIME ZONE,
  target_completion_date TIMESTAMP WITH TIME ZONE,
  actual_completion_date TIMESTAMP WITH TIME ZONE,
  budget NUMERIC(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority TEXT DEFAULT 'medium' -- low, medium, high, urgent
);

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in-progress, completed, delayed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create project_tasks table
CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES project_milestones(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in-progress, completed, cancelled
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  priority TEXT DEFAULT 'medium' -- low, medium, high, urgent
);

-- Create project_documents table
CREATE TABLE IF NOT EXISTS project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL, -- size in bytes
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_public BOOLEAN DEFAULT false, -- whether visible to client
  version INTEGER DEFAULT 1
);

-- Create project_comments table
CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_internal BOOLEAN DEFAULT false -- whether visible only to team members
);

-- Create project_time_entries table for time tracking
CREATE TABLE IF NOT EXISTS project_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- calculated field
  billable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create project_invoices table
CREATE TABLE IF NOT EXISTS project_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  invoice_number TEXT NOT NULL,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, paid, overdue, cancelled
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create project_invoice_items table
CREATE TABLE IF NOT EXISTS project_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES project_invoices(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10, 2) NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL, -- calculated field (quantity * unit_price)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create project_payments table
CREATE TABLE IF NOT EXISTS project_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES project_invoices(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_method TEXT NOT NULL, -- credit_card, bank_transfer, cash, etc.
  transaction_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update updated_at on all tables
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_project_milestones_updated_at
BEFORE UPDATE ON project_milestones
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_project_tasks_updated_at
BEFORE UPDATE ON project_tasks
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_project_comments_updated_at
BEFORE UPDATE ON project_comments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create function to calculate duration for time entries
CREATE OR REPLACE FUNCTION calculate_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate duration
CREATE TRIGGER calculate_time_entry_duration
BEFORE INSERT OR UPDATE ON project_time_entries
FOR EACH ROW
EXECUTE FUNCTION calculate_duration();

-- Create function to calculate invoice item amount
CREATE OR REPLACE FUNCTION calculate_invoice_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount = NEW.quantity * NEW.unit_price;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to calculate invoice item amount
CREATE TRIGGER calculate_invoice_item_amount
BEFORE INSERT OR UPDATE ON project_invoice_items
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_item_amount();

-- Add RLS policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payments ENABLE ROW LEVEL SECURITY;

-- Admin can access all projects
CREATE POLICY "Admins can manage all projects" ON projects
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Users can view projects they are assigned to or created
CREATE POLICY "Users can view assigned projects" ON projects
  FOR SELECT USING (
    auth.uid() = client_id OR
    auth.uid() = assigned_to OR
    auth.uid() = created_by
  );

-- Similar policies for other tables
CREATE POLICY "Users can view their project milestones" ON project_milestones
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE client_id = auth.uid() OR 
            assigned_to = auth.uid() OR 
            created_by = auth.uid()
    )
  );

CREATE POLICY "Users can view their project tasks" ON project_tasks
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM projects 
      WHERE client_id = auth.uid() OR 
            assigned_to = auth.uid() OR 
            created_by = auth.uid()
    ) OR
    assigned_to = auth.uid()
  );

-- Public documents policy
CREATE POLICY "Users can view public project documents" ON project_documents
  FOR SELECT USING (
    is_public = true AND
    project_id IN (
      SELECT id FROM projects 
      WHERE client_id = auth.uid() OR 
            assigned_to = auth.uid() OR 
            created_by = auth.uid()
    )
  );

-- Comments visibility policy
CREATE POLICY "Users can see non-internal comments" ON project_comments
  FOR SELECT USING (
    (is_internal = false OR user_id = auth.uid()) AND
    project_id IN (
      SELECT id FROM projects 
      WHERE client_id = auth.uid() OR 
            assigned_to = auth.uid() OR 
            created_by = auth.uid()
    )
  );

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS projects_client_id_idx ON projects(client_id);
CREATE INDEX IF NOT EXISTS projects_status_idx ON projects(status);
CREATE INDEX IF NOT EXISTS project_tasks_project_id_idx ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS project_tasks_status_idx ON project_tasks(status);
CREATE INDEX IF NOT EXISTS project_tasks_assigned_to_idx ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS project_documents_project_id_idx ON project_documents(project_id);
CREATE INDEX IF NOT EXISTS project_comments_project_id_idx ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS project_comments_task_id_idx ON project_comments(task_id);
CREATE INDEX IF NOT EXISTS project_time_entries_project_id_idx ON project_time_entries(project_id);
CREATE INDEX IF NOT EXISTS project_time_entries_user_id_idx ON project_time_entries(user_id);
CREATE INDEX IF NOT EXISTS project_invoices_project_id_idx ON project_invoices(project_id);
CREATE INDEX IF NOT EXISTS project_invoices_status_idx ON project_invoices(status);
