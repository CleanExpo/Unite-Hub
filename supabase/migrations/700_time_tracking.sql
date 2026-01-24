-- Migration 700: Time Tracking Module
-- Purpose: Task-level time tracking for projects
-- Date: 2026-01-24

-- ============================================================================
-- SECTION 1: Time Entries Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID, -- Reference to project_tasks if exists
  user_id UUID NOT NULL,

  -- Time tracking
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER, -- Calculated or manual entry

  -- Metadata
  description TEXT,
  billable BOOLEAN NOT NULL DEFAULT true,
  hourly_rate NUMERIC(10,2), -- Optional override rate
  tags TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  CONSTRAINT valid_time_range CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_entries_workspace ON time_entries(workspace_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_started ON time_entries(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries(billable);

COMMENT ON TABLE time_entries IS 'Time tracking entries for tasks and projects';
COMMENT ON COLUMN time_entries.duration_minutes IS 'Duration in minutes - calculated from started_at/ended_at or manually entered';
COMMENT ON COLUMN time_entries.billable IS 'Whether this time is billable to the client';

-- ============================================================================
-- SECTION 2: Active Timers Table (for live tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS active_timers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  task_id UUID,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One active timer per user per workspace
  CONSTRAINT unique_active_timer UNIQUE(workspace_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_active_timers_workspace ON active_timers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_active_timers_user ON active_timers(user_id);

COMMENT ON TABLE active_timers IS 'Currently running timers - only one per user per workspace';

-- ============================================================================
-- SECTION 3: Time Summary View
-- ============================================================================

CREATE OR REPLACE VIEW time_summary AS
SELECT
  workspace_id,
  project_id,
  user_id,
  DATE(started_at) as entry_date,
  SUM(duration_minutes) as total_minutes,
  COUNT(*) as entry_count,
  SUM(CASE WHEN billable THEN duration_minutes ELSE 0 END) as billable_minutes
FROM time_entries
WHERE duration_minutes IS NOT NULL
GROUP BY workspace_id, project_id, user_id, DATE(started_at);

COMMENT ON VIEW time_summary IS 'Daily time summary aggregated by workspace, project, and user';

-- ============================================================================
-- SECTION 4: Helper Functions
-- ============================================================================

-- Function: Calculate duration when stopping timer
CREATE OR REPLACE FUNCTION calculate_time_entry_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ended_at IS NOT NULL AND NEW.duration_minutes IS NULL THEN
    NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at)) / 60;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_duration ON time_entries;
CREATE TRIGGER trigger_calculate_duration
  BEFORE INSERT OR UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION calculate_time_entry_duration();

-- Function: Get user's total time for period
CREATE OR REPLACE FUNCTION get_user_time_summary(
  p_workspace_id UUID,
  p_user_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  total_hours NUMERIC,
  billable_hours NUMERIC,
  entry_count BIGINT,
  projects_worked BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(COALESCE(SUM(duration_minutes), 0) / 60.0, 2) as total_hours,
    ROUND(COALESCE(SUM(CASE WHEN billable THEN duration_minutes ELSE 0 END), 0) / 60.0, 2) as billable_hours,
    COUNT(*) as entry_count,
    COUNT(DISTINCT project_id) as projects_worked
  FROM time_entries
  WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id
    AND DATE(started_at) BETWEEN p_start_date AND p_end_date
    AND duration_minutes IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_user_time_summary(UUID, UUID, DATE, DATE) TO authenticated;

-- ============================================================================
-- SECTION 5: Row Level Security
-- ============================================================================

ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_timers ENABLE ROW LEVEL SECURITY;

-- Time entries policies
DROP POLICY IF EXISTS "time_entries_select" ON time_entries;
CREATE POLICY "time_entries_select" ON time_entries
  FOR SELECT TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "time_entries_insert" ON time_entries;
CREATE POLICY "time_entries_insert" ON time_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    workspace_id IN (
      SELECT id FROM workspaces WHERE owner_id = auth.uid()
      UNION
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "time_entries_update" ON time_entries;
CREATE POLICY "time_entries_update" ON time_entries
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "time_entries_delete" ON time_entries;
CREATE POLICY "time_entries_delete" ON time_entries
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Active timers policies
DROP POLICY IF EXISTS "active_timers_select" ON active_timers;
CREATE POLICY "active_timers_select" ON active_timers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "active_timers_insert" ON active_timers;
CREATE POLICY "active_timers_insert" ON active_timers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "active_timers_delete" ON active_timers;
CREATE POLICY "active_timers_delete" ON active_timers
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 6: Updated At Trigger
-- ============================================================================

DROP TRIGGER IF EXISTS set_updated_at_time_entries ON time_entries;
CREATE TRIGGER set_updated_at_time_entries
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================================
-- Migration Complete
-- ============================================================================
