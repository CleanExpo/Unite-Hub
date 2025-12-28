-- Project Vend Phase 2: Agent Execution Metrics
-- Tracks performance, costs, and business metrics for all agent executions

-- Agent execution metrics table
CREATE TABLE IF NOT EXISTS agent_execution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  execution_id UUID REFERENCES agent_executions(id) ON DELETE SET NULL,

  -- Performance metrics
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_type TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Cost metrics (Claude API usage)
  model_used TEXT, -- opus-4-5-20251101 | sonnet-4-5-20250929 | haiku-4-5-20251001
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0,

  -- Business metrics (agent-specific)
  items_processed INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  confidence_score DECIMAL(3,2),

  -- Timestamps
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT valid_confidence CHECK (confidence_score >= 0 AND confidence_score <= 1),
  CONSTRAINT valid_retry_count CHECK (retry_count >= 0),
  CONSTRAINT valid_tokens CHECK (input_tokens >= 0 AND output_tokens >= 0),
  CONSTRAINT valid_cost CHECK (cost_usd >= 0)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_workspace
  ON agent_execution_metrics(workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_agent
  ON agent_execution_metrics(agent_name, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_execution
  ON agent_execution_metrics(execution_id)
  WHERE execution_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_execution_metrics_success
  ON agent_execution_metrics(workspace_id, agent_name, success, executed_at DESC);

-- Row Level Security
ALTER TABLE agent_execution_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see metrics for their workspace
DROP POLICY IF EXISTS "Users can view their workspace agent metrics" ON agent_execution_metrics;
CREATE POLICY "Users can view their workspace agent metrics" ON agent_execution_metrics
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policy: System can insert metrics
DROP POLICY IF EXISTS "System can insert agent metrics" ON agent_execution_metrics;
CREATE POLICY "System can insert agent metrics" ON agent_execution_metrics
  FOR INSERT
  WITH CHECK (true); -- Agent system inserts with service role

-- RLS Policy: System can update metrics (for corrections)
DROP POLICY IF EXISTS "System can update agent metrics" ON agent_execution_metrics;
CREATE POLICY "System can update agent metrics" ON agent_execution_metrics
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE agent_execution_metrics IS 'Tracks performance, cost, and business metrics for all agent executions. Used for health monitoring, budget enforcement, and optimization.';
COMMENT ON COLUMN agent_execution_metrics.agent_name IS 'Name of the agent that executed (e.g., EmailAgent, ContentGenerator, Orchestrator)';
COMMENT ON COLUMN agent_execution_metrics.model_used IS 'Claude model used: opus-4-5-20251101, sonnet-4-5-20250929, or haiku-4-5-20251001';
COMMENT ON COLUMN agent_execution_metrics.cost_usd IS 'Calculated cost in USD based on token usage and model pricing';
COMMENT ON COLUMN agent_execution_metrics.confidence_score IS 'Agent confidence in output quality (0-1 scale)';
