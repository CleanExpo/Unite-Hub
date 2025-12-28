-- Project Vend Phase 2: Base Agent Tables (PREREQUISITE)
-- Creates agent_tasks and agent_executions tables that Phase 2 references

-- Agent tasks queue table
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL,
  agent_name TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  context JSONB,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | completed | failed
  result JSONB,
  last_error TEXT,

  -- Priority and retry
  priority INTEGER DEFAULT 5,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  CONSTRAINT valid_priority CHECK (priority >= 0 AND priority <= 10),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0 AND retry_count <= max_retries)
);

CREATE INDEX IF NOT EXISTS idx_agent_tasks_workspace ON agent_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status, workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_agent ON agent_tasks(agent_name, workspace_id);

-- Agent executions table
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES agent_tasks(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,

  -- Execution details
  status TEXT NOT NULL DEFAULT 'running', -- running | success | error
  output JSONB,
  error_message TEXT,

  -- Performance
  duration_ms INTEGER,

  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_execution_status CHECK (status IN ('running', 'success', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_agent_executions_workspace ON agent_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent ON agent_executions(agent_name, workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_task ON agent_executions(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status, workspace_id);

-- RLS
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their workspace tasks" ON agent_tasks;
CREATE POLICY "Users can view their workspace tasks" ON agent_tasks
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage tasks" ON agent_tasks;
CREATE POLICY "System can manage tasks" ON agent_tasks
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their workspace executions" ON agent_executions;
CREATE POLICY "Users can view their workspace executions" ON agent_executions
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "System can manage executions" ON agent_executions;
CREATE POLICY "System can manage executions" ON agent_executions
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE agent_tasks IS 'Task queue for agent execution. Referenced by agent_execution_metrics.';
COMMENT ON TABLE agent_executions IS 'Agent execution history. Referenced by agent_execution_metrics, agent_escalations, agent_verification_logs.';
