-- =====================================================
-- Migration 043: Autonomous Tasks Table
-- Created: 2025-11-18
-- Purpose: Task logging for autonomous agents and cron jobs
-- =====================================================

-- =====================================================
-- 1. AUTONOMOUS TASKS TABLE
-- =====================================================

-- Drop table if exists (clean slate)
DROP TABLE IF EXISTS autonomous_tasks CASCADE;

CREATE TABLE autonomous_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Task identification
  task_type TEXT NOT NULL CHECK (task_type IN (
    'continuous_intelligence_update',
    'daily_analytics_rollup',
    'weekly_report_generation',
    'monthly_summary',
    'email_sync',
    'contact_enrichment',
    'lead_scoring_batch',
    'campaign_optimization',
    'content_calendar_sync',
    'social_media_posting',
    'data_cleanup',
    'system_health_check'
  )),

  -- Task status
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'running',
    'completed',
    'failed',
    'partial_failure',
    'cancelled'
  )),

  -- Task data
  input_data JSONB DEFAULT '{}'::jsonb,
  output_data JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,

  -- Timing
  executed_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Metadata
  triggered_by TEXT, -- 'cron', 'user', 'api', 'system'
  agent_name TEXT,
  cost_estimate_usd NUMERIC(10, 6),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. INDEXES
-- =====================================================

-- Primary query patterns
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_workspace_id
  ON autonomous_tasks(workspace_id);

CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_task_type
  ON autonomous_tasks(task_type);

CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_status
  ON autonomous_tasks(status);

CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_executed_at
  ON autonomous_tasks(executed_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_type_status_executed
  ON autonomous_tasks(task_type, status, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_workspace_type_executed
  ON autonomous_tasks(workspace_id, task_type, executed_at DESC);

-- Agent performance queries
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_agent_name
  ON autonomous_tasks(agent_name) WHERE agent_name IS NOT NULL;

-- JSONB indexes for querying task data
CREATE INDEX IF NOT EXISTS idx_autonomous_tasks_output_data
  ON autonomous_tasks USING GIN (output_data);

-- =====================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE autonomous_tasks ENABLE ROW LEVEL SECURITY;

-- Workspace isolation - users can only see their workspace's tasks
DROP POLICY IF EXISTS workspace_isolation_select ON autonomous_tasks;
CREATE POLICY workspace_isolation_select ON autonomous_tasks
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Service role can access all
DROP POLICY IF EXISTS service_role_all_access ON autonomous_tasks;
CREATE POLICY service_role_all_access ON autonomous_tasks
  FOR ALL
  USING (auth.role() = 'service_role');

-- System can insert (for cron jobs)
DROP POLICY IF EXISTS system_insert ON autonomous_tasks;
CREATE POLICY system_insert ON autonomous_tasks
  FOR INSERT
  WITH CHECK (true); -- Allow inserts from system (cron jobs)

-- =====================================================
-- 4. HELPER FUNCTION
-- =====================================================

-- Function to get recent task execution summary
CREATE OR REPLACE FUNCTION get_autonomous_task_summary(
  p_workspace_id UUID,
  p_task_type TEXT DEFAULT NULL,
  p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
  task_type TEXT,
  total_executions BIGINT,
  successful_executions BIGINT,
  failed_executions BIGINT,
  avg_duration_ms NUMERIC,
  total_cost_usd NUMERIC,
  last_execution TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.task_type,
    COUNT(*) as total_executions,
    COUNT(*) FILTER (WHERE t.status = 'completed') as successful_executions,
    COUNT(*) FILTER (WHERE t.status IN ('failed', 'partial_failure')) as failed_executions,
    ROUND(AVG(t.duration_ms)) as avg_duration_ms,
    ROUND(SUM(t.cost_estimate_usd), 6) as total_cost_usd,
    MAX(t.executed_at) as last_execution
  FROM autonomous_tasks t
  WHERE
    t.workspace_id = p_workspace_id
    AND (p_task_type IS NULL OR t.task_type = p_task_type)
    AND t.executed_at > NOW() - (p_hours_back || ' hours')::INTERVAL
  GROUP BY t.task_type
  ORDER BY last_execution DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_autonomous_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_autonomous_tasks_updated_at ON autonomous_tasks;
CREATE TRIGGER trigger_autonomous_tasks_updated_at
  BEFORE UPDATE ON autonomous_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_autonomous_tasks_updated_at();

-- Trigger to auto-calculate duration_ms
CREATE OR REPLACE FUNCTION calculate_autonomous_task_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.completed_at IS NOT NULL AND NEW.executed_at IS NOT NULL THEN
    NEW.duration_ms = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.executed_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_duration ON autonomous_tasks;
CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE ON autonomous_tasks
  FOR EACH ROW
  EXECUTE FUNCTION calculate_autonomous_task_duration();

-- =====================================================
-- 6. VERIFICATION
-- =====================================================

DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INTEGER;
  policy_count INTEGER;
  function_exists BOOLEAN;
BEGIN
  -- Check table exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'autonomous_tasks'
  ) INTO table_exists;

  -- Count indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'autonomous_tasks';

  -- Count RLS policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'autonomous_tasks';

  -- Check function exists
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'get_autonomous_task_summary'
  ) INTO function_exists;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration 043 Complete!';
  RAISE NOTICE '📊 autonomous_tasks table: %', CASE WHEN table_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE '📊 Indexes created: %', index_count;
  RAISE NOTICE '📊 RLS policies created: %', policy_count;
  RAISE NOTICE '📊 Helper function: %', CASE WHEN function_exists THEN 'CREATED' ELSE 'FAILED' END;
  RAISE NOTICE '';

  IF table_exists AND index_count >= 8 AND policy_count >= 3 AND function_exists THEN
    RAISE NOTICE '✨ SUCCESS: Autonomous tasks infrastructure ready!';
  ELSE
    RAISE WARNING '⚠️  Some components may be missing. Review output above.';
  END IF;
END $$;

-- =====================================================
-- 7. COMMENTS
-- =====================================================

COMMENT ON TABLE autonomous_tasks IS 'Task execution log for autonomous agents and cron jobs';
COMMENT ON COLUMN autonomous_tasks.task_type IS 'Type of autonomous task (continuous intelligence, analytics rollup, etc.)';
COMMENT ON COLUMN autonomous_tasks.status IS 'Task execution status (pending, running, completed, failed, partial_failure, cancelled)';
COMMENT ON COLUMN autonomous_tasks.input_data IS 'Task input parameters as JSON';
COMMENT ON COLUMN autonomous_tasks.output_data IS 'Task execution results as JSON';
COMMENT ON COLUMN autonomous_tasks.duration_ms IS 'Task execution duration in milliseconds (auto-calculated via trigger)';
COMMENT ON COLUMN autonomous_tasks.triggered_by IS 'What triggered the task (cron, user, api, system)';
COMMENT ON COLUMN autonomous_tasks.agent_name IS 'Name of agent that executed the task (if applicable)';
COMMENT ON COLUMN autonomous_tasks.cost_estimate_usd IS 'Estimated cost of task execution (AI model costs)';

COMMENT ON FUNCTION get_autonomous_task_summary IS 'Get summary statistics for autonomous task executions';
