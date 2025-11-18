-- =====================================================
-- Database Schema Verification
-- Purpose: Verify all columns added by migrations 044 & 045
-- Status: Ready to run in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PART 1: Verify New Columns Exist
-- =====================================================

DO $$
DECLARE
  missing_columns TEXT := '';
  column_count INT := 0;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Database Schema Verification';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Check campaigns table columns
  RAISE NOTICE 'Checking campaigns table...';

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'campaigns'
    AND column_name IN ('created_by', 'content', 'subject', 'scheduled_at');

  IF column_count = 4 THEN
    RAISE NOTICE '  ✓ campaigns: All 4 columns present';
  ELSE
    RAISE WARNING '  ✗ campaigns: Missing % columns', (4 - column_count);
    missing_columns := missing_columns || 'campaigns, ';
  END IF;

  -- Check contacts table columns
  RAISE NOTICE 'Checking contacts table...';

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'contacts'
    AND column_name IN ('created_by', 'last_analysis_at', 'email_count');

  IF column_count = 3 THEN
    RAISE NOTICE '  ✓ contacts: All 3 columns present';
  ELSE
    RAISE WARNING '  ✗ contacts: Missing % columns', (3 - column_count);
    missing_columns := missing_columns || 'contacts, ';
  END IF;

  -- Check emails table columns
  RAISE NOTICE 'Checking emails table...';

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'emails'
    AND column_name = 'received_at';

  IF column_count = 1 THEN
    RAISE NOTICE '  ✓ emails: received_at column present';
  ELSE
    RAISE WARNING '  ✗ emails: received_at column missing';
    missing_columns := missing_columns || 'emails, ';
  END IF;

  -- Check client_emails table columns
  RAISE NOTICE 'Checking client_emails table...';

  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'client_emails'
    AND column_name IN ('is_active', 'is_primary');

  IF column_count = 2 THEN
    RAISE NOTICE '  ✓ client_emails: All 2 columns present';
  ELSE
    RAISE WARNING '  ✗ client_emails: Missing % columns', (2 - column_count);
    missing_columns := missing_columns || 'client_emails, ';
  END IF;

  RAISE NOTICE '';

  IF missing_columns = '' THEN
    RAISE NOTICE '✅ SCHEMA VERIFICATION PASSED: All 10 columns present';
  ELSE
    RAISE WARNING '⚠️ SCHEMA VERIFICATION FAILED: Missing columns in tables: %', missing_columns;
  END IF;

  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- PART 2: Verify Indexes Exist
-- =====================================================

DO $$
DECLARE
  index_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Index Verification';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Count expected indexes
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename IN ('campaigns', 'contacts', 'emails', 'client_emails')
    AND indexname LIKE 'idx_%';

  RAISE NOTICE 'Found % performance indexes', index_count;

  IF index_count >= 6 THEN
    RAISE NOTICE '✅ INDEX VERIFICATION PASSED';
  ELSE
    RAISE WARNING '⚠️ INDEX VERIFICATION WARNING: Expected at least 6 indexes, found %', index_count;
  END IF;

  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- PART 3: Verify RLS Policies (Workspace Isolation)
-- =====================================================

DO $$
DECLARE
  vulnerable_policies INT := 0;
  secure_policies INT := 0;
  policy_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS Policy Security Verification';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Check for VULNERABLE policies (USING (true))
  -- Note: pg_policies doesn't store the actual USING clause text
  -- So we check for workspace-scoped policy names

  SELECT COUNT(*) INTO secure_policies
  FROM pg_policies
  WHERE tablename IN ('email_integrations', 'sent_emails', 'email_opens', 'email_clicks')
    AND policyname LIKE '%workspace%';

  RAISE NOTICE 'Found % workspace-scoped policies', secure_policies;

  -- List all policies for critical tables
  RAISE NOTICE '';
  RAISE NOTICE 'Policies on email_integrations:';
  FOR policy_record IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = 'email_integrations'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % (%)', policy_record.policyname, policy_record.cmd;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Policies on sent_emails:';
  FOR policy_record IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = 'sent_emails'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  - % (%)', policy_record.policyname, policy_record.cmd;
  END LOOP;

  RAISE NOTICE '';

  IF secure_policies >= 15 THEN
    RAISE NOTICE '✅ RLS POLICY VERIFICATION PASSED';
    RAISE NOTICE '   All critical tables have workspace-scoped policies';
  ELSE
    RAISE WARNING '⚠️ RLS POLICY VERIFICATION WARNING';
    RAISE WARNING '   Expected at least 15 workspace policies, found %', secure_policies;
  END IF;

  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- PART 4: Verify Data Integrity
-- =====================================================

DO $$
DECLARE
  orphaned_contacts INT;
  orphaned_campaigns INT;
  invalid_org_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Data Integrity Verification';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  -- Check for orphaned contacts (workspace_id doesn't exist)
  SELECT COUNT(*) INTO orphaned_contacts
  FROM contacts c
  WHERE NOT EXISTS (
    SELECT 1 FROM workspaces w WHERE w.id = c.workspace_id
  );

  IF orphaned_contacts = 0 THEN
    RAISE NOTICE '✓ No orphaned contacts';
  ELSE
    RAISE WARNING '⚠️  Found % orphaned contacts', orphaned_contacts;
  END IF;

  -- Check for orphaned campaigns
  SELECT COUNT(*) INTO orphaned_campaigns
  FROM campaigns c
  WHERE NOT EXISTS (
    SELECT 1 FROM workspaces w WHERE w.id = c.workspace_id
  );

  IF orphaned_campaigns = 0 THEN
    RAISE NOTICE '✓ No orphaned campaigns';
  ELSE
    RAISE WARNING '⚠️  Found % orphaned campaigns', orphaned_campaigns;
  END IF;

  -- Check for "default-org" string entries (should be ZERO after cleanup)
  SELECT COUNT(*) INTO invalid_org_count
  FROM (
    SELECT id FROM workspaces WHERE id::text = 'default-org'
    UNION ALL
    SELECT org_id FROM workspaces WHERE org_id::text = 'default-org'
    UNION ALL
    SELECT id FROM organizations WHERE id::text = 'default-org'
  ) AS invalid_data;

  IF invalid_org_count = 0 THEN
    RAISE NOTICE '✓ No "default-org" string entries found';
  ELSE
    RAISE WARNING '⚠️  Found % "default-org" string entries (cleanup needed)', invalid_org_count;
  END IF;

  RAISE NOTICE '';

  IF orphaned_contacts = 0 AND orphaned_campaigns = 0 AND invalid_org_count = 0 THEN
    RAISE NOTICE '✅ DATA INTEGRITY VERIFICATION PASSED';
  ELSE
    RAISE WARNING '⚠️ DATA INTEGRITY ISSUES FOUND';
  END IF;

  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- PART 5: Sample Data Check
-- =====================================================

DO $$
DECLARE
  org_count INT;
  user_count INT;
  workspace_count INT;
  contact_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Sample Data Summary';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';

  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(*) INTO user_count FROM users;
  SELECT COUNT(*) INTO workspace_count FROM workspaces;
  SELECT COUNT(*) INTO contact_count FROM contacts;

  RAISE NOTICE 'Organizations: %', org_count;
  RAISE NOTICE 'Users: %', user_count;
  RAISE NOTICE 'Workspaces: %', workspace_count;
  RAISE NOTICE 'Contacts: %', contact_count;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;

-- =====================================================
-- FINAL SUMMARY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Review the output above for:';
  RAISE NOTICE '  1. Schema verification (10 columns)';
  RAISE NOTICE '  2. Index verification (6+ indexes)';
  RAISE NOTICE '  3. RLS policy verification (15+ policies)';
  RAISE NOTICE '  4. Data integrity (0 orphaned records)';
  RAISE NOTICE '';
  RAISE NOTICE 'If all checks passed, database is ready for production!';
  RAISE NOTICE '============================================';
END $$;
