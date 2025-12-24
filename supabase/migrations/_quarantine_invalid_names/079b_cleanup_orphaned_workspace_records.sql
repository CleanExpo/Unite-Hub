-- =====================================================
-- Migration: 079b_cleanup_orphaned_workspace_records.sql
-- Purpose: Clean up records with invalid workspace_id before adding FK constraints
-- Date: 2025-12-03
-- MUST run BEFORE 080_workspace_isolation_constraints.sql
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Identify orphaned records (for logging)
-- =====================================================

DO $$
DECLARE
  orphan_count INT;
BEGIN
  -- Count orphaned campaigns
  SELECT COUNT(*) INTO orphan_count
  FROM campaigns c
  LEFT JOIN workspaces w ON c.workspace_id = w.id
  WHERE w.id IS NULL AND c.workspace_id IS NOT NULL;
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % campaigns with invalid workspace_id - will be deleted', orphan_count;
  END IF;

  -- Count orphaned contacts
  SELECT COUNT(*) INTO orphan_count
  FROM contacts c
  LEFT JOIN workspaces w ON c.workspace_id = w.id
  WHERE w.id IS NULL AND c.workspace_id IS NOT NULL;
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % contacts with invalid workspace_id - will be deleted', orphan_count;
  END IF;

  -- Count orphaned emails
  SELECT COUNT(*) INTO orphan_count
  FROM emails e
  LEFT JOIN workspaces w ON e.workspace_id = w.id
  WHERE w.id IS NULL AND e.workspace_id IS NOT NULL;
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % emails with invalid workspace_id - will be deleted', orphan_count;
  END IF;

  -- Count orphaned drip_campaigns
  SELECT COUNT(*) INTO orphan_count
  FROM drip_campaigns d
  LEFT JOIN workspaces w ON d.workspace_id = w.id
  WHERE w.id IS NULL AND d.workspace_id IS NOT NULL;
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % drip_campaigns with invalid workspace_id - will be deleted', orphan_count;
  END IF;

  -- Count orphaned generated_content
  SELECT COUNT(*) INTO orphan_count
  FROM generated_content g
  LEFT JOIN workspaces w ON g.workspace_id = w.id
  WHERE w.id IS NULL AND g.workspace_id IS NOT NULL;
  IF orphan_count > 0 THEN
    RAISE NOTICE 'Found % generated_content with invalid workspace_id - will be deleted', orphan_count;
  END IF;
END $$;

-- =====================================================
-- STEP 2: Delete orphaned records (cascade will handle related)
-- =====================================================

-- Delete orphaned campaign_steps (via campaign)
DELETE FROM campaign_steps cs
WHERE cs.campaign_id IN (
  SELECT d.id FROM drip_campaigns d
  LEFT JOIN workspaces w ON d.workspace_id = w.id
  WHERE w.id IS NULL AND d.workspace_id IS NOT NULL
);

-- Delete orphaned campaign_enrollments (via campaign)
DELETE FROM campaign_enrollments ce
WHERE ce.campaign_id IN (
  SELECT d.id FROM drip_campaigns d
  LEFT JOIN workspaces w ON d.workspace_id = w.id
  WHERE w.id IS NULL AND d.workspace_id IS NOT NULL
);

-- Delete orphaned campaign_execution_logs (via campaign)
DELETE FROM campaign_execution_logs cel
WHERE cel.campaign_id IN (
  SELECT d.id FROM drip_campaigns d
  LEFT JOIN workspaces w ON d.workspace_id = w.id
  WHERE w.id IS NULL AND d.workspace_id IS NOT NULL
);

-- Delete orphaned drip_campaigns
DELETE FROM drip_campaigns d
WHERE d.workspace_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.id = d.workspace_id);

-- Delete orphaned campaigns
DELETE FROM campaigns c
WHERE c.workspace_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.id = c.workspace_id);

-- Delete orphaned emails
DELETE FROM emails e
WHERE e.workspace_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.id = e.workspace_id);

-- Delete orphaned contacts
DELETE FROM contacts c
WHERE c.workspace_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.id = c.workspace_id);

-- Delete orphaned generated_content
DELETE FROM generated_content g
WHERE g.workspace_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM workspaces w WHERE w.id = g.workspace_id);

-- =====================================================
-- STEP 3: Verify cleanup
-- =====================================================

DO $$
DECLARE
  remaining INT;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM (
    SELECT c.id FROM campaigns c LEFT JOIN workspaces w ON c.workspace_id = w.id WHERE w.id IS NULL AND c.workspace_id IS NOT NULL
    UNION ALL
    SELECT c.id FROM contacts c LEFT JOIN workspaces w ON c.workspace_id = w.id WHERE w.id IS NULL AND c.workspace_id IS NOT NULL
    UNION ALL
    SELECT e.id FROM emails e LEFT JOIN workspaces w ON e.workspace_id = w.id WHERE w.id IS NULL AND e.workspace_id IS NOT NULL
    UNION ALL
    SELECT d.id FROM drip_campaigns d LEFT JOIN workspaces w ON d.workspace_id = w.id WHERE w.id IS NULL AND d.workspace_id IS NOT NULL
  ) orphans;

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Cleanup failed: % orphaned records remain', remaining;
  ELSE
    RAISE NOTICE 'Cleanup complete - all orphaned records removed';
  END IF;
END $$;

COMMIT;
