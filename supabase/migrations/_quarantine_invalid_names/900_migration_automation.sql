-- =====================================================
-- Migration: 900_migration_automation
-- Purpose: Add state tracking infrastructure for automated migrations
-- Date: 2025-12-14
-- Impact: Zero-downtime, ADD-ONLY migration
-- =====================================================
-- ADD-ONLY: true
-- TENANT_RLS: N/A (system table, no workspace isolation)

-- =====================================================
-- MIGRATION STATE TRACKING TABLE
-- =====================================================
-- Tracks applied migrations for orchestration

CREATE TABLE IF NOT EXISTS _migrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  sha256 TEXT NOT NULL,
  execution_time_ms INTEGER,
  rollback_sql TEXT,
  status TEXT DEFAULT 'applied',
  error_message TEXT,
  applied_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_migrations_applied_at
  ON _migrations(applied_at DESC);

CREATE INDEX IF NOT EXISTS idx_migrations_status
  ON _migrations(status);

CREATE INDEX IF NOT EXISTS idx_migrations_filename
  ON _migrations(filename);

-- Add table comment
COMMENT ON TABLE _migrations IS 'System table: Tracks all applied database migrations for orchestration and rollback capability';
COMMENT ON COLUMN _migrations.filename IS 'Migration filename (e.g., 001_initial_schema.sql)';
COMMENT ON COLUMN _migrations.sha256 IS 'SHA256 hash of migration file for integrity verification';
COMMENT ON COLUMN _migrations.execution_time_ms IS 'Time taken to apply migration in milliseconds';
COMMENT ON COLUMN _migrations.rollback_sql IS 'SQL to rollback this migration (if reversible)';
COMMENT ON COLUMN _migrations.status IS 'Migration status: applied, failed, rolled_back';
COMMENT ON COLUMN _migrations.applied_by IS 'User or CI system that applied migration';

-- =====================================================
-- MIGRATION TEST RESULTS TABLE
-- =====================================================
-- Tracks test results for each migration

CREATE TABLE IF NOT EXISTS migration_test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_filename TEXT NOT NULL,
  test_type TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  details JSONB,
  tested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_results_migration
  ON migration_test_results(migration_filename, tested_at DESC);

CREATE INDEX IF NOT EXISTS idx_test_results_passed
  ON migration_test_results(passed);

COMMENT ON TABLE migration_test_results IS 'Tracks pre and post-migration validation test results';
COMMENT ON COLUMN migration_test_results.test_type IS 'Type of test: guardian, rls, rollback, performance, schema';

-- =====================================================
-- VERIFICATION
-- =====================================================

DO $$
DECLARE
  tables_created INT;
  indexes_created INT;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO tables_created
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('_migrations', 'migration_test_results');

  -- Count indexes
  SELECT COUNT(*) INTO indexes_created
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('_migrations', 'migration_test_results');

  RAISE NOTICE '========================================';
  RAISE NOTICE '=== Migration 900 Applied ===';
  RAISE NOTICE 'Tables created: % / 2', tables_created;
  RAISE NOTICE 'Indexes created: % / 5', indexes_created;
  RAISE NOTICE '';

  IF tables_created = 2 AND indexes_created = 5 THEN
    RAISE NOTICE '✅ ✅ ✅ SUCCESS ✅ ✅ ✅';
    RAISE NOTICE 'State tracking infrastructure ready';
    RAISE NOTICE 'Migration orchestration can now begin';
  ELSE
    RAISE WARNING '⚠️ INCOMPLETE - Review output above';
  END IF;
  RAISE NOTICE '========================================';
END $$;
