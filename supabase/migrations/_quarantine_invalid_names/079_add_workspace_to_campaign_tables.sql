-- =====================================================
-- Migration: 079_add_workspace_to_campaign_tables.sql
-- Purpose: Add workspace_id columns to campaign-related tables
-- Date: 2025-12-03
-- Risk: LOW (additive change with safe backfill)
-- =====================================================
--
-- PREREQUISITE for 080_workspace_isolation_constraints.sql
--
-- This migration adds workspace_id columns to tables that currently
-- inherit workspace scope through FK relationships. Adding direct
-- workspace_id enables:
-- 1. Direct workspace filtering without JOINs
-- 2. Stronger database-level isolation
-- 3. Consistent pattern with other workspace-scoped tables
--
-- Tables affected:
-- - campaign_steps (currently has campaign_id FK to drip_campaigns)
-- - campaign_enrollments (currently has campaign_id FK)
-- - campaign_execution_logs (currently has campaign_id FK)
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Add workspace_id columns (nullable for backfill)
-- =====================================================

-- Add to campaign_steps
ALTER TABLE campaign_steps
  ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Add to campaign_enrollments
ALTER TABLE campaign_enrollments
  ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Add to campaign_execution_logs
ALTER TABLE campaign_execution_logs
  ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- =====================================================
-- STEP 2: Backfill workspace_id from parent drip_campaigns
-- =====================================================

-- Backfill campaign_steps
UPDATE campaign_steps cs
SET workspace_id = dc.workspace_id
FROM drip_campaigns dc
WHERE cs.campaign_id = dc.id
  AND cs.workspace_id IS NULL;

-- Backfill campaign_enrollments
UPDATE campaign_enrollments ce
SET workspace_id = dc.workspace_id
FROM drip_campaigns dc
WHERE ce.campaign_id = dc.id
  AND ce.workspace_id IS NULL;

-- Backfill campaign_execution_logs
UPDATE campaign_execution_logs cel
SET workspace_id = dc.workspace_id
FROM drip_campaigns dc
WHERE cel.campaign_id = dc.id
  AND cel.workspace_id IS NULL;

-- =====================================================
-- STEP 3: Create indexes for workspace filtering
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_campaign_steps_workspace_id
  ON campaign_steps(workspace_id);

CREATE INDEX IF NOT EXISTS idx_campaign_enrollments_workspace_id
  ON campaign_enrollments(workspace_id);

CREATE INDEX IF NOT EXISTS idx_campaign_execution_logs_workspace_id
  ON campaign_execution_logs(workspace_id);

-- =====================================================
-- STEP 4: Verify backfill success
-- =====================================================

DO $$
DECLARE
  null_steps INT;
  null_enrollments INT;
  null_logs INT;
  total_steps INT;
  total_enrollments INT;
  total_logs INT;
BEGIN
  -- Count totals
  SELECT COUNT(*) INTO total_steps FROM campaign_steps;
  SELECT COUNT(*) INTO total_enrollments FROM campaign_enrollments;
  SELECT COUNT(*) INTO total_logs FROM campaign_execution_logs;

  -- Count NULLs
  SELECT COUNT(*) INTO null_steps FROM campaign_steps WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO null_enrollments FROM campaign_enrollments WHERE workspace_id IS NULL;
  SELECT COUNT(*) INTO null_logs FROM campaign_execution_logs WHERE workspace_id IS NULL;

  -- Report status
  RAISE NOTICE 'campaign_steps: % total, % with NULL workspace_id', total_steps, null_steps;
  RAISE NOTICE 'campaign_enrollments: % total, % with NULL workspace_id', total_enrollments, null_enrollments;
  RAISE NOTICE 'campaign_execution_logs: % total, % with NULL workspace_id', total_logs, null_logs;

  -- Only fail if there are existing rows that couldn't be backfilled
  -- Empty tables are OK (NULL is allowed until 080 adds NOT NULL constraint)
  IF null_steps > 0 AND total_steps > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % campaign_steps rows have NULL workspace_id. Check for orphan records where campaign_id does not exist in drip_campaigns.', null_steps;
  END IF;

  IF null_enrollments > 0 AND total_enrollments > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % campaign_enrollments rows have NULL workspace_id. Check for orphan records where campaign_id does not exist in drip_campaigns.', null_enrollments;
  END IF;

  IF null_logs > 0 AND total_logs > 0 THEN
    RAISE EXCEPTION 'Backfill incomplete: % campaign_execution_logs rows have NULL workspace_id. Check for orphan records where campaign_id does not exist in drip_campaigns.', null_logs;
  END IF;

  RAISE NOTICE 'Backfill completed successfully. Ready for migration 080.';
END $$;

COMMIT;

-- =====================================================
-- Post-Migration Verification Queries
-- =====================================================
-- Run these after the migration to verify success:
--
-- 1. Check column existence:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('campaign_steps', 'campaign_enrollments', 'campaign_execution_logs')
--   AND column_name = 'workspace_id';
--
-- 2. Check counts:
-- SELECT 'campaign_steps' as tbl, COUNT(*) as total, COUNT(workspace_id) as with_ws
-- FROM campaign_steps
-- UNION ALL
-- SELECT 'campaign_enrollments', COUNT(*), COUNT(workspace_id) FROM campaign_enrollments
-- UNION ALL
-- SELECT 'campaign_execution_logs', COUNT(*), COUNT(workspace_id) FROM campaign_execution_logs;
--
-- 3. Check indexes:
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename IN ('campaign_steps', 'campaign_enrollments', 'campaign_execution_logs')
--   AND indexname LIKE '%workspace_id%';

-- =====================================================
-- Rollback Plan (if needed)
-- =====================================================
-- To rollback this migration:
--
-- DROP INDEX IF EXISTS idx_campaign_steps_workspace_id;
-- DROP INDEX IF EXISTS idx_campaign_enrollments_workspace_id;
-- DROP INDEX IF EXISTS idx_campaign_execution_logs_workspace_id;
--
-- ALTER TABLE campaign_steps DROP COLUMN IF EXISTS workspace_id;
-- ALTER TABLE campaign_enrollments DROP COLUMN IF EXISTS workspace_id;
-- ALTER TABLE campaign_execution_logs DROP COLUMN IF EXISTS workspace_id;
