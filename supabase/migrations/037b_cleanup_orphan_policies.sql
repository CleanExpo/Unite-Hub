-- =====================================================
-- Cleanup Orphan Policies from Migration 003
-- =====================================================
-- Purpose: Remove RLS policies created for non-existent tables
-- Date: 2025-01-18
-- Issue: Migration 003 created policies for tables that don't exist yet
-- =====================================================

-- Drop policies for tables that don't exist yet
-- These will be recreated properly in Migration 038

DO $$
BEGIN
  -- Drop team_members policies (table doesn't exist)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'team_members') THEN
    DROP POLICY IF EXISTS "Users can view team members in their org" ON team_members;
    RAISE NOTICE 'Dropped orphan policy on team_members';
  END IF;

  -- Drop projects policies (will be recreated in 038)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects') THEN
    DROP POLICY IF EXISTS "Users can view projects in their org" ON projects;
    RAISE NOTICE 'Dropped old policy on projects';
  END IF;

  -- Drop approvals policies (table doesn't exist)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'approvals') THEN
    DROP POLICY IF EXISTS "Users can view approvals in their org" ON approvals;
    RAISE NOTICE 'Dropped orphan policy on approvals';
  END IF;

  RAISE NOTICE '✅ Cleanup complete - orphan policies removed';
END $$;
