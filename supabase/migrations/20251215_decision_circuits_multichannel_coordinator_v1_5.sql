-- Decision Circuits Multi-Channel Coordinator v1.5.0 Migration
-- Orchestration-only agent for coordinating Email and Social execution agents
-- Applied on top of v1.0-1.4 migrations

-- Multi-channel executions table (orchestration audit trail)
CREATE TABLE IF NOT EXISTS multichannel_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  circuit_execution_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  flow_id TEXT NOT NULL CHECK (flow_id IN ('EMAIL_THEN_SOCIAL', 'SOCIAL_THEN_EMAIL', 'EMAIL_ONLY', 'SOCIAL_ONLY')),

  -- Orchestration tracking
  agent_sequence TEXT[] DEFAULT '{}',
  execution_status TEXT NOT NULL CHECK (execution_status IN ('in_progress', 'completed', 'failed')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT multichannel_executions_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_multichannel_executions_workspace
  ON multichannel_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_multichannel_executions_circuit
  ON multichannel_executions(circuit_execution_id);
CREATE INDEX IF NOT EXISTS idx_multichannel_executions_client
  ON multichannel_executions(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_multichannel_executions_flow
  ON multichannel_executions(flow_id);
CREATE INDEX IF NOT EXISTS idx_multichannel_executions_started_at
  ON multichannel_executions(started_at DESC);

-- Enable Row Level Security
ALTER TABLE multichannel_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policy for tenant isolation
DROP POLICY IF EXISTS "multichannel_executions_tenant_isolation" ON multichannel_executions;
CREATE POLICY "multichannel_executions_tenant_isolation" ON multichannel_executions
FOR ALL USING (workspace_id = get_current_workspace_id());

-- View for multi-channel performance summary
CREATE OR REPLACE VIEW multichannel_performance AS
SELECT
  workspace_id,
  flow_id,
  COUNT(*) as total_executions,
  SUM(CASE WHEN execution_status = 'completed' THEN 1 ELSE 0 END) as successful_executions,
  ROUND(
    100.0 * SUM(CASE WHEN execution_status = 'completed' THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as success_rate,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds
FROM multichannel_executions
WHERE completed_at IS NOT NULL
GROUP BY workspace_id, flow_id;

-- Comments
COMMENT ON TABLE multichannel_executions IS 'Audit trail for multi-channel coordinator executions with orchestration sequence and status tracking';
COMMENT ON VIEW multichannel_performance IS 'Performance summary of multi-channel workflows by flow type';
