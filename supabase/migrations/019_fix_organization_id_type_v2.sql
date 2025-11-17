-- =====================================================
-- MIGRATION 019 V2: Fix Organization ID Type Mismatch
-- =====================================================
-- Date: 2025-01-17
-- Purpose: Fix type mismatch - organizations.id is TEXT but should be UUID
-- Root Cause: organizations table was created with TEXT id instead of UUID

-- =====================================================
-- DIAGNOSTIC: Check current state
-- =====================================================
DO $$
DECLARE
  org_id_type TEXT;
  sub_org_id_type TEXT;
BEGIN
  -- Check organizations.id type
  SELECT data_type INTO org_id_type
  FROM information_schema.columns
  WHERE table_name = 'organizations' AND column_name = 'id';

  -- Check subscriptions.org_id type
  SELECT data_type INTO sub_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'subscriptions' AND column_name = 'org_id';

  RAISE NOTICE 'Current state:';
  RAISE NOTICE '  organizations.id = %', org_id_type;
  RAISE NOTICE '  subscriptions.org_id = %', sub_org_id_type;
END $$;

-- =====================================================
-- OPTION 1: If organizations.id is TEXT/VARCHAR
-- Convert organizations.id from TEXT to UUID
-- =====================================================
DO $$
BEGIN
  -- Check if organizations.id is not UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations'
      AND column_name = 'id'
      AND data_type IN ('character varying', 'text')
  ) THEN
    RAISE NOTICE 'Converting organizations.id from TEXT to UUID...';

    -- Step 1: Drop all foreign key constraints referencing organizations.id

    -- Drop user_organizations FK
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'user_organizations_org_id_fkey'
    ) THEN
      ALTER TABLE user_organizations DROP CONSTRAINT user_organizations_org_id_fkey;
      RAISE NOTICE '  Dropped user_organizations FK';
    END IF;

    -- Drop workspaces FK
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'workspaces_org_id_fkey'
    ) THEN
      ALTER TABLE workspaces DROP CONSTRAINT workspaces_org_id_fkey;
      RAISE NOTICE '  Dropped workspaces FK';
    END IF;

    -- Drop subscriptions FK (if exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'subscriptions_org_id_fkey'
    ) THEN
      ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_org_id_fkey;
      RAISE NOTICE '  Dropped subscriptions FK';
    END IF;

    -- Drop invoices FK (if exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'invoices_org_id_fkey'
    ) THEN
      ALTER TABLE invoices DROP CONSTRAINT invoices_org_id_fkey;
      RAISE NOTICE '  Dropped invoices FK';
    END IF;

    -- Drop payment_methods FK (if exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'payment_methods_org_id_fkey'
    ) THEN
      ALTER TABLE payment_methods DROP CONSTRAINT payment_methods_org_id_fkey;
      RAISE NOTICE '  Dropped payment_methods FK';
    END IF;

    -- Drop auditLogs FK (if exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'auditLogs_org_id_fkey'
    ) THEN
      ALTER TABLE "auditLogs" DROP CONSTRAINT "auditLogs_org_id_fkey";
      RAISE NOTICE '  Dropped auditLogs FK';
    END IF;

    -- Drop generatedContent FK (if exists)
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE constraint_name = 'generatedContent_org_id_fkey'
    ) THEN
      ALTER TABLE "generatedContent" DROP CONSTRAINT "generatedContent_org_id_fkey";
      RAISE NOTICE '  Dropped generatedContent FK';
    END IF;

    -- Step 2: Convert organizations.id to UUID
    -- This will fail if any existing IDs are not valid UUIDs
    BEGIN
      ALTER TABLE organizations ALTER COLUMN id TYPE UUID USING id::uuid;
      RAISE NOTICE '  Converted organizations.id to UUID';
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to convert organizations.id to UUID. Existing data contains invalid UUIDs: %', SQLERRM;
    END;

    -- Step 3: Convert all foreign key columns to UUID

    -- user_organizations.org_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'user_organizations' AND column_name = 'org_id'
        AND data_type IN ('character varying', 'text')
    ) THEN
      ALTER TABLE user_organizations ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
      RAISE NOTICE '  Converted user_organizations.org_id to UUID';
    END IF;

    -- workspaces.org_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'workspaces' AND column_name = 'org_id'
        AND data_type IN ('character varying', 'text')
    ) THEN
      ALTER TABLE workspaces ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
      RAISE NOTICE '  Converted workspaces.org_id to UUID';
    END IF;

    -- subscriptions.org_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'subscriptions' AND column_name = 'org_id'
        AND data_type IN ('character varying', 'text')
    ) THEN
      ALTER TABLE subscriptions ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
      RAISE NOTICE '  Converted subscriptions.org_id to UUID';
    END IF;

    -- invoices.org_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'invoices' AND column_name = 'org_id'
        AND data_type IN ('character varying', 'text')
    ) THEN
      ALTER TABLE invoices ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
      RAISE NOTICE '  Converted invoices.org_id to UUID';
    END IF;

    -- payment_methods.org_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'payment_methods' AND column_name = 'org_id'
        AND data_type IN ('character varying', 'text')
    ) THEN
      ALTER TABLE payment_methods ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
      RAISE NOTICE '  Converted payment_methods.org_id to UUID';
    END IF;

    -- auditLogs.org_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'auditLogs' AND column_name = 'org_id'
        AND data_type IN ('character varying', 'text')
    ) THEN
      ALTER TABLE "auditLogs" ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
      RAISE NOTICE '  Converted auditLogs.org_id to UUID';
    END IF;

    -- generatedContent.org_id
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'generatedContent' AND column_name = 'org_id'
        AND data_type IN ('character varying', 'text')
    ) THEN
      ALTER TABLE "generatedContent" ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
      RAISE NOTICE '  Converted generatedContent.org_id to UUID';
    END IF;

    -- Step 4: Re-create all foreign key constraints

    ALTER TABLE user_organizations
      ADD CONSTRAINT user_organizations_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE '  Re-created user_organizations FK';

    ALTER TABLE workspaces
      ADD CONSTRAINT workspaces_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE '  Re-created workspaces FK';

    ALTER TABLE subscriptions
      ADD CONSTRAINT subscriptions_org_id_fkey
      FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
    RAISE NOTICE '  Re-created subscriptions FK';

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
      ALTER TABLE invoices
        ADD CONSTRAINT invoices_org_id_fkey
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
      RAISE NOTICE '  Re-created invoices FK';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_methods') THEN
      ALTER TABLE payment_methods
        ADD CONSTRAINT payment_methods_org_id_fkey
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
      RAISE NOTICE '  Re-created payment_methods FK';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'auditLogs') THEN
      ALTER TABLE "auditLogs"
        ADD CONSTRAINT "auditLogs_org_id_fkey"
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
      RAISE NOTICE '  Re-created auditLogs FK';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'generatedContent') THEN
      ALTER TABLE "generatedContent"
        ADD CONSTRAINT "generatedContent_org_id_fkey"
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
      RAISE NOTICE '  Re-created generatedContent FK';
    END IF;

    RAISE NOTICE 'Migration complete: All org_id columns are now UUID';
  ELSE
    RAISE NOTICE 'organizations.id is already UUID - no changes needed';
  END IF;
END $$;

-- =====================================================
-- VERIFICATION: Confirm all types are now UUID
-- =====================================================
DO $$
DECLARE
  org_id_type TEXT;
  sub_org_id_type TEXT;
  user_org_type TEXT;
  workspace_org_type TEXT;
BEGIN
  SELECT data_type INTO org_id_type
  FROM information_schema.columns
  WHERE table_name = 'organizations' AND column_name = 'id';

  SELECT data_type INTO sub_org_id_type
  FROM information_schema.columns
  WHERE table_name = 'subscriptions' AND column_name = 'org_id';

  SELECT data_type INTO user_org_type
  FROM information_schema.columns
  WHERE table_name = 'user_organizations' AND column_name = 'org_id';

  SELECT data_type INTO workspace_org_type
  FROM information_schema.columns
  WHERE table_name = 'workspaces' AND column_name = 'org_id';

  RAISE NOTICE '=== VERIFICATION RESULTS ===';
  RAISE NOTICE 'organizations.id: %', org_id_type;
  RAISE NOTICE 'subscriptions.org_id: %', sub_org_id_type;
  RAISE NOTICE 'user_organizations.org_id: %', user_org_type;
  RAISE NOTICE 'workspaces.org_id: %', workspace_org_type;

  IF org_id_type = 'uuid'
     AND sub_org_id_type = 'uuid'
     AND user_org_type = 'uuid'
     AND workspace_org_type = 'uuid' THEN
    RAISE NOTICE '✅ SUCCESS: All org_id columns are UUID';
  ELSE
    RAISE WARNING '⚠️ ISSUE: Some columns are not UUID';
  END IF;
END $$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON COLUMN organizations.id IS 'Organization unique identifier (UUID)';
COMMENT ON COLUMN subscriptions.org_id IS 'Foreign key to organizations.id (UUID)';
COMMENT ON COLUMN user_organizations.org_id IS 'Foreign key to organizations.id (UUID)';
COMMENT ON COLUMN workspaces.org_id IS 'Foreign key to organizations.id (UUID)';
