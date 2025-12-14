-- =====================================================
-- MIGRATION 019 V3: Fix Organization ID Type Mismatch
-- =====================================================
-- Date: 2025-01-17
-- Purpose: Fix type mismatch with RLS policy handling
-- Issue: RLS policies prevent type alteration - must drop policies first

-- =====================================================
-- DIAGNOSTIC: Check current state
-- =====================================================
DO $$
DECLARE
  org_id_type TEXT;
  sub_org_id_type TEXT;
BEGIN
  SELECT data_type INTO org_id_type
  FROM information_schema.columns
  WHERE table_name = 'organizations' AND column_name = 'id';

  SELECT data_type INTO sub_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'subscriptions' AND column_name = 'org_id';

  RAISE NOTICE '=== CURRENT STATE ===';
  RAISE NOTICE 'organizations.id: %', org_id_type;
  RAISE NOTICE 'subscriptions.org_id: %', sub_org_id_type;
END $$;

-- =====================================================
-- STEP 1: Drop ALL RLS policies that reference org_id
-- =====================================================
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  RAISE NOTICE '=== DROPPING RLS POLICIES ===';

  -- Drop all policies from all tables
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
    RAISE NOTICE 'Dropped policy: %.% (%)',
      policy_record.tablename,
      policy_record.policyname,
      policy_record.schemaname;
  END LOOP;

  RAISE NOTICE 'All RLS policies dropped';
END $$;

-- =====================================================
-- STEP 2: Drop foreign key constraints
-- =====================================================
DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  RAISE NOTICE '=== DROPPING FOREIGN KEY CONSTRAINTS ===';

  -- Find all foreign keys referencing organizations.id
  FOR constraint_record IN
    SELECT
      tc.table_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'organizations'
      AND ccu.column_name = 'id'
  LOOP
    EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I CASCADE',
      constraint_record.table_name,
      constraint_record.constraint_name
    );
    RAISE NOTICE 'Dropped FK: %.%',
      constraint_record.table_name,
      constraint_record.constraint_name;
  END LOOP;

  RAISE NOTICE 'All foreign key constraints dropped';
END $$;

-- =====================================================
-- STEP 3: Convert organizations.id to UUID
-- =====================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations'
      AND column_name = 'id'
      AND data_type IN ('character varying', 'text')
  ) THEN
    RAISE NOTICE '=== CONVERTING TYPES TO UUID ===';

    BEGIN
      ALTER TABLE organizations ALTER COLUMN id TYPE UUID USING id::uuid;
      RAISE NOTICE 'Converted organizations.id to UUID';
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to convert organizations.id to UUID: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'organizations.id is already UUID';
  END IF;
END $$;

-- =====================================================
-- STEP 4: Convert all foreign key columns to UUID
-- =====================================================
DO $$
DECLARE
  table_col RECORD;
BEGIN
  -- List of tables and columns to convert
  FOR table_col IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'org_id'
      AND data_type IN ('character varying', 'text')
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I ALTER COLUMN org_id TYPE UUID USING org_id::uuid',
        table_col.table_name
      );
      RAISE NOTICE 'Converted %.org_id to UUID', table_col.table_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to convert %.org_id: %', table_col.table_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- =====================================================
-- STEP 5: Re-create foreign key constraints
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== RE-CREATING FOREIGN KEY CONSTRAINTS ===';

  -- user_organizations
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_organizations') THEN
    ALTER TABLE user_organizations
      ADD CONSTRAINT user_organizations_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created user_organizations FK';
  END IF;

  -- workspaces
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaces') THEN
    ALTER TABLE workspaces
      ADD CONSTRAINT workspaces_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created workspaces FK';
  END IF;

  -- subscriptions
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created subscriptions FK';
  END IF;

  -- invoices
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    ALTER TABLE invoices
      ADD CONSTRAINT invoices_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created invoices FK';
  END IF;

  -- payment_methods
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
    ALTER TABLE payment_methods
      ADD CONSTRAINT payment_methods_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created payment_methods FK';
  END IF;

  -- auditLogs
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditLogs') THEN
    ALTER TABLE "auditLogs"
      ADD CONSTRAINT "auditLogs_org_id_fkey"
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created auditLogs FK';
  END IF;

  -- generatedContent
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generatedContent') THEN
    ALTER TABLE "generatedContent"
      ADD CONSTRAINT "generatedContent_org_id_fkey"
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE 'Created generatedContent FK';
  END IF;

  RAISE NOTICE 'All foreign key constraints re-created';
END $$;

-- =====================================================
-- STEP 6: IMPORTANT NOTE - RLS Policies
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== IMPORTANT ===';
  RAISE NOTICE 'RLS policies have been DROPPED to allow type conversion';
  RAISE NOTICE 'You MUST apply migration 020 to restore RLS policies';
  RAISE NOTICE 'Until then, your database has NO row-level security!';
  RAISE NOTICE '=== NEXT STEP: Run migration 020 immediately ===';
END $$;

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
DECLARE
  org_id_type TEXT;
  all_uuid BOOLEAN := true;
  table_col RECORD;
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';

  SELECT data_type INTO org_id_type
  FROM information_schema.columns
  WHERE table_name = 'organizations' AND column_name = 'id';

  RAISE NOTICE 'organizations.id: %', org_id_type;

  FOR table_col IN
    SELECT table_name, column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'org_id'
    ORDER BY table_name
  LOOP
    RAISE NOTICE '%.org_id: %', table_col.table_name, table_col.data_type;
    IF table_col.data_type != 'uuid' THEN
      all_uuid := false;
    END IF;
  END LOOP;

  IF org_id_type = 'uuid' AND all_uuid THEN
    RAISE NOTICE '✅ SUCCESS: All org_id columns are UUID';
  ELSE
    RAISE WARNING '⚠️ ISSUE: Not all columns are UUID';
  END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN organizations.id IS 'Organization unique identifier (UUID)';
