-- Migration 150: Founder Ops Archive Bridge
-- Creates helper tables and functions for Living Intelligence Archive integration.
-- Provides complete audit trail for all Founder Ops Hub activities.

-- Drop existing table if exists (for development)
DROP TABLE IF EXISTS founder_ops_archive_entries CASCADE;

-- Create founder_ops_archive_entries table
CREATE TABLE founder_ops_archive_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL CHECK (entry_type IN (
    'task_created',
    'task_updated',
    'task_executed',
    'task_approved',
    'task_rejected',
    'task_completed',
    'task_deleted',
    'status_changed',
    'queue_paused',
    'queue_resumed'
  )),
  task_id UUID REFERENCES founder_ops_tasks(id) ON DELETE SET NULL,
  brand_slug TEXT,
  archetype TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID REFERENCES user_profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_brand_slug CHECK (brand_slug IS NULL OR brand_slug IN (
    'disaster-recovery',
    'synthex',
    'unite-group',
    'carsi',
    'nrpg'
  ))
);

-- Create indexes for common queries
CREATE INDEX idx_founder_ops_archive_workspace ON founder_ops_archive_entries(workspace_id);
CREATE INDEX idx_founder_ops_archive_entry_type ON founder_ops_archive_entries(entry_type);
CREATE INDEX idx_founder_ops_archive_task ON founder_ops_archive_entries(task_id);
CREATE INDEX idx_founder_ops_archive_brand ON founder_ops_archive_entries(brand_slug);
CREATE INDEX idx_founder_ops_archive_timestamp ON founder_ops_archive_entries(timestamp);
CREATE INDEX idx_founder_ops_archive_user ON founder_ops_archive_entries(user_id);

-- Enable Row Level Security
ALTER TABLE founder_ops_archive_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Founder can read all archive entries for their workspace
CREATE POLICY founder_ops_archive_founder_read_policy ON founder_ops_archive_entries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'founder'
      AND user_profiles.workspace_id = founder_ops_archive_entries.workspace_id
    )
  );

-- RLS Policy: Service role can do all operations
CREATE POLICY founder_ops_archive_service_role_policy ON founder_ops_archive_entries
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Helper function: Log archive entry
CREATE OR REPLACE FUNCTION log_founder_ops_archive_entry(
  p_workspace_id UUID,
  p_entry_type TEXT,
  p_task_id UUID,
  p_brand_slug TEXT,
  p_archetype TEXT,
  p_user_id UUID,
  p_metadata JSONB
)
RETURNS UUID AS $$
DECLARE
  v_entry_id UUID;
BEGIN
  INSERT INTO founder_ops_archive_entries (
    workspace_id,
    entry_type,
    task_id,
    brand_slug,
    archetype,
    user_id,
    metadata
  ) VALUES (
    p_workspace_id,
    p_entry_type,
    p_task_id,
    p_brand_slug,
    p_archetype,
    p_user_id,
    p_metadata
  )
  RETURNING id INTO v_entry_id;

  RETURN v_entry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get task history
CREATE OR REPLACE FUNCTION get_founder_ops_task_history(
  p_workspace_id UUID,
  p_task_id UUID
)
RETURNS TABLE (
  id UUID,
  entry_type TEXT,
  timestamp TIMESTAMPTZ,
  user_id UUID,
  user_email TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.entry_type,
    a.timestamp,
    a.user_id,
    u.email as user_email,
    a.metadata
  FROM founder_ops_archive_entries a
  LEFT JOIN user_profiles u ON a.user_id = u.id
  WHERE a.workspace_id = p_workspace_id
  AND a.task_id = p_task_id
  ORDER BY a.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get brand activity history
CREATE OR REPLACE FUNCTION get_founder_ops_brand_history(
  p_workspace_id UUID,
  p_brand_slug TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  entry_type TEXT,
  task_id UUID,
  task_title TEXT,
  archetype TEXT,
  timestamp TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id,
    a.entry_type,
    a.task_id,
    t.title as task_title,
    a.archetype,
    a.timestamp,
    a.metadata
  FROM founder_ops_archive_entries a
  LEFT JOIN founder_ops_tasks t ON a.task_id = t.id
  WHERE a.workspace_id = p_workspace_id
  AND a.brand_slug = p_brand_slug
  ORDER BY a.timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get archive statistics
CREATE OR REPLACE FUNCTION get_founder_ops_archive_stats(
  p_workspace_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'total_entries', COUNT(*),
    'by_entry_type', json_object_agg(
      entry_type,
      type_count
    ),
    'by_brand', json_object_agg(
      COALESCE(brand_slug, 'unknown'),
      brand_count
    ),
    'date_range', json_build_object(
      'earliest', MIN(timestamp),
      'latest', MAX(timestamp)
    )
  ) INTO v_result
  FROM (
    SELECT
      entry_type,
      brand_slug,
      timestamp,
      COUNT(*) OVER (PARTITION BY entry_type) as type_count,
      COUNT(*) OVER (PARTITION BY brand_slug) as brand_count
    FROM founder_ops_archive_entries
    WHERE workspace_id = p_workspace_id
  ) t;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get brand activity summary
CREATE OR REPLACE FUNCTION get_brand_activity_summary(
  p_workspace_id UUID,
  p_brand_slug TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'brand_slug', p_brand_slug,
    'date_range', json_build_object(
      'start', p_start_date,
      'end', p_end_date
    ),
    'total_tasks', COUNT(DISTINCT task_id),
    'tasks_created', COUNT(*) FILTER (WHERE entry_type = 'task_created'),
    'tasks_completed', COUNT(*) FILTER (WHERE entry_type = 'task_completed'),
    'tasks_approved', COUNT(*) FILTER (WHERE entry_type = 'task_approved'),
    'tasks_rejected', COUNT(*) FILTER (WHERE entry_type = 'task_rejected'),
    'total_execution_time_ms', SUM(
      CASE
        WHEN entry_type = 'task_executed'
        THEN (metadata->>'execution_time_ms')::INTEGER
        ELSE 0
      END
    ),
    'average_execution_time_ms', AVG(
      CASE
        WHEN entry_type = 'task_executed'
        THEN (metadata->>'execution_time_ms')::INTEGER
        ELSE NULL
      END
    )
  ) INTO v_result
  FROM founder_ops_archive_entries
  WHERE workspace_id = p_workspace_id
  AND brand_slug = p_brand_slug
  AND timestamp BETWEEN p_start_date AND p_end_date;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-log task creation
CREATE OR REPLACE FUNCTION trigger_log_task_created()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_founder_ops_archive_entry(
    NEW.workspace_id,
    'task_created',
    NEW.id,
    NEW.brand_slug,
    NEW.archetype,
    NEW.created_by,
    json_build_object(
      'task_title', NEW.title,
      'task_priority', NEW.priority,
      'task_status', NEW.status
    )::JSONB
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_founder_ops_tasks_created
  AFTER INSERT ON founder_ops_tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_task_created();

-- Trigger: Auto-log status changes
CREATE OR REPLACE FUNCTION trigger_log_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM log_founder_ops_archive_entry(
      NEW.workspace_id,
      'status_changed',
      NEW.id,
      NEW.brand_slug,
      NEW.archetype,
      auth.uid(),
      json_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'task_title', NEW.title
      )::JSONB
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_founder_ops_tasks_status_changed
  AFTER UPDATE ON founder_ops_tasks
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_status_changed();

-- Comments for documentation
COMMENT ON TABLE founder_ops_archive_entries IS 'Living Intelligence Archive entries for all Founder Ops Hub activities';
COMMENT ON COLUMN founder_ops_archive_entries.entry_type IS 'Type of archive entry (task_created, task_executed, etc.)';
COMMENT ON COLUMN founder_ops_archive_entries.metadata IS 'Additional context including execution results, changes, notes, etc.';
COMMENT ON FUNCTION log_founder_ops_archive_entry IS 'Logs an archive entry with all required context';
COMMENT ON FUNCTION get_founder_ops_task_history IS 'Returns complete history for a specific task';
COMMENT ON FUNCTION get_brand_activity_summary IS 'Returns activity summary for a brand within a date range';
