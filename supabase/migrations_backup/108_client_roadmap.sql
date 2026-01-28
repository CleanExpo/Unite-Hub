-- Phase 36: MVP Client Truth Layer
-- Client Roadmap tables

-- Client Projects table
CREATE TABLE IF NOT EXISTS client_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'complete')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_projects_client ON client_projects(client_id);
CREATE INDEX IF NOT EXISTS idx_client_projects_status ON client_projects(status);

-- Enable RLS
ALTER TABLE client_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "clients_view_own_projects" ON client_projects
FOR SELECT USING (client_id = auth.uid());

CREATE POLICY "clients_manage_own_projects" ON client_projects
FOR ALL USING (client_id = auth.uid());

CREATE POLICY "service_role_all_projects" ON client_projects
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Client Project Tasks table
CREATE TABLE IF NOT EXISTS client_project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES client_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'waiting_approval', 'complete')),
  start_date DATE,
  end_date DATE,
  related_approval_id UUID,
  related_ai_event_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_tasks_project ON client_project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_tasks_status ON client_project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_project_tasks_dates ON client_project_tasks(start_date, end_date);

-- Enable RLS
ALTER TABLE client_project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS policies (through project)
CREATE POLICY "clients_view_project_tasks" ON client_project_tasks
FOR SELECT USING (
  project_id IN (
    SELECT id FROM client_projects WHERE client_id = auth.uid()
  )
);

CREATE POLICY "clients_manage_project_tasks" ON client_project_tasks
FOR ALL USING (
  project_id IN (
    SELECT id FROM client_projects WHERE client_id = auth.uid()
  )
);

CREATE POLICY "service_role_all_tasks" ON client_project_tasks
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON client_projects TO authenticated;
GRANT ALL ON client_project_tasks TO authenticated;
