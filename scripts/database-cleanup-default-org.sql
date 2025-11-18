-- =====================================================
-- Database Cleanup: Remove "default-org" String Entries
-- Created: 2025-11-19
-- Purpose: Clean up corrupted test data with string "default-org" instead of UUID
-- Status: SAFE TO RUN (idempotent, only deletes invalid data)
-- =====================================================

-- This script removes bad data created during testing where "default-org" string
-- was used instead of proper UUIDs, causing "invalid input syntax for type uuid" errors

DO $$
DECLARE
  deleted_workspaces INT := 0;
  deleted_orgs INT := 0;
  deleted_contacts INT := 0;
  deleted_campaigns INT := 0;
BEGIN
  -- Start transaction for atomic cleanup

  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Starting database cleanup for "default-org" entries';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';

  -- =========================================
  -- 1. Delete from workspaces table
  -- =========================================
  DELETE FROM workspaces
  WHERE id::text = 'default-org' OR org_id::text = 'default-org';

  GET DIAGNOSTICS deleted_workspaces = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % workspace(s) with "default-org" ID', deleted_workspaces;

  -- =========================================
  -- 2. Delete from organizations table
  -- =========================================
  DELETE FROM organizations
  WHERE id::text = 'default-org';

  GET DIAGNOSTICS deleted_orgs = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % organization(s) with "default-org" ID', deleted_orgs;

  -- =========================================
  -- 3. Delete orphaned contacts
  -- =========================================
  -- Delete contacts that reference non-existent workspaces
  DELETE FROM contacts
  WHERE workspace_id::text = 'default-org'
     OR workspace_id NOT IN (SELECT id FROM workspaces);

  GET DIAGNOSTICS deleted_contacts = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % orphaned contact(s)', deleted_contacts;

  -- =========================================
  -- 4. Delete orphaned campaigns
  -- =========================================
  -- Delete campaigns that reference non-existent workspaces
  DELETE FROM campaigns
  WHERE workspace_id::text = 'default-org'
     OR workspace_id NOT IN (SELECT id FROM workspaces);

  GET DIAGNOSTICS deleted_campaigns = ROW_COUNT;
  RAISE NOTICE '✓ Deleted % orphaned campaign(s)', deleted_campaigns;

  -- =========================================
  -- Summary
  -- =========================================
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Cleanup Complete!';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Workspaces deleted: %', deleted_workspaces;
  RAISE NOTICE 'Organizations deleted: %', deleted_orgs;
  RAISE NOTICE 'Contacts deleted: %', deleted_contacts;
  RAISE NOTICE 'Campaigns deleted: %', deleted_campaigns;
  RAISE NOTICE '';

  IF deleted_workspaces + deleted_orgs + deleted_contacts + deleted_campaigns = 0 THEN
    RAISE NOTICE '✅ No "default-org" entries found - database is clean!';
  ELSE
    RAISE NOTICE '✅ Successfully removed all "default-org" corrupted data';
  END IF;

  RAISE NOTICE '==============================================';

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Cleanup failed: %', SQLERRM;
END $$;

-- =====================================================
-- Verification: Check for any remaining invalid UUIDs
-- =====================================================

DO $$
DECLARE
  invalid_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE 'Verifying cleanup...';

  -- Check for any remaining "default-org" strings
  SELECT COUNT(*) INTO invalid_count
  FROM (
    SELECT id FROM workspaces WHERE id::text = 'default-org'
    UNION ALL
    SELECT org_id FROM workspaces WHERE org_id::text = 'default-org'
    UNION ALL
    SELECT id FROM organizations WHERE id::text = 'default-org'
    UNION ALL
    SELECT workspace_id FROM contacts WHERE workspace_id::text = 'default-org'
    UNION ALL
    SELECT workspace_id FROM campaigns WHERE workspace_id::text = 'default-org'
  ) AS remaining;

  IF invalid_count = 0 THEN
    RAISE NOTICE '✅ VERIFICATION PASSED: No remaining "default-org" entries';
  ELSE
    RAISE WARNING '⚠️  VERIFICATION FAILED: Found % remaining "default-org" entries', invalid_count;
  END IF;

END $$;

-- =====================================================
-- DONE
-- =====================================================
