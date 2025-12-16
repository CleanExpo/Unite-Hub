-- Decision Circuits - Core Execution & Autonomy System
-- Initialize tables for circuit execution logging and self-correction

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Circuit execution logs table
CREATE TABLE IF NOT EXISTS circuit_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID,
  circuit_id TEXT NOT NULL,
  execution_id TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  inputs JSONB NOT NULL DEFAULT '{}',
  outputs JSONB NOT NULL DEFAULT '{}',
  decision_path TEXT[] NOT NULL DEFAULT '{}',
  success BOOLEAN NOT NULL,
  error TEXT,
  latency_ms INT,
  confidence_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_execution_logs_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_execution_logs_workspace
  ON circuit_execution_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_execution_logs_circuit
  ON circuit_execution_logs(workspace_id, circuit_id);
CREATE INDEX IF NOT EXISTS idx_circuit_execution_logs_client
  ON circuit_execution_logs(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_circuit_execution_logs_timestamp
  ON circuit_execution_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_circuit_execution_logs_execution_id
  ON circuit_execution_logs(execution_id);

-- Strategy state tracking table
CREATE TABLE IF NOT EXISTS circuit_strategy_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  audience_segment TEXT NOT NULL,
  strategy_id TEXT NOT NULL,
  engagement_score FLOAT DEFAULT 0,
  conversion_score FLOAT DEFAULT 0,
  cycle_count INT DEFAULT 0,
  decline_cycles INT DEFAULT 0,
  last_rotated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_strategy_states_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_strategy_states_workspace
  ON circuit_strategy_states(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_strategy_states_client_segment
  ON circuit_strategy_states(workspace_id, client_id, audience_segment);
CREATE INDEX IF NOT EXISTS idx_circuit_strategy_states_updated
  ON circuit_strategy_states(updated_at DESC);

-- Auto-correction logs table
CREATE TABLE IF NOT EXISTS circuit_autocorrection_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  log_id TEXT UNIQUE NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('rotate_strategy', 'escalate_to_admin', 'none')),
  previous_strategy_id TEXT,
  new_strategy_id TEXT,
  reason TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.5,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT circuit_autocorrection_logs_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_circuit_autocorrection_logs_workspace
  ON circuit_autocorrection_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_circuit_autocorrection_logs_client
  ON circuit_autocorrection_logs(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_circuit_autocorrection_logs_timestamp
  ON circuit_autocorrection_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_circuit_autocorrection_logs_log_id
  ON circuit_autocorrection_logs(log_id);

-- Content strategies table (referenced by autonomy system)
CREATE TABLE IF NOT EXISTS content_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  audience_segment TEXT NOT NULL,
  strategy_name TEXT NOT NULL,
  description TEXT,
  success_rate FLOAT DEFAULT 0,
  engagement_threshold FLOAT DEFAULT 0.5,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT content_strategies_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_content_strategies_workspace
  ON content_strategies(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_strategies_segment
  ON content_strategies(workspace_id, audience_segment);

-- Enable Row Level Security on all new tables
ALTER TABLE circuit_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_strategy_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE circuit_autocorrection_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_strategies ENABLE ROW LEVEL SECURITY;

-- RLS Policy for circuit_execution_logs
DROP POLICY IF EXISTS "circuit_execution_logs_tenant_isolation" ON circuit_execution_logs;
CREATE POLICY "circuit_execution_logs_tenant_isolation" ON circuit_execution_logs
FOR ALL USING (workspace_id = get_current_workspace_id());

-- RLS Policy for circuit_strategy_states
DROP POLICY IF EXISTS "circuit_strategy_states_tenant_isolation" ON circuit_strategy_states;
CREATE POLICY "circuit_strategy_states_tenant_isolation" ON circuit_strategy_states
FOR ALL USING (workspace_id = get_current_workspace_id());

-- RLS Policy for circuit_autocorrection_logs
DROP POLICY IF EXISTS "circuit_autocorrection_logs_tenant_isolation" ON circuit_autocorrection_logs;
CREATE POLICY "circuit_autocorrection_logs_tenant_isolation" ON circuit_autocorrection_logs
FOR ALL USING (workspace_id = get_current_workspace_id());

-- RLS Policy for content_strategies
DROP POLICY IF EXISTS "content_strategies_tenant_isolation" ON content_strategies;
CREATE POLICY "content_strategies_tenant_isolation" ON content_strategies
FOR ALL USING (workspace_id = get_current_workspace_id());

-- Comment on tables for documentation
COMMENT ON TABLE circuit_execution_logs IS 'Audit trail for all circuit executions with full decision path traceability';
COMMENT ON TABLE circuit_strategy_states IS 'Current state of marketing strategies per client/segment with performance metrics';
COMMENT ON TABLE circuit_autocorrection_logs IS 'Log of autonomous self-correction actions taken by the system';
COMMENT ON TABLE content_strategies IS 'Available marketing content strategies with performance metrics';
