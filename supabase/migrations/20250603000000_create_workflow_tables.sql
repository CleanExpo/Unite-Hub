-- Create workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL, -- 'deal_stage_change', 'task_status_change', 'client_created', etc.
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create workflow triggers table
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL, -- Configuration for the trigger (e.g., { "from_stage": "lead", "to_stage": "qualified" })
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create workflow conditions table
CREATE TABLE IF NOT EXISTS workflow_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL, -- 'field_equals', 'field_contains', 'date_before', etc.
  field_name TEXT NOT NULL,
  operator TEXT NOT NULL, -- 'equals', 'not_equals', 'contains', 'greater_than', etc.
  value JSONB,
  logical_operator TEXT DEFAULT 'AND', -- 'AND' or 'OR' for combining conditions
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create workflow actions table
CREATE TABLE IF NOT EXISTS workflow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'send_email', 'create_task', 'update_field', 'send_notification', etc.
  action_config JSONB NOT NULL, -- Configuration for the action
  order_index INTEGER DEFAULT 0, -- Order of execution
  delay_minutes INTEGER DEFAULT 0, -- Delay before executing action
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create workflow execution logs table
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  trigger_entity_type TEXT NOT NULL, -- 'deal', 'task', 'client', etc.
  trigger_entity_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_details JSONB
);

-- Create workflow action logs table
CREATE TABLE IF NOT EXISTS workflow_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_log_id UUID NOT NULL REFERENCES workflow_execution_logs(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES workflow_actions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result JSONB
);

-- Create indexes for better performance
CREATE INDEX idx_workflow_templates_trigger_type ON workflow_templates(trigger_type);
CREATE INDEX idx_workflow_templates_is_active ON workflow_templates(is_active);
CREATE INDEX idx_workflow_triggers_workflow_id ON workflow_triggers(workflow_id);
CREATE INDEX idx_workflow_conditions_workflow_id ON workflow_conditions(workflow_id);
CREATE INDEX idx_workflow_actions_workflow_id ON workflow_actions(workflow_id);
CREATE INDEX idx_workflow_execution_logs_workflow_id ON workflow_execution_logs(workflow_id);
CREATE INDEX idx_workflow_execution_logs_status ON workflow_execution_logs(status);
CREATE INDEX idx_workflow_action_logs_execution_log_id ON workflow_action_logs(execution_log_id);

-- Add RLS policies
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_action_logs ENABLE ROW LEVEL SECURITY;

-- Policies for workflow_templates
CREATE POLICY "Users can view workflows" ON workflow_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users with permission can create workflows" ON workflow_templates
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
      AND up.permission = 'crm.workflows.create'
    )
  );

CREATE POLICY "Users with permission can update workflows" ON workflow_templates
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions up
      WHERE up.user_id = auth.uid()
      AND up.permission = 'crm.workflows.update'
    )
  );

-- Similar policies for other tables
CREATE POLICY "Users can view workflow components" ON workflow_triggers
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view workflow conditions" ON workflow_conditions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view workflow actions" ON workflow_actions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view workflow logs" ON workflow_execution_logs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can view action logs" ON workflow_action_logs
  FOR SELECT TO authenticated
  USING (true);

-- Add workflow permissions
INSERT INTO permissions (name, description, category) VALUES
  ('crm.workflows.view', 'View workflow templates', 'CRM'),
  ('crm.workflows.create', 'Create workflow templates', 'CRM'),
  ('crm.workflows.update', 'Update workflow templates', 'CRM'),
  ('crm.workflows.delete', 'Delete workflow templates', 'CRM'),
  ('crm.workflows.execute', 'Execute workflows', 'CRM')
ON CONFLICT (name) DO NOTHING;
