-- Project Vend Phase 2: Agent Health Monitoring
-- Tracks real-time health status and degradation for all agents

-- Agent health status table
CREATE TABLE IF NOT EXISTS agent_health_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,

  -- Health indicators
  status TEXT NOT NULL DEFAULT 'healthy', -- healthy | degraded | critical | disabled
  success_rate_24h DECIMAL(5,2), -- percentage (0-100)
  avg_execution_time_24h INTEGER, -- milliseconds
  error_rate_24h DECIMAL(5,2), -- percentage (0-100)
  cost_24h_usd DECIMAL(10,2),

  -- Failure tracking
  consecutive_failures INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT,

  -- Metrics aggregates
  total_executions_24h INTEGER DEFAULT 0,
  total_cost_30d_usd DECIMAL(10,2),

  -- Timestamps
  last_health_check_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, agent_name),
  CONSTRAINT valid_status CHECK (status IN ('healthy', 'degraded', 'critical', 'disabled')),
  CONSTRAINT valid_success_rate CHECK (success_rate_24h >= 0 AND success_rate_24h <= 100),
  CONSTRAINT valid_error_rate CHECK (error_rate_24h >= 0 AND error_rate_24h <= 100),
  CONSTRAINT valid_consecutive_failures CHECK (consecutive_failures >= 0),
  CONSTRAINT valid_total_executions CHECK (total_executions_24h >= 0)
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_agent_health_workspace
  ON agent_health_status(workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_health_status_filter
  ON agent_health_status(status, workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_health_agent_name
  ON agent_health_status(agent_name, workspace_id);

CREATE INDEX IF NOT EXISTS idx_agent_health_last_check
  ON agent_health_status(last_health_check_at DESC);

-- Row Level Security
ALTER TABLE agent_health_status ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view health for their workspace
DROP POLICY IF EXISTS "Users can view their workspace agent health" ON agent_health_status;
CREATE POLICY "Users can view their workspace agent health" ON agent_health_status
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      INNER JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid()
    )
  );

-- RLS Policy: System can manage health status
DROP POLICY IF EXISTS "System can insert agent health" ON agent_health_status;
CREATE POLICY "System can insert agent health" ON agent_health_status
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update agent health" ON agent_health_status;
CREATE POLICY "System can update agent health" ON agent_health_status
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on every update
DROP TRIGGER IF EXISTS trigger_update_agent_health_updated_at ON agent_health_status;
CREATE TRIGGER trigger_update_agent_health_updated_at
  BEFORE UPDATE ON agent_health_status
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_health_updated_at();

-- Function to calculate health status based on metrics
CREATE OR REPLACE FUNCTION calculate_agent_health_status(
  p_success_rate DECIMAL,
  p_error_rate DECIMAL,
  p_consecutive_failures INTEGER
)
RETURNS TEXT AS $$
BEGIN
  -- Critical: success rate < 70% OR error rate > 30% OR 5+ consecutive failures
  IF p_success_rate < 70 OR p_error_rate > 30 OR p_consecutive_failures >= 5 THEN
    RETURN 'critical';
  END IF;

  -- Degraded: success rate < 85% OR error rate > 15% OR 3+ consecutive failures
  IF p_success_rate < 85 OR p_error_rate > 15 OR p_consecutive_failures >= 3 THEN
    RETURN 'degraded';
  END IF;

  -- Healthy: everything nominal
  RETURN 'healthy';
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE agent_health_status IS 'Real-time health monitoring for all agents. Updated every 5 minutes via health monitor service.';
COMMENT ON COLUMN agent_health_status.status IS 'Current health status: healthy (normal), degraded (issues detected), critical (failing), disabled (manually paused)';
COMMENT ON COLUMN agent_health_status.consecutive_failures IS 'Number of failures in a row. Reset to 0 on first success.';
COMMENT ON COLUMN agent_health_status.last_error IS 'Most recent error message for debugging';
COMMENT ON FUNCTION calculate_agent_health_status IS 'Determines agent health status based on success rate, error rate, and consecutive failures';
