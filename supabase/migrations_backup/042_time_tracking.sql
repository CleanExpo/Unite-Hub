-- Migration 042: Time Tracking System
-- Phase 3 Step 8 - Universal Hours Tracking
--
-- Creates tables for:
-- - time_sessions: Active timer sessions (staff starts/stops timer)
-- - time_entries: Completed time records (manual or from sessions)
-- - time_approvals: Approval workflow for billing
--
-- Run this in Supabase SQL Editor

-- ============================================================================
-- TIME_SESSIONS TABLE (Active Timers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS time_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who is tracking time
  staff_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- What are they working on
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  task_id TEXT REFERENCES project_tasks(id) ON DELETE SET NULL,

  -- Session details
  description TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  stopped_at TIMESTAMPTZ,

  -- Calculated fields
  duration_seconds INTEGER, -- Calculated when stopped

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CHECK (stopped_at IS NULL OR stopped_at > started_at),
  CHECK (duration_seconds IS NULL OR duration_seconds > 0)
);

-- Indexes for time_sessions
CREATE INDEX IF NOT EXISTS idx_time_sessions_staff_id ON time_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_organization_id ON time_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_project_id ON time_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_task_id ON time_sessions(task_id);
CREATE INDEX IF NOT EXISTS idx_time_sessions_started_at ON time_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_time_sessions_active ON time_sessions(staff_id) WHERE stopped_at IS NULL;

-- ============================================================================
-- TIME_ENTRIES TABLE (Completed Time Records)
-- ============================================================================
CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who tracked the time
  staff_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- What they worked on
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  task_id TEXT REFERENCES project_tasks(id) ON DELETE SET NULL,

  -- Time details
  description TEXT NOT NULL,
  date DATE NOT NULL,
  hours DECIMAL(10, 2) NOT NULL CHECK (hours > 0 AND hours <= 24),

  -- Entry type
  entry_type TEXT NOT NULL CHECK (entry_type IN ('timer', 'manual')),
  session_id UUID REFERENCES time_sessions(id) ON DELETE SET NULL,

  -- Billing
  billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),

  -- Approval workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'billed')),
  approved_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  -- Xero integration
  xero_synced BOOLEAN DEFAULT false,
  xero_timesheet_id TEXT,
  xero_synced_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for time_entries
CREATE INDEX IF NOT EXISTS idx_time_entries_staff_id ON time_entries(staff_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_organization_id ON time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date DESC);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_billable ON time_entries(billable);
CREATE INDEX IF NOT EXISTS idx_time_entries_xero_synced ON time_entries(xero_synced);
CREATE INDEX IF NOT EXISTS idx_time_entries_session_id ON time_entries(session_id);

-- ============================================================================
-- TIME_APPROVALS TABLE (Approval History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS time_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  time_entry_id UUID NOT NULL REFERENCES time_entries(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Approval details
  status TEXT NOT NULL CHECK (status IN ('approved', 'rejected')),
  approved_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Optional notes
  notes TEXT,
  previous_status TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for time_approvals
CREATE INDEX IF NOT EXISTS idx_time_approvals_time_entry_id ON time_approvals(time_entry_id);
CREATE INDEX IF NOT EXISTS idx_time_approvals_organization_id ON time_approvals(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_approvals_approved_by ON time_approvals(approved_by);
CREATE INDEX IF NOT EXISTS idx_time_approvals_approved_at ON time_approvals(approved_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_approvals ENABLE ROW LEVEL SECURITY;

-- Time Sessions Policies
CREATE POLICY "Users can view sessions in their organization"
  ON time_sessions FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert own sessions"
  ON time_sessions FOR INSERT
  WITH CHECK (
    staff_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update own sessions"
  ON time_sessions FOR UPDATE
  USING (
    staff_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Time Entries Policies
CREATE POLICY "Users can view entries in their organization"
  ON time_entries FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert own entries"
  ON time_entries FOR INSERT
  WITH CHECK (
    staff_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update own pending entries"
  ON time_entries FOR UPDATE
  USING (
    staff_id = auth.uid()
    AND status = 'pending'
    AND organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update all entries"
  ON time_entries FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Time Approvals Policies
CREATE POLICY "Users can view approvals in their organization"
  ON time_approvals FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert approvals"
  ON time_approvals FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_time_sessions_updated_at
  BEFORE UPDATE ON time_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate total hours for a project
CREATE OR REPLACE FUNCTION get_project_total_hours(project_id_param TEXT)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(hours), 0)
  FROM time_entries
  WHERE project_id = project_id_param
    AND status IN ('approved', 'billed');
$$ LANGUAGE SQL STABLE;

-- Function to calculate total billable amount for a project
CREATE OR REPLACE FUNCTION get_project_billable_amount(project_id_param TEXT)
RETURNS DECIMAL AS $$
  SELECT COALESCE(SUM(total_amount), 0)
  FROM time_entries
  WHERE project_id = project_id_param
    AND billable = true
    AND status IN ('approved', 'billed');
$$ LANGUAGE SQL STABLE;

-- Function to get active session for a staff member
CREATE OR REPLACE FUNCTION get_active_session(staff_id_param UUID)
RETURNS UUID AS $$
  SELECT id
  FROM time_sessions
  WHERE staff_id = staff_id_param
    AND stopped_at IS NULL
  ORDER BY started_at DESC
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- VIEWS FOR REPORTING
-- ============================================================================

-- View: Daily time summary per staff
CREATE OR REPLACE VIEW daily_time_summary AS
SELECT
  staff_id,
  organization_id,
  date,
  COUNT(*) as entry_count,
  SUM(hours) as total_hours,
  SUM(CASE WHEN billable THEN hours ELSE 0 END) as billable_hours,
  SUM(total_amount) as total_amount,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count
FROM time_entries
GROUP BY staff_id, organization_id, date;

-- View: Project time summary
CREATE OR REPLACE VIEW project_time_summary AS
SELECT
  project_id,
  organization_id,
  COUNT(DISTINCT staff_id) as staff_count,
  COUNT(*) as entry_count,
  SUM(hours) as total_hours,
  SUM(CASE WHEN billable THEN hours ELSE 0 END) as billable_hours,
  SUM(total_amount) as total_amount,
  MIN(date) as first_entry_date,
  MAX(date) as last_entry_date
FROM time_entries
WHERE project_id IS NOT NULL
GROUP BY project_id, organization_id;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE time_sessions IS 'Active timer sessions - staff starts/stops timers';
COMMENT ON TABLE time_entries IS 'Completed time records - from timers or manual entry';
COMMENT ON TABLE time_approvals IS 'Approval history for time entries';

COMMENT ON COLUMN time_sessions.duration_seconds IS 'Calculated when session is stopped';
COMMENT ON COLUMN time_entries.entry_type IS 'timer (from session) or manual (direct entry)';
COMMENT ON COLUMN time_entries.status IS 'pending → approved → billed (or rejected)';
COMMENT ON COLUMN time_entries.xero_synced IS 'Whether entry has been synced to Xero';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Run this SQL in Supabase SQL Editor
-- After running, wait 1-5 minutes OR run: SELECT * FROM time_sessions LIMIT 1;
