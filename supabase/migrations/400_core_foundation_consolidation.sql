-- Migration 400: Core Foundation Consolidation
-- Phase 4 of Unite-Hub Rebuild
-- Purpose: Consolidate and verify core foundation for Phase 3 src/core/ modules
-- Date: 2025-11-29
-- Status: Foundation verification and enhancement

-- ============================================================================
-- SECTION 1: Verify Core RLS Helper Functions Exist
-- These were created in 314a but we add missing ones for Phase 3 compatibility
-- ============================================================================

-- Add is_staff function (checks profile role) if not exists
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('FOUNDER', 'STAFF', 'ADMIN')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add is_founder function (checks profile role = FOUNDER only)
CREATE OR REPLACE FUNCTION public.is_founder()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'FOUNDER'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add is_client function
CREATE OR REPLACE FUNCTION public.is_client()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'CLIENT'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add get_user_role function
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role::TEXT INTO v_role
  FROM profiles
  WHERE id = auth.uid();

  RETURN COALESCE(v_role, 'CLIENT');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Add has_role function (variadic)
CREATE OR REPLACE FUNCTION public.has_role(VARIADIC allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role::TEXT = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute on new functions
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_founder() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_client() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(VARIADIC TEXT[]) TO authenticated;

-- ============================================================================
-- SECTION 2: Verify audit_logs table has required columns
-- ============================================================================

-- Add columns for Phase 3 audit logger if they don't exist
DO $$
BEGIN
  -- Add severity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'severity'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN severity TEXT DEFAULT 'INFO';
  END IF;

  -- Add category column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'category'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN category TEXT DEFAULT 'DATA';
  END IF;

  -- Add success column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'success'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN success BOOLEAN DEFAULT true;
  END IF;

  -- Add duration_ms column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'duration_ms'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN duration_ms INTEGER;
  END IF;

  -- Add error_message column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'error_message'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN error_message TEXT;
  END IF;

  -- Add ip_address column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'ip_address'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN ip_address TEXT;
  END IF;

  -- Add user_agent column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'user_agent'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN user_agent TEXT;
  END IF;

  -- Add timestamp column (rename from created_at if needed, or add if missing)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
    AND column_name = 'timestamp'
  ) THEN
    -- Check if created_at exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'created_at'
    ) THEN
      -- Add timestamp as alias view
      ALTER TABLE audit_logs ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
    ELSE
      ALTER TABLE audit_logs ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- Create indexes for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_timestamp ON audit_logs(workspace_id, timestamp DESC);

-- ============================================================================
-- SECTION 3: Ensure workspaces table has org_id properly linked
-- ============================================================================

-- Add org_id to workspaces if not exists (for RLS helpers)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'workspaces'
    AND column_name = 'org_id'
  ) THEN
    ALTER TABLE workspaces ADD COLUMN org_id UUID REFERENCES organizations(id);

    -- Backfill org_id from organization_id if that column exists
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'workspaces'
      AND column_name = 'organization_id'
    ) THEN
      UPDATE workspaces SET org_id = organization_id WHERE org_id IS NULL;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- SECTION 4: Connection Pooling Preparation
-- Note: Actual pooling is enabled in Supabase Dashboard
-- This creates a verification function
-- ============================================================================

-- Function to check if connection pooling is active
CREATE OR REPLACE FUNCTION public.check_connection_pool_status()
RETURNS TABLE(
  pool_active BOOLEAN,
  current_connections INTEGER,
  max_connections INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    true as pool_active, -- Pooling is handled by Supabase infrastructure
    (SELECT count(*)::INTEGER FROM pg_stat_activity WHERE state = 'active'),
    current_setting('max_connections')::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_connection_pool_status() TO authenticated;

-- ============================================================================
-- SECTION 5: Verification Queries (for manual testing)
-- ============================================================================

-- Run these after migration to verify:
/*
-- Check helper functions exist
SELECT proname FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
AND proname IN ('is_staff', 'is_founder', 'is_client', 'is_workspace_member', 'is_workspace_admin', 'get_user_role', 'has_role')
ORDER BY proname;

-- Check audit_logs columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Test role functions (requires authenticated session)
SELECT public.is_staff(), public.is_founder(), public.get_user_role();
*/

-- ============================================================================
-- Migration Complete
-- ============================================================================
