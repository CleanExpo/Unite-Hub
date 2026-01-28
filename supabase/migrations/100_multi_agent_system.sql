-- =====================================================
-- Migration 100: Multi-Agent System Infrastructure
-- Created: 2025-01-18
-- Purpose: Add tables for Docker-based multi-agent orchestration
-- =====================================================

-- =====================================================
-- 1. AGENT TASKS TABLE
-- Queue for agent task assignments
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Task identification
  task_type TEXT NOT NULL CHECK (task_type IN (
    'email_intelligence',
    'content_generation',
    'campaign_optimization',
    'strategy_generation',
    'analytics_insights',
    'contact_scoring',
    'mindmap_generation',
    'questionnaire_generation',
    'continuous_monitoring'
  )),

  -- Task assignment
  assigned_agent TEXT CHECK (assigned_agent IN (
    'orchestrator',
    'email-agent',
    'content-agent',
    'campaign-agent',
    'strategy-agent',
    'analytics-agent',
    'continuous-intelligence-agent'
  )),

  -- Task data
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  context JSONB DEFAULT '{}'::jsonb,

  -- Task status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'queued',
    'processing',
    'completed',
    'failed',
    'cancelled',
    'timeout'
  )),

  -- Priority (1-10, higher = more urgent)
  priority INTEGER NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),

  -- Retry logic
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,

  -- Timing
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  queued_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,

  -- Result
  result JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Indexes for common queries
  CONSTRAINT agent_tasks_priority_check CHECK (priority >= 1 AND priority <= 10)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_tasks_workspace ON agent_tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_type ON agent_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_assigned_agent ON agent_tasks(assigned_agent);
CREATE INDEX IF NOT EXISTS idx_agent_tasks_priority_created ON agent_tasks(priority DESC, created_at ASC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_agent_tasks_timeout ON agent_tasks(timeout_at) WHERE status = 'processing';

-- RLS policies
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks in their workspace"
  ON agent_tasks FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Service role has full access to agent_tasks"
  ON agent_tasks FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 2. AGENT EXECUTIONS TABLE
-- Detailed execution history and metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES agent_tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Agent info
  agent_name TEXT NOT NULL,
  agent_version TEXT DEFAULT '1.0.0',
  agent_container_id TEXT,

  -- Execution metrics
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Model usage
  model_used TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  cost_estimate_usd NUMERIC(10, 6),

  -- Status
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'timeout')),
  error_message TEXT,
  error_stack TEXT,

  -- Performance
  cpu_usage_percent NUMERIC(5, 2),
  memory_usage_mb INTEGER,

  -- Result
  output JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_executions_task ON agent_executions(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_workspace ON agent_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_agent ON agent_executions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_created ON agent_executions(created_at DESC);

-- RLS policies
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view executions in their workspace"
  ON agent_executions FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Service role has full access to agent_executions"
  ON agent_executions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 3. AGENT HEALTH TABLE
-- Real-time agent health monitoring
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Agent identification
  agent_name TEXT NOT NULL,
  agent_container_id TEXT,
  agent_host TEXT,

  -- Health status
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy', 'offline')),

  -- Metrics
  uptime_seconds INTEGER,
  tasks_processed_total INTEGER DEFAULT 0,
  tasks_processing_current INTEGER DEFAULT 0,
  tasks_failed_total INTEGER DEFAULT 0,

  -- Performance
  avg_response_time_ms INTEGER,
  success_rate_percent NUMERIC(5, 2),

  -- Resource usage
  cpu_usage_percent NUMERIC(5, 2),
  memory_usage_mb INTEGER,
  memory_limit_mb INTEGER,

  -- Queue metrics
  queue_depth INTEGER DEFAULT 0,

  -- Last heartbeat
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_agent_name UNIQUE(agent_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_health_status ON agent_health(status);
CREATE INDEX IF NOT EXISTS idx_agent_health_heartbeat ON agent_health(last_heartbeat_at DESC);

-- RLS policies
ALTER TABLE agent_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view agent health"
  ON agent_health FOR SELECT
  USING (true);

CREATE POLICY "Service role has full access to agent_health"
  ON agent_health FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 4. AGENT METRICS TABLE
-- Aggregated metrics for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Time dimension
  metric_date DATE NOT NULL,
  metric_hour INTEGER CHECK (metric_hour BETWEEN 0 AND 23),

  -- Agent dimension
  agent_name TEXT NOT NULL,
  task_type TEXT,

  -- Workspace dimension
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Metrics
  tasks_total INTEGER DEFAULT 0,
  tasks_success INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  tasks_timeout INTEGER DEFAULT 0,

  -- Performance
  avg_duration_ms INTEGER,
  p50_duration_ms INTEGER,
  p95_duration_ms INTEGER,
  p99_duration_ms INTEGER,

  -- Cost
  total_cost_usd NUMERIC(10, 6) DEFAULT 0,
  total_tokens_input BIGINT DEFAULT 0,
  total_tokens_output BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_metric_key UNIQUE(metric_date, metric_hour, agent_name, task_type, workspace_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_metrics_date ON agent_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent ON agent_metrics(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_workspace ON agent_metrics(workspace_id);

-- RLS policies
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view metrics for their workspace"
  ON agent_metrics FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()));

CREATE POLICY "Service role has full access to agent_metrics"
  ON agent_metrics FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================================================
-- 5. UPDATE EXISTING TABLES
-- Add intelligence_analyzed columns
-- =====================================================

-- Add to client_emails (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'client_emails' AND column_name = 'intelligence_analyzed'
  ) THEN
    ALTER TABLE client_emails ADD COLUMN intelligence_analyzed BOOLEAN DEFAULT false;
    ALTER TABLE client_emails ADD COLUMN analyzed_at TIMESTAMPTZ;
    CREATE INDEX idx_client_emails_intelligence_analyzed ON client_emails(intelligence_analyzed, received_at);
  END IF;
END $$;

-- Add to media_files (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_files' AND column_name = 'intelligence_analyzed'
  ) THEN
    ALTER TABLE media_files ADD COLUMN intelligence_analyzed BOOLEAN DEFAULT false;
    ALTER TABLE media_files ADD COLUMN analyzed_at TIMESTAMPTZ;
    CREATE INDEX idx_media_files_intelligence_analyzed ON media_files(intelligence_analyzed, created_at);
  END IF;
END $$;

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function: Get pending tasks for agent
CREATE OR REPLACE FUNCTION get_pending_tasks_for_agent(
  p_agent_name TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  task_id UUID,
  task_type TEXT,
  payload JSONB,
  priority INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    agent_tasks.task_type,
    agent_tasks.payload,
    agent_tasks.priority,
    agent_tasks.created_at
  FROM agent_tasks
  WHERE
    (assigned_agent = p_agent_name OR assigned_agent IS NULL)
    AND status = 'pending'
    AND retry_count < max_retries
  ORDER BY priority DESC, created_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update task status
CREATE OR REPLACE FUNCTION update_task_status(
  p_task_id UUID,
  p_status TEXT,
  p_result JSONB DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE agent_tasks
  SET
    status = p_status,
    result = COALESCE(p_result, result),
    last_error = p_error,
    completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END,
    started_at = CASE WHEN p_status = 'processing' AND started_at IS NULL THEN NOW() ELSE started_at END
  WHERE id = p_task_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Record agent heartbeat
CREATE OR REPLACE FUNCTION record_agent_heartbeat(
  p_agent_name TEXT,
  p_status TEXT DEFAULT 'healthy',
  p_metrics JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO agent_health (
    agent_name,
    status,
    tasks_processed_total,
    tasks_processing_current,
    avg_response_time_ms,
    cpu_usage_percent,
    memory_usage_mb,
    queue_depth,
    last_heartbeat_at,
    metadata
  ) VALUES (
    p_agent_name,
    p_status,
    (p_metrics->>'tasks_processed')::INTEGER,
    (p_metrics->>'tasks_processing')::INTEGER,
    (p_metrics->>'avg_response_time_ms')::INTEGER,
    (p_metrics->>'cpu_usage')::NUMERIC,
    (p_metrics->>'memory_mb')::INTEGER,
    (p_metrics->>'queue_depth')::INTEGER,
    NOW(),
    p_metrics
  )
  ON CONFLICT (agent_name)
  DO UPDATE SET
    status = EXCLUDED.status,
    tasks_processed_total = EXCLUDED.tasks_processed_total,
    tasks_processing_current = EXCLUDED.tasks_processing_current,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    cpu_usage_percent = EXCLUDED.cpu_usage_percent,
    memory_usage_mb = EXCLUDED.memory_usage_mb,
    queue_depth = EXCLUDED.queue_depth,
    last_heartbeat_at = NOW(),
    updated_at = NOW(),
    metadata = EXCLUDED.metadata;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_health_updated_at
  BEFORE UPDATE ON agent_health
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_metrics_updated_at
  BEFORE UPDATE ON agent_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. COMMENTS
-- =====================================================

COMMENT ON TABLE agent_tasks IS 'Queue for agent task assignments and tracking';
COMMENT ON TABLE agent_executions IS 'Detailed execution history and performance metrics';
COMMENT ON TABLE agent_health IS 'Real-time agent health monitoring and heartbeats';
COMMENT ON TABLE agent_metrics IS 'Aggregated metrics for analytics and reporting';

COMMENT ON FUNCTION get_pending_tasks_for_agent IS 'Retrieve pending tasks for a specific agent';
COMMENT ON FUNCTION update_task_status IS 'Update task status and metadata';
COMMENT ON FUNCTION record_agent_heartbeat IS 'Record agent health heartbeat with metrics';

-- =====================================================
-- END OF MIGRATION 100
-- =====================================================;
