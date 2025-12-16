-- =====================================================
-- MIGRATION 019: Fix Organization ID Type Mismatch
-- =====================================================
-- Date: 2025-11-17
-- Purpose: Fix critical type mismatch where organizations.id is UUID but some
--          foreign keys reference it as TEXT/VARCHAR, causing FK constraint failures
-- Status: IDEMPOTENT - Safe to run multiple times

-- =====================================================
-- ISSUE ANALYSIS
-- =====================================================
-- organizations.id = UUID (migration 001)
-- user_organizations.org_id = UUID (migration 003) ✅ CORRECT
-- subscriptions.org_id = TEXT (migration 012) ❌ WRONG
-- invoices.org_id = TEXT (migration 012) ❌ WRONG
-- payment_methods.org_id = TEXT (migration 012) ❌ WRONG

-- =====================================================
-- STEP 1: ALTER SUBSCRIPTIONS TABLE
-- =====================================================
-- Drop foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_org_id_fkey'
      AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_org_id_fkey;
  END IF;
END $$;
-- Change org_id column type from TEXT to UUID
DO $$
BEGIN
  -- Only alter if column is not already UUID
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions'
      AND column_name = 'org_id'
      AND data_type != 'uuid'
  ) THEN
    -- First, try to convert existing data
    -- If there's no data or all data is valid UUIDs, this will succeed
    ALTER TABLE subscriptions
    ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
  END IF;
END $$;
-- Re-add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'subscriptions_org_id_fkey'
      AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE subscriptions
    ADD CONSTRAINT subscriptions_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;
-- =====================================================
-- STEP 2: ALTER INVOICES TABLE
-- =====================================================
-- Drop foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'invoices_org_id_fkey'
      AND table_name = 'invoices'
  ) THEN
    ALTER TABLE invoices DROP CONSTRAINT invoices_org_id_fkey;
  END IF;
END $$;
-- Change org_id column type from TEXT to UUID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'invoices'
      AND column_name = 'org_id'
      AND data_type != 'uuid'
  ) THEN
    ALTER TABLE invoices
    ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
  END IF;
END $$;
-- Re-add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'invoices_org_id_fkey'
      AND table_name = 'invoices'
  ) THEN
    ALTER TABLE invoices
    ADD CONSTRAINT invoices_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;
-- =====================================================
-- STEP 3: ALTER PAYMENT_METHODS TABLE
-- =====================================================
-- Drop foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payment_methods_org_id_fkey'
      AND table_name = 'payment_methods'
  ) THEN
    ALTER TABLE payment_methods DROP CONSTRAINT payment_methods_org_id_fkey;
  END IF;
END $$;
-- Change org_id column type from TEXT to UUID
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_methods'
      AND column_name = 'org_id'
      AND data_type != 'uuid'
  ) THEN
    ALTER TABLE payment_methods
    ALTER COLUMN org_id TYPE UUID USING org_id::uuid;
  END IF;
END $$;
-- Re-add foreign key constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payment_methods_org_id_fkey'
      AND table_name = 'payment_methods'
  ) THEN
    ALTER TABLE payment_methods
    ADD CONSTRAINT payment_methods_org_id_fkey
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;
END $$;
-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify all org_id columns are now UUID
SELECT
  table_name,
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE column_name = 'org_id'
  AND table_schema = 'public'
ORDER BY table_name;
-- =====================================================
-- EXPECTED OUTPUT
-- =====================================================
-- table_name              | column_name | data_type | udt_name
-- ----------------------- |-------------|-----------|----------
-- approvals               | org_id      | uuid      | uuid
-- audit_logs              | org_id      | uuid      | uuid
-- intake_submissions      | org_id      | uuid      | uuid
-- invoices                | org_id      | uuid      | uuid
-- payment_methods         | org_id      | uuid      | uuid
-- projects                | org_id      | uuid      | uuid
-- subscriptions           | org_id      | uuid      | uuid
-- team_members            | org_id      | uuid      | uuid
-- user_organizations      | org_id      | uuid      | uuid
-- workspaces              | org_id      | uuid      | uuid

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
COMMENT ON CONSTRAINT subscriptions_org_id_fkey ON subscriptions IS 'Fixed type mismatch - org_id now UUID';
COMMENT ON CONSTRAINT invoices_org_id_fkey ON invoices IS 'Fixed type mismatch - org_id now UUID';
COMMENT ON CONSTRAINT payment_methods_org_id_fkey ON payment_methods IS 'Fixed type mismatch - org_id now UUID';
