/**
 * Migration 237: Phase 4 - Autonomous Multi-Agent Strategy Execution System
 *
 * Creates tables for:
 * - Strategy execution tracking
 * - Agent task management
 * - Execution health monitoring
 * - Task propagation and dependency management
 *
 * Dependencies: Migration 236 (hierarchical_strategies)
 */

-- 1. Strategy Executions Table
CREATE TABLE IF NOT EXISTS strategy_executions (
  id TEXT PRIMARY KEY,
  strategy_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  failed_tasks INTEGER DEFAULT 0,
  health_metrics JSONB DEFAULT '{"score": 100, "issues": []}'::jsonb,
  metrics JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_execution_status CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled'))
);

-- Add foreign key constraint if hierarchical_strategies table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hierarchical_strategies') THEN
    ALTER TABLE strategy_executions
    ADD CONSTRAINT fk_strategy_executions_strategy_id
    FOREIGN KEY (strategy_id) REFERENCES hierarchical_strategies(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX idx_strategy_executions_strategy_id ON strategy_executions(strategy_id);
CREATE INDEX idx_strategy_executions_workspace_id ON strategy_executions(workspace_id);
CREATE INDEX idx_strategy_executions_user_id ON strategy_executions(user_id);
CREATE INDEX idx_strategy_executions_status ON strategy_executions(status);
CREATE INDEX idx_strategy_executions_started_at ON strategy_executions(started_at DESC);

-- 2. Agent Tasks Table
CREATE TABLE IF NOT EXISTS agent_tasks (
  id TEXT PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES strategy_executions(id) ON DELETE CASCADE,
  l4_item_id TEXT NOT NULL,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('email', 'content', 'research', 'scheduling', 'analysis', 'coordination')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'skipped')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  description TEXT NOT NULL,
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  assigned_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 1,
  workspace_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_agent_type CHECK (agent_type IN ('email', 'content', 'research', 'scheduling', 'analysis', 'coordination')),
  CONSTRAINT valid_task_status CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'failed', 'skipped')),
  CONSTRAINT valid_priority CHECK (priority IN ('high', 'medium', 'low'))
);

-- Add foreign key constraint for l4_item_id if strategy_l4_items table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strategy_l4_items') THEN
    ALTER TABLE agent_tasks
    ADD CONSTRAINT fk_agent_tasks_l4_item_id
    FOREIGN KEY (l4_item_id) REFERENCES strategy_l4_items(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX idx_agent_tasks_execution_id ON agent_tasks(execution_id);
CREATE INDEX idx_agent_tasks_l4_item_id ON agent_tasks(l4_item_id);
CREATE INDEX idx_agent_tasks_agent_type ON agent_tasks(agent_type);
CREATE INDEX idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX idx_agent_tasks_priority ON agent_tasks(priority DESC);
CREATE INDEX idx_agent_tasks_workspace_id ON agent_tasks(workspace_id);
CREATE INDEX idx_agent_tasks_assigned_at ON agent_tasks(assigned_at);

-- 3. Execution Health Snapshots Table
CREATE TABLE IF NOT EXISTS execution_health_snapshots (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES strategy_executions(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL,
  health_score NUMERIC(5, 2) NOT NULL CHECK (health_score >= 0 AND health_score <= 100),
  completion_rate NUMERIC(5, 2) CHECK (completion_rate >= 0 AND completion_rate <= 1),
  error_rate NUMERIC(5, 2) CHECK (error_rate >= 0 AND error_rate <= 1),
  avg_task_duration INTEGER,
  issues TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_health_score CHECK (health_score >= 0 AND health_score <= 100)
);

CREATE INDEX idx_execution_health_snapshots_execution_id ON execution_health_snapshots(execution_id);
CREATE INDEX idx_execution_health_snapshots_workspace_id ON execution_health_snapshots(workspace_id);
CREATE INDEX idx_execution_health_snapshots_created_at ON execution_health_snapshots(created_at DESC);

-- 4. Task Propagation Log Table (for audit trail)
CREATE TABLE IF NOT EXISTS task_propagation_logs (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES strategy_executions(id) ON DELETE CASCADE,
  l4_item_id TEXT NOT NULL,
  source_l4_id TEXT,
  propagation_rules JSONB,
  created_tasks TEXT[] NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add foreign key constraint for l4_item_id if strategy_l4_items table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'strategy_l4_items') THEN
    ALTER TABLE task_propagation_logs
    ADD CONSTRAINT fk_task_propagation_logs_l4_item_id
    FOREIGN KEY (l4_item_id) REFERENCES strategy_l4_items(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX idx_task_propagation_logs_execution_id ON task_propagation_logs(execution_id);
CREATE INDEX idx_task_propagation_logs_l4_item_id ON task_propagation_logs(l4_item_id);

-- 5. Execution Events Table (for real-time bridge)
CREATE TABLE IF NOT EXISTS execution_events (
  id BIGSERIAL PRIMARY KEY,
  execution_id TEXT NOT NULL REFERENCES strategy_executions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workspace_id TEXT NOT NULL
);

CREATE INDEX idx_execution_events_execution_id ON execution_events(execution_id);
CREATE INDEX idx_execution_events_event_type ON execution_events(event_type);
CREATE INDEX idx_execution_events_timestamp ON execution_events(timestamp DESC);
CREATE INDEX idx_execution_events_workspace_id ON execution_events(workspace_id);

-- 6. Update timestamp trigger for strategy_executions
CREATE OR REPLACE FUNCTION update_strategy_executions_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_strategy_executions_timestamp ON strategy_executions;
CREATE TRIGGER trigger_strategy_executions_timestamp
  BEFORE UPDATE ON strategy_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_strategy_executions_timestamp();

-- 7. Update timestamp trigger for agent_tasks
CREATE OR REPLACE FUNCTION update_agent_tasks_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_agent_tasks_timestamp ON agent_tasks;
CREATE TRIGGER trigger_agent_tasks_timestamp
  BEFORE UPDATE ON agent_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_tasks_timestamp();

-- 8. Enable RLS on all new tables
ALTER TABLE strategy_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_health_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_propagation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_events ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for strategy_executions
CREATE POLICY strategy_executions_users_select ON strategy_executions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = strategy_executions.workspace_id
    )
  );

CREATE POLICY strategy_executions_users_insert ON strategy_executions
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = strategy_executions.workspace_id
    )
  );

CREATE POLICY strategy_executions_users_update ON strategy_executions
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = strategy_executions.workspace_id
    )
  );

-- 10. RLS Policies for agent_tasks
CREATE POLICY agent_tasks_users_select ON agent_tasks
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = agent_tasks.workspace_id
    )
  );

CREATE POLICY agent_tasks_users_insert ON agent_tasks
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = agent_tasks.workspace_id
    )
  );

CREATE POLICY agent_tasks_users_update ON agent_tasks
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = agent_tasks.workspace_id
    )
  );

-- 11. RLS Policies for execution_health_snapshots
CREATE POLICY execution_health_snapshots_users_select ON execution_health_snapshots
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = execution_health_snapshots.workspace_id
    )
  );

CREATE POLICY execution_health_snapshots_users_insert ON execution_health_snapshots
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = execution_health_snapshots.workspace_id
    )
  );

-- 12. RLS Policies for other tables (readonly for users via API)
CREATE POLICY task_propagation_logs_users_select ON task_propagation_logs
  FOR SELECT USING (
    l4_item_id IN (
      SELECT id FROM strategy_l4_items
      WHERE strategy_l4_items.workspace_id = task_propagation_logs.workspace_id
    )
  );

CREATE POLICY execution_events_users_select ON execution_events
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspaces
      WHERE workspace_id = execution_events.workspace_id
    )
  );

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON strategy_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON agent_tasks TO authenticated;
GRANT SELECT, INSERT ON execution_health_snapshots TO authenticated;
GRANT SELECT ON task_propagation_logs TO authenticated;
GRANT SELECT ON execution_events TO authenticated;

-- Services can also insert events
GRANT INSERT ON execution_events TO service_role;

-- Index for dependency queries
CREATE INDEX idx_agent_tasks_dependencies ON agent_tasks USING GIN(dependencies);

-- Comment on tables and columns for documentation
COMMENT ON TABLE strategy_executions IS 'Tracks autonomous execution of strategies with status and health metrics';
COMMENT ON TABLE agent_tasks IS 'Agent-executable tasks derived from L4 hierarchy items';
COMMENT ON TABLE execution_health_snapshots IS 'Historical health checks during execution';
COMMENT ON TABLE execution_events IS 'Real-time events streamed to frontend via WebSocket/SSE';
COMMENT ON COLUMN strategy_executions.health_metrics IS 'Current health score (0-100) and issues list';
COMMENT ON COLUMN agent_tasks.dependencies IS 'Array of agent_task IDs this task depends on';
COMMENT ON COLUMN agent_tasks.result IS 'Execution result data from the agent';
