-- ═══════════════════════════════════════════════════════════
-- Enhanced Audit Logs Migration
-- ═══════════════════════════════════════════════════════════
--
-- Purpose: Extend audit_logs table to support enhanced audit logging
--          from P3-2 security task
--
-- Changes:
--   1. Add columns for enhanced audit logging
--   2. Add indexes for common query patterns
--   3. Add RLS policies for secure access
--
-- Author: Backend System Architect
-- Date: 2025-12-03
-- Related: P3-2 Expanded Audit Logging
--
-- ═══════════════════════════════════════════════════════════

-- Add new columns to support enhanced audit logging
-- (only if they don't exist already)

DO $$
BEGIN
  -- Add user_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;

  -- Add email if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'email'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN email TEXT;
  END IF;

  -- Add workspace_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'workspace_id'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
  END IF;

  -- Add resource_type if not exists (may already exist as 'resource')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'resource_type'
  ) THEN
    -- If 'resource' column exists, rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'resource'
    ) THEN
      ALTER TABLE audit_logs RENAME COLUMN resource TO resource_type;
    ELSE
      ALTER TABLE audit_logs ADD COLUMN resource_type TEXT;
    END IF;
  END IF;

  -- Add metadata if not exists (may already exist as 'details')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'metadata'
  ) THEN
    -- If 'details' column exists, rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'details'
    ) THEN
      ALTER TABLE audit_logs RENAME COLUMN details TO metadata;
    ELSE
      ALTER TABLE audit_logs ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
  END IF;

  -- Add ip_address if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN ip_address TEXT;
  END IF;

  -- Add user_agent if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
  END IF;

  -- Add severity if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'severity'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN severity TEXT DEFAULT 'INFO' CHECK (severity IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'));
  END IF;

  -- Add success if not exists (may already exist as 'status')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'success'
  ) THEN
    -- If 'status' column exists, add success and derive from status
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audit_logs' AND column_name = 'status'
    ) THEN
      ALTER TABLE audit_logs ADD COLUMN success BOOLEAN DEFAULT TRUE;
      -- Update existing rows: success = true if status = 'success'
      UPDATE audit_logs SET success = (status = 'success');
    ELSE
      ALTER TABLE audit_logs ADD COLUMN success BOOLEAN DEFAULT TRUE;
    END IF;
  END IF;

  -- Add duration_ms if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs' AND column_name = 'duration_ms'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN duration_ms INTEGER;
  END IF;

END $$;

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

-- Compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_action ON audit_logs(workspace_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_created ON audit_logs(severity, created_at DESC) WHERE severity IN ('ERROR', 'CRITICAL');

-- Add comments for documentation
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.email IS 'Email of user who performed the action (for deleted users)';
COMMENT ON COLUMN audit_logs.workspace_id IS 'Workspace context for the action';
COMMENT ON COLUMN audit_logs.resource_type IS 'Type of resource affected (e.g., user, contact, workspace)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the specific resource affected';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional metadata about the action (JSON)';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string from the request';
COMMENT ON COLUMN audit_logs.severity IS 'Severity level: DEBUG, INFO, WARN, ERROR, CRITICAL';
COMMENT ON COLUMN audit_logs.success IS 'Whether the action succeeded';
COMMENT ON COLUMN audit_logs.error_message IS 'Error message if action failed';
COMMENT ON COLUMN audit_logs.duration_ms IS 'Duration of the operation in milliseconds';

-- ═══════════════════════════════════════════════════════════
-- Row Level Security (RLS) Policies
-- ═══════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    auth.uid() = user_id
  );

-- Policy: Users can view audit logs for their workspaces
CREATE POLICY "Users can view workspace audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id
      FROM user_organizations
      WHERE user_id = auth.uid()
    )
  );

-- Policy: Admins can view all audit logs in their organization
CREATE POLICY "Admins can view all org audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_organizations uo
      WHERE uo.user_id = auth.uid()
        AND uo.org_id = audit_logs.org_id
        AND uo.role IN ('owner', 'admin')
    )
  );

-- Policy: System can insert audit logs (service role)
CREATE POLICY "System can insert audit logs"
  ON audit_logs
  FOR INSERT
  WITH CHECK (
    -- Allow service role to insert
    auth.jwt() ->> 'role' = 'service_role'
    OR
    -- Allow authenticated users to insert their own logs
    auth.uid() = user_id
  );

-- Policy: No one can update or delete audit logs (immutable)
-- (Audit logs should never be modified after creation)

-- ═══════════════════════════════════════════════════════════
-- Helper Functions
-- ═══════════════════════════════════════════════════════════

-- Function to clean up old audit logs (retention policy)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete audit logs older than retention period
  -- Keep ERROR and CRITICAL logs longer (2x retention)
  DELETE FROM audit_logs
  WHERE (
    created_at < NOW() - (retention_days || ' days')::INTERVAL
    AND severity NOT IN ('ERROR', 'CRITICAL')
  )
  OR (
    created_at < NOW() - (retention_days * 2 || ' days')::INTERVAL
    AND severity IN ('ERROR', 'CRITICAL')
  );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION cleanup_old_audit_logs IS 'Clean up audit logs older than retention period. ERROR/CRITICAL logs kept 2x longer.';

-- Function to get audit log statistics
CREATE OR REPLACE FUNCTION get_audit_log_stats(
  p_workspace_id UUID DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_events BIGINT,
  by_severity JSON,
  by_action JSON,
  by_resource_type JSON,
  success_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) as total_events,

    jsonb_object_agg(
      severity,
      severity_count
    ) as by_severity,

    jsonb_object_agg(
      action,
      action_count
    ) as by_action,

    jsonb_object_agg(
      resource_type,
      resource_count
    ) as by_resource_type,

    ROUND(
      (COUNT(*) FILTER (WHERE success = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) as success_rate

  FROM (
    SELECT
      severity,
      action,
      resource_type,
      success,
      COUNT(*) OVER (PARTITION BY severity) as severity_count,
      COUNT(*) OVER (PARTITION BY action) as action_count,
      COUNT(*) OVER (PARTITION BY resource_type) as resource_count
    FROM audit_logs
    WHERE created_at >= NOW() - (p_days || ' days')::INTERVAL
      AND (p_workspace_id IS NULL OR workspace_id = p_workspace_id)
      AND (p_user_id IS NULL OR user_id = p_user_id)
  ) stats
  GROUP BY severity_count, action_count, resource_count;
END;
$$;

COMMENT ON FUNCTION get_audit_log_stats IS 'Get audit log statistics for workspace/user over time period';

-- ═══════════════════════════════════════════════════════════
-- Migration Verification
-- ═══════════════════════════════════════════════════════════

-- Verify all columns exist
DO $$
DECLARE
  missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Check for expected columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'user_id') THEN
    missing_columns := array_append(missing_columns, 'user_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'workspace_id') THEN
    missing_columns := array_append(missing_columns, 'workspace_id');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'severity') THEN
    missing_columns := array_append(missing_columns, 'severity');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name = 'success') THEN
    missing_columns := array_append(missing_columns, 'success');
  END IF;

  IF array_length(missing_columns, 1) > 0 THEN
    RAISE EXCEPTION 'Migration incomplete. Missing columns: %', array_to_string(missing_columns, ', ');
  ELSE
    RAISE NOTICE 'Migration completed successfully. All columns present.';
  END IF;
END $$;

-- Print summary
DO $$
BEGIN
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     Enhanced Audit Logs Migration Complete               ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE 'Added columns:';
  RAISE NOTICE '  ✓ user_id (UUID)';
  RAISE NOTICE '  ✓ email (TEXT)';
  RAISE NOTICE '  ✓ workspace_id (UUID)';
  RAISE NOTICE '  ✓ resource_type (TEXT)';
  RAISE NOTICE '  ✓ metadata (JSONB)';
  RAISE NOTICE '  ✓ ip_address (TEXT)';
  RAISE NOTICE '  ✓ user_agent (TEXT)';
  RAISE NOTICE '  ✓ severity (TEXT)';
  RAISE NOTICE '  ✓ success (BOOLEAN)';
  RAISE NOTICE '  ✓ duration_ms (INTEGER)';
  RAISE NOTICE '';
  RAISE NOTICE 'Added indexes:';
  RAISE NOTICE '  ✓ idx_audit_logs_user_id';
  RAISE NOTICE '  ✓ idx_audit_logs_workspace_id';
  RAISE NOTICE '  ✓ idx_audit_logs_action';
  RAISE NOTICE '  ✓ idx_audit_logs_severity';
  RAISE NOTICE '  ✓ idx_audit_logs_success';
  RAISE NOTICE '  ✓ idx_audit_logs_resource_type';
  RAISE NOTICE '  ✓ idx_audit_logs_user_action';
  RAISE NOTICE '  ✓ idx_audit_logs_workspace_action';
  RAISE NOTICE '  ✓ idx_audit_logs_severity_created';
  RAISE NOTICE '';
  RAISE NOTICE 'Added RLS policies:';
  RAISE NOTICE '  ✓ Users can view their own audit logs';
  RAISE NOTICE '  ✓ Users can view workspace audit logs';
  RAISE NOTICE '  ✓ Admins can view all org audit logs';
  RAISE NOTICE '  ✓ System can insert audit logs';
  RAISE NOTICE '';
  RAISE NOTICE 'Added helper functions:';
  RAISE NOTICE '  ✓ cleanup_old_audit_logs(retention_days)';
  RAISE NOTICE '  ✓ get_audit_log_stats(workspace_id, user_id, days)';
  RAISE NOTICE '';
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE '';
END $$;
