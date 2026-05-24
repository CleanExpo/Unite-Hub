-- Migration 401: Execution History for Learning System
-- Creates table to track agent executions for learning and optimization

-- Create execution_history table
CREATE TABLE IF NOT EXISTS execution_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Agent and task info
  agent_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  task_description TEXT NOT NULL,

  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Results
  success BOOLEAN,
  error_message TEXT,
  error_type TEXT,

  -- Data
  inputs JSONB DEFAULT '{}'::jsonb,
  outputs JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_execution_history_workspace
  ON execution_history(workspace_id);

CREATE INDEX IF NOT EXISTS idx_execution_history_agent_task
  ON execution_history(agent_id, task_type);

CREATE INDEX IF NOT EXISTS idx_execution_history_started_at
  ON execution_history(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_execution_history_success
  ON execution_history(success) WHERE success IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_execution_history_error_type
  ON execution_history(error_type) WHERE error_type IS NOT NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_execution_history_workspace_agent_task_started
  ON execution_history(workspace_id, agent_id, task_type, started_at DESC);

-- RLS policies
ALTER TABLE execution_history ENABLE ROW LEVEL SECURITY;

-- Users can only see executions from their workspace
CREATE POLICY "Users can view executions in their workspace"
  ON execution_history
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert executions in their workspace
CREATE POLICY "Users can insert executions in their workspace"
  ON execution_history
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Users can update executions in their workspace
CREATE POLICY "Users can update executions in their workspace"
  ON execution_history
  FOR UPDATE
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_execution_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER execution_history_updated_at
  BEFORE UPDATE ON execution_history
  FOR EACH ROW
  EXECUTE FUNCTION update_execution_history_updated_at();

-- Comment on table
COMMENT ON TABLE execution_history IS 'Tracks agent execution history for learning and optimization';
COMMENT ON COLUMN execution_history.agent_id IS 'ID of agent that performed the execution';
COMMENT ON COLUMN execution_history.task_type IS 'Type of task (email_processing, content_generation, etc.)';
COMMENT ON COLUMN execution_history.duration_ms IS 'Execution duration in milliseconds';
COMMENT ON COLUMN execution_history.success IS 'Whether execution succeeded';
COMMENT ON COLUMN execution_history.inputs IS 'Input parameters for the execution';
COMMENT ON COLUMN execution_history.outputs IS 'Output data from the execution';
COMMENT ON COLUMN execution_history.metadata IS 'Additional metadata about the execution';
