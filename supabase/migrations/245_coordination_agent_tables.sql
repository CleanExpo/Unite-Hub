-- Phase 5 Agent 6: Coordination Agent Tables
-- Stores workflow executions, task orchestration, and multi-agent coordination

CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  brand_id TEXT NOT NULL,
  objective TEXT NOT NULL,
  description TEXT,

  -- Workflow structure
  task_count INTEGER NOT NULL,
  tasks JSONB NOT NULL,

  -- Execution tracking
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,

  -- Risk & approval
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  requires_founder_review BOOLEAN NOT NULL DEFAULT FALSE,
  founder_decision TEXT,

  -- Results
  results JSONB,
  insights JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',

  -- Performance
  duration_ms INTEGER,
  estimated_remaining_ms INTEGER,

  CONSTRAINT valid_brand FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT,
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked')),
  CONSTRAINT valid_approval CHECK (approval_status IN ('pending', 'approved', 'rejected', 'pending_review'))
);

-- Task execution log
CREATE TABLE IF NOT EXISTS task_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  workflow_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,

  task_id TEXT NOT NULL,
  agent TEXT NOT NULL,
  action TEXT NOT NULL,
  params JSONB NOT NULL,

  -- Execution details
  status TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  attempts INTEGER NOT NULL DEFAULT 1,

  -- Results
  result JSONB,
  error TEXT,

  CONSTRAINT valid_agent CHECK (agent IN ('email', 'research', 'content', 'scheduling', 'analysis', 'coordination')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'blocked', 'retrying'))
);

-- Workflow templates (for pattern matching)
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  template_name TEXT NOT NULL UNIQUE,
  description TEXT,
  pattern TEXT NOT NULL, -- Objective pattern to match
  task_template JSONB NOT NULL,

  usage_count INTEGER DEFAULT 0,
  last_used TIMESTAMP WITH TIME ZONE
);

-- Workflow performance metrics
CREATE TABLE IF NOT EXISTS workflow_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  workflow_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,

  total_duration_ms INTEGER NOT NULL,
  critical_path_duration_ms INTEGER NOT NULL,
  parallelization_factor DECIMAL(5,2),
  efficiency_score DECIMAL(5,2),

  tasks_completed INTEGER NOT NULL,
  tasks_failed INTEGER NOT NULL,
  tasks_retried INTEGER DEFAULT 0,

  avg_task_duration_ms DECIMAL(10,2),
  success_rate DECIMAL(5,2)
);

-- Enable RLS
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY workflow_executions_authenticated_read ON workflow_executions
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

CREATE POLICY task_executions_authenticated_read ON task_executions
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

CREATE POLICY workflow_templates_authenticated_read ON workflow_templates
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

CREATE POLICY workflow_metrics_authenticated_read ON workflow_metrics
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_executions_brand ON workflow_executions(brand_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_created ON workflow_executions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_risk ON workflow_executions(risk_level);

CREATE INDEX IF NOT EXISTS idx_task_executions_workflow ON task_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_task_executions_agent ON task_executions(agent);
CREATE INDEX IF NOT EXISTS idx_task_executions_status ON task_executions(status);

CREATE INDEX IF NOT EXISTS idx_workflow_metrics_workflow ON workflow_metrics(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_metrics_efficiency ON workflow_metrics(efficiency_score DESC);

CREATE INDEX IF NOT EXISTS idx_workflow_templates_pattern ON workflow_templates(pattern);

-- Comments
DO $$
BEGIN
  COMMENT ON TABLE workflow_executions IS 'Stores workflow orchestration executions with task decomposition and multi-agent coordination results.';
  COMMENT ON TABLE task_executions IS 'Log of individual task execution within workflows, tracking attempts, duration, and results.';
  COMMENT ON TABLE workflow_templates IS 'Template patterns for common business objectives, auto-matched to decompose workflows.';
  COMMENT ON TABLE workflow_metrics IS 'Performance metrics for workflow execution including critical path and efficiency analysis.';
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
