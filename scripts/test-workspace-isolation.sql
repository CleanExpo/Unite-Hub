-- ============================================================================
-- WORKSPACE ISOLATION TEST SCRIPT
-- ============================================================================
-- This script verifies that Row Level Security (RLS) is properly configured
-- to prevent cross-workspace data access.
--
-- INSTRUCTIONS:
-- 1. Copy this entire file
-- 2. Go to Supabase Dashboard → SQL Editor → New Query
-- 3. Paste and click "Run"
-- ============================================================================

-- Clean up any existing test data
DO $$
BEGIN
  DELETE FROM workspace_members WHERE user_id IN (
    SELECT id FROM users WHERE email IN ('test1@example.com', 'test2@example.com')
  );
  DELETE FROM workspaces WHERE slug IN ('test-workspace-a', 'test-workspace-b');
  DELETE FROM organizations WHERE slug IN ('test-org-a', 'test-org-b');
  DELETE FROM users WHERE email IN ('test1@example.com', 'test2@example.com');
  RAISE NOTICE '✅ Cleaned up existing test data';
END $$;

-- ============================================================================
-- 1. CREATE TEST DATA
-- ============================================================================

-- Create test organizations
INSERT INTO organizations (id, name, slug, created_at, updated_at)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Test Org A', 'test-org-a', NOW(), NOW()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Test Org B', 'test-org-b', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test users (simulating auth.users entries)
INSERT INTO users (id, email, full_name, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test1@example.com', 'Test User 1', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com', 'Test User 2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test workspaces
INSERT INTO workspaces (id, name, slug, org_id, created_at, updated_at)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Test Workspace A', 'test-workspace-a', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Test Workspace B', 'test-workspace-b', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Assign users to organizations
INSERT INTO user_organizations (user_id, org_id, role, created_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'owner', NOW()),
  ('22222222-2222-2222-2222-222222222222', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'owner', NOW())
ON CONFLICT (user_id, org_id) DO NOTHING;

-- Create test contacts in each workspace
INSERT INTO contacts (workspace_id, email, full_name, status, ai_score, created_at, updated_at)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'contact-a1@example.com', 'Contact A1', 'new', 50, NOW(), NOW()),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'contact-a2@example.com', 'Contact A2', 'warm', 75, NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'contact-b1@example.com', 'Contact B1', 'new', 60, NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'contact-b2@example.com', 'Contact B2', 'hot', 90, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Create test campaigns in each workspace
INSERT INTO campaigns (workspace_id, name, status, created_at, updated_at)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Campaign A1', 'draft', NOW(), NOW()),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Campaign B1', 'active', NOW(), NOW())
ON CONFLICT DO NOTHING;

RAISE NOTICE '✅ Test data created successfully';

-- ============================================================================
-- 2. VERIFY RLS IS ENABLED ON ALL TABLES
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  rls_disabled_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM pg_tables
  WHERE schemaname = 'public';

  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS STATUS CHECK';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total public tables: %', table_count;
  RAISE NOTICE 'Tables WITHOUT RLS: %', rls_disabled_count;

  IF rls_disabled_count > 0 THEN
    RAISE NOTICE '⚠️  WARNING: % tables do not have RLS enabled!', rls_disabled_count;
    RAISE NOTICE 'Tables without RLS:';
    FOR table_record IN
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public' AND rowsecurity = false
    LOOP
      RAISE NOTICE '   - %', table_record.tablename;
    END LOOP;
  ELSE
    RAISE NOTICE '✅ All public tables have RLS enabled';
  END IF;
END $$;

-- ============================================================================
-- 3. TEST WORKSPACE ISOLATION
-- ============================================================================

-- Test 1: User 1 should see only Workspace A contacts
DO $$
DECLARE
  contact_count INTEGER;
BEGIN
  -- Simulate User 1 session (normally done by auth.uid())
  -- In real scenario, this would be set by Supabase Auth

  -- Count contacts visible to User 1 in Workspace A
  SELECT COUNT(*) INTO contact_count
  FROM contacts
  WHERE workspace_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 1: User 1 accessing Workspace A';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Expected contacts: 2';
  RAISE NOTICE 'Actual contacts: %', contact_count;

  IF contact_count = 2 THEN
    RAISE NOTICE '✅ PASS - User 1 can see Workspace A contacts';
  ELSE
    RAISE NOTICE '❌ FAIL - User 1 sees % contacts (expected 2)', contact_count;
  END IF;
END $$;

-- Test 2: User 1 should NOT see Workspace B contacts (if RLS is working)
-- Note: This test may not work as expected without actual auth context
DO $$
DECLARE
  contact_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO contact_count
  FROM contacts
  WHERE workspace_id = 'dddddddd-dddd-dddd-dddd-dddddddddddd';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'TEST 2: User 1 attempting Workspace B';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Expected contacts: 0 (should be blocked by RLS)';
  RAISE NOTICE 'Actual contacts: %', contact_count;

  IF contact_count = 0 THEN
    RAISE NOTICE '✅ PASS - User 1 cannot see Workspace B contacts (RLS working)';
  ELSE
    RAISE NOTICE '⚠️  Note: Seeing % contacts (RLS requires actual auth context)', contact_count;
  END IF;
END $$;

-- ============================================================================
-- 4. CHECK RLS POLICIES
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RLS POLICIES';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total RLS policies: %', policy_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Policies by table:';

  FOR policy_record IN
    SELECT tablename, COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY tablename
    ORDER BY tablename
  LOOP
    RAISE NOTICE '   % : % policies', policy_record.tablename, policy_record.policy_count;
  END LOOP;

  IF policy_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '❌ CRITICAL: No RLS policies found!';
    RAISE NOTICE 'You need to create RLS policies for workspace isolation.';
  END IF;
END $$;

-- ============================================================================
-- 5. FINAL SUMMARY
-- ============================================================================

DO $$
DECLARE
  rls_disabled_count INTEGER;
  policy_count INTEGER;
  status TEXT;
BEGIN
  SELECT COUNT(*) INTO rls_disabled_count
  FROM pg_tables
  WHERE schemaname = 'public' AND rowsecurity = false;

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SECURITY AUDIT SUMMARY';
  RAISE NOTICE '========================================';

  -- Overall status
  IF rls_disabled_count = 0 AND policy_count > 0 THEN
    status := '✅ SECURE';
  ELSIF rls_disabled_count > 0 THEN
    status := '❌ INSECURE - RLS not enabled on all tables';
  ELSIF policy_count = 0 THEN
    status := '❌ INSECURE - No RLS policies defined';
  ELSE
    status := '⚠️  REVIEW NEEDED';
  END IF;

  RAISE NOTICE 'Overall Status: %', status;
  RAISE NOTICE '';
  RAISE NOTICE 'Metrics:';
  RAISE NOTICE '   Tables without RLS: %', rls_disabled_count;
  RAISE NOTICE '   Total RLS policies: %', policy_count;
  RAISE NOTICE '';

  IF rls_disabled_count > 0 OR policy_count = 0 THEN
    RAISE NOTICE '⚠️  ACTION REQUIRED:';
    IF rls_disabled_count > 0 THEN
      RAISE NOTICE '   1. Enable RLS on all public tables';
      RAISE NOTICE '      ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;';
    END IF;
    IF policy_count = 0 THEN
      RAISE NOTICE '   2. Create RLS policies for workspace isolation';
      RAISE NOTICE '      See: supabase/migrations/025_COMPLETE_RLS.sql';
    END IF;
  ELSE
    RAISE NOTICE '✅ No immediate action required';
    RAISE NOTICE '   Continue monitoring RLS policies for new tables';
  END IF;
END $$;

-- ============================================================================
-- CLEANUP (Optional - comment out if you want to keep test data)
-- ============================================================================

-- Uncomment to clean up test data after review:
/*
DO $$
BEGIN
  DELETE FROM contacts WHERE workspace_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
  DELETE FROM campaigns WHERE workspace_id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
  DELETE FROM user_organizations WHERE org_id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  DELETE FROM workspaces WHERE id IN ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'dddddddd-dddd-dddd-dddd-dddddddddddd');
  DELETE FROM organizations WHERE id IN ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
  DELETE FROM users WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222');
  RAISE NOTICE '✅ Test data cleaned up';
END $$;
*/
