-- Migration 149: Founder Ops Queue Table
-- Creates the founder_ops_queue table for daily and weekly task scheduling
-- with queue control capabilities (pause/resume/reorder).

-- Drop existing table if exists (for development)
DROP TABLE IF EXISTS founder_ops_queue CASCADE;

-- Create founder_ops_queue table
CREATE TABLE founder_ops_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES founder_ops_tasks(id) ON DELETE CASCADE,
  queue_date DATE NOT NULL,
  queue_order INTEGER NOT NULL,
  scheduled_time TIMESTAMPTZ,
  estimated_duration_minutes INTEGER NOT NULL,
  is_paused BOOLEAN DEFAULT FALSE,
  paused_at TIMESTAMPTZ,
  paused_by UUID REFERENCES user_profiles(id),
  paused_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_queue_order CHECK (queue_order > 0),
  CONSTRAINT valid_duration CHECK (estimated_duration_minutes > 0),
  CONSTRAINT unique_queue_position UNIQUE(workspace_id, queue_date, queue_order)
);

-- Create indexes for common queries
CREATE INDEX idx_founder_ops_queue_workspace ON founder_ops_queue(workspace_id);
CREATE INDEX idx_founder_ops_queue_task ON founder_ops_queue(task_id);
CREATE INDEX idx_founder_ops_queue_date ON founder_ops_queue(queue_date);
CREATE INDEX idx_founder_ops_queue_status ON founder_ops_queue(status);
CREATE INDEX idx_founder_ops_queue_paused ON founder_ops_queue(is_paused);
CREATE INDEX idx_founder_ops_queue_scheduled ON founder_ops_queue(scheduled_time);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_founder_ops_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_founder_ops_queue_updated_at
  BEFORE UPDATE ON founder_ops_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_founder_ops_queue_updated_at();

-- Enable Row Level Security
ALTER TABLE founder_ops_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Founder can do all operations
CREATE POLICY founder_ops_queue_founder_all_policy ON founder_ops_queue
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = founder_ops_queue.workspace_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = founder_ops_queue.workspace_id
    )
  );

-- RLS Policy: Service role can do all operations
CREATE POLICY founder_ops_queue_service_role_policy ON founder_ops_queue
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper function: Get daily queue
CREATE OR REPLACE FUNCTION get_founder_ops_daily_queue(
  p_workspace_id UUID,
  p_date DATE
)
RETURNS TABLE (
  id UUID,
  task_id UUID,
  queue_order INTEGER,
  scheduled_time TIMESTAMPTZ,
  estimated_duration_minutes INTEGER,
  is_paused BOOLEAN,
  status TEXT,
  task_title TEXT,
  task_brand TEXT,
  task_archetype TEXT,
  task_priority TEXT,
  task_channels TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.task_id,
    q.queue_order,
    q.scheduled_time,
    q.estimated_duration_minutes,
    q.is_paused,
    q.status,
    t.title as task_title,
    t.brand_slug as task_brand,
    t.archetype as task_archetype,
    t.priority as task_priority,
    t.channels as task_channels
  FROM founder_ops_queue q
  JOIN founder_ops_tasks t ON q.task_id = t.id
  WHERE q.workspace_id = p_workspace_id
  AND q.queue_date = p_date
  ORDER BY q.queue_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get weekly queue
CREATE OR REPLACE FUNCTION get_founder_ops_weekly_queue(
  p_workspace_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  queue_date DATE,
  id UUID,
  task_id UUID,
  queue_order INTEGER,
  scheduled_time TIMESTAMPTZ,
  estimated_duration_minutes INTEGER,
  is_paused BOOLEAN,
  status TEXT,
  task_title TEXT,
  task_brand TEXT,
  task_archetype TEXT,
  task_priority TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.queue_date,
    q.id,
    q.task_id,
    q.queue_order,
    q.scheduled_time,
    q.estimated_duration_minutes,
    q.is_paused,
    q.status,
    t.title as task_title,
    t.brand_slug as task_brand,
    t.archetype as task_archetype,
    t.priority as task_priority
  FROM founder_ops_queue q
  JOIN founder_ops_tasks t ON q.task_id = t.id
  WHERE q.workspace_id = p_workspace_id
  AND q.queue_date BETWEEN p_start_date AND p_end_date
  ORDER BY q.queue_date ASC, q.queue_order ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get queue status for a date
CREATE OR REPLACE FUNCTION get_queue_status(
  p_workspace_id UUID,
  p_date DATE
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'date', p_date,
    'status', CASE
      WHEN BOOL_OR(is_paused) THEN 'paused'
      WHEN COUNT(*) FILTER (WHERE status = 'completed') = COUNT(*) THEN 'completed'
      ELSE 'active'
    END,
    'is_paused', BOOL_OR(is_paused),
    'total_tasks', COUNT(*),
    'completed_tasks', COUNT(*) FILTER (WHERE status = 'completed'),
    'in_progress_tasks', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'pending_tasks', COUNT(*) FILTER (WHERE status = 'pending'),
    'total_duration_minutes', SUM(estimated_duration_minutes),
    'completed_duration_minutes', SUM(estimated_duration_minutes) FILTER (WHERE status = 'completed')
  ) INTO v_result
  FROM founder_ops_queue
  WHERE workspace_id = p_workspace_id
  AND queue_date = p_date;

  RETURN COALESCE(v_result, json_build_object(
    'date', p_date,
    'status', 'empty',
    'is_paused', false,
    'total_tasks', 0,
    'completed_tasks', 0,
    'in_progress_tasks', 0,
    'pending_tasks', 0,
    'total_duration_minutes', 0,
    'completed_duration_minutes', 0
  ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Pause queue
CREATE OR REPLACE FUNCTION pause_founder_ops_queue(
  p_workspace_id UUID,
  p_date DATE,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE founder_ops_queue
  SET
    is_paused = true,
    paused_at = NOW(),
    paused_by = p_user_id,
    paused_reason = p_reason
  WHERE workspace_id = p_workspace_id
  AND queue_date = p_date
  AND status = 'pending';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Resume queue
CREATE OR REPLACE FUNCTION resume_founder_ops_queue(
  p_workspace_id UUID,
  p_date DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE founder_ops_queue
  SET
    is_paused = false,
    paused_at = NULL,
    paused_by = NULL,
    paused_reason = NULL
  WHERE workspace_id = p_workspace_id
  AND queue_date = p_date
  AND is_paused = true;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Reorder queue
CREATE OR REPLACE FUNCTION reorder_founder_ops_queue(
  p_workspace_id UUID,
  p_date DATE,
  p_task_ids UUID[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_task_id UUID;
  v_order INTEGER := 1;
BEGIN
  -- Update queue order based on array position
  FOREACH v_task_id IN ARRAY p_task_ids
  LOOP
    UPDATE founder_ops_queue
    SET queue_order = v_order
    WHERE workspace_id = p_workspace_id
    AND queue_date = p_date
    AND task_id = v_task_id;

    v_order := v_order + 1;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE founder_ops_queue IS 'Stores daily and weekly task execution queues with scheduling and control capabilities';
COMMENT ON COLUMN founder_ops_queue.queue_date IS 'Date for which this task is queued';
COMMENT ON COLUMN founder_ops_queue.queue_order IS 'Execution order within the day (1, 2, 3, ...)';
COMMENT ON COLUMN founder_ops_queue.is_paused IS 'Whether the queue is paused (affects all pending tasks for the date)';
COMMENT ON COLUMN founder_ops_queue.scheduled_time IS 'Exact scheduled execution time (calculated from queue_order and duration)';
COMMENT ON COLUMN founder_ops_queue.estimated_duration_minutes IS 'Estimated task duration from task archetype';
