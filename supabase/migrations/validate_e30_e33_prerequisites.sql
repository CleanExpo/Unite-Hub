-- =====================================================
-- VALIDATION SCRIPT: E30-E33 Prerequisites Check
-- =====================================================
-- Run this BEFORE executing migrations 519-522
-- Purpose: Verify all dependent tables and columns exist
-- Expected migrations: 515-518 (E26-E29) and E22-E25 tables
-- =====================================================

DO $$
DECLARE
  v_missing_tables TEXT[] := ARRAY[]::TEXT[];
  v_missing_columns TEXT[] := ARRAY[]::TEXT[];
  v_table_exists BOOLEAN;
  v_column_exists BOOLEAN;
  v_error_count INTEGER := 0;
BEGIN
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'E30-E33 PREREQUISITES VALIDATION CHECK';
  RAISE NOTICE '=================================================================';
  RAISE NOTICE '';

  -- =====================================================
  -- 1. Check Required Tables from E22-E25
  -- =====================================================
  RAISE NOTICE '1. Checking E22-E25 Tables (Referenced by E33 Timeline)...';
  RAISE NOTICE '-----------------------------------------------------------------';

  -- E22: Audit Logs
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'audit_logs'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_missing_tables := array_append(v_missing_tables, 'audit_logs (E22)');
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ Table missing: audit_logs (E22: Audit Logs)';
  ELSE
    RAISE NOTICE '  ✓ audit_logs exists';

    -- Check tenant_id column
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'tenant_id'
    ) INTO v_column_exists;

    IF NOT v_column_exists THEN
      v_missing_columns := array_append(v_missing_columns, 'audit_logs.tenant_id');
      v_error_count := v_error_count + 1;
      RAISE WARNING '  ✗ Column missing: audit_logs.tenant_id';
    END IF;
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 2. Check Required Tables from E26-E29 (515-518)
  -- =====================================================
  RAISE NOTICE '2. Checking E26-E29 Tables (Migrations 515-518)...';
  RAISE NOTICE '-----------------------------------------------------------------';

  -- E26: Data Retention
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'data_retention_policies'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_missing_tables := array_append(v_missing_tables, 'data_retention_policies (E26)');
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ Table missing: data_retention_policies (E26: Data Retention)';
  ELSE
    RAISE NOTICE '  ✓ data_retention_policies exists';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'data_deletion_jobs'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_missing_tables := array_append(v_missing_tables, 'data_deletion_jobs (E26)');
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ Table missing: data_deletion_jobs (E26: Data Retention)';
  ELSE
    RAISE NOTICE '  ✓ data_deletion_jobs exists';

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'data_deletion_jobs' AND column_name = 'tenant_id'
    ) INTO v_column_exists;

    IF NOT v_column_exists THEN
      v_missing_columns := array_append(v_missing_columns, 'data_deletion_jobs.tenant_id');
      v_error_count := v_error_count + 1;
      RAISE WARNING '  ✗ Column missing: data_deletion_jobs.tenant_id';
    END IF;
  END IF;

  -- E27: Webhooks
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webhook_endpoints'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_missing_tables := array_append(v_missing_tables, 'webhook_endpoints (E27)');
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ Table missing: webhook_endpoints (E27: Webhooks)';
  ELSE
    RAISE NOTICE '  ✓ webhook_endpoints exists';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'webhook_events'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_missing_tables := array_append(v_missing_tables, 'webhook_events (E27)');
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ Table missing: webhook_events (E27: Webhooks)';
  ELSE
    RAISE NOTICE '  ✓ webhook_events exists';
  END IF;

  -- E28: Risk Scoring
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'risk_scores'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_missing_tables := array_append(v_missing_tables, 'risk_scores (E28)');
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ Table missing: risk_scores (E28: Risk Scoring)';
  ELSE
    RAISE NOTICE '  ✓ risk_scores exists';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'risk_events'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_missing_tables := array_append(v_missing_tables, 'risk_events (E28)');
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ Table missing: risk_events (E28: Risk Scoring)';
  ELSE
    RAISE NOTICE '  ✓ risk_events exists';

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'risk_events' AND column_name = 'tenant_id'
    ) INTO v_column_exists;

    IF NOT v_column_exists THEN
      v_missing_columns := array_append(v_missing_columns, 'risk_events.tenant_id');
      v_error_count := v_error_count + 1;
      RAISE WARNING '  ✗ Column missing: risk_events.tenant_id';
    END IF;
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 3. Check Required ENUMs
  -- =====================================================
  RAISE NOTICE '3. Checking Required ENUM Types...';
  RAISE NOTICE '-----------------------------------------------------------------';

  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'data_category'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ ENUM missing: data_category (E26)';
  ELSE
    RAISE NOTICE '  ✓ data_category enum exists';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'risk_severity'
  ) INTO v_table_exists;

  IF NOT v_table_exists THEN
    v_error_count := v_error_count + 1;
    RAISE WARNING '  ✗ ENUM missing: risk_severity (E28)';
  ELSE
    RAISE NOTICE '  ✓ risk_severity enum exists';
  END IF;

  RAISE NOTICE '';

  -- =====================================================
  -- 4. Summary
  -- =====================================================
  RAISE NOTICE '=================================================================';
  RAISE NOTICE 'VALIDATION SUMMARY';
  RAISE NOTICE '=================================================================';

  IF v_error_count = 0 THEN
    RAISE NOTICE '✓ ALL PREREQUISITES MET - Safe to run migrations 519-522';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Run migration 519_runbooks_core.sql (E30)';
    RAISE NOTICE '  2. Run migration 520_sla_reporting_core.sql (E31)';
    RAISE NOTICE '  3. Run migration 521_evidence_pack_core.sql (E32)';
    RAISE NOTICE '  4. Run migration 522_founder_timeline_views.sql (E33)';
  ELSE
    RAISE WARNING '✗ VALIDATION FAILED - % error(s) found', v_error_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Missing tables: %', array_to_string(v_missing_tables, ', ');
    IF array_length(v_missing_columns, 1) > 0 THEN
      RAISE NOTICE 'Missing columns: %', array_to_string(v_missing_columns, ', ');
    END IF;
    RAISE NOTICE '';
    RAISE WARNING 'REQUIRED ACTION: Run the following migrations first:';

    IF 'audit_logs (E22)' = ANY(v_missing_tables) THEN
      RAISE NOTICE '  - E22: Audit Logs migration';
    END IF;

    IF 'data_retention_policies (E26)' = ANY(v_missing_tables) OR 'data_deletion_jobs (E26)' = ANY(v_missing_tables) THEN
      RAISE NOTICE '  - Migration 515_data_retention_core.sql (E26)';
    END IF;

    IF 'webhook_endpoints (E27)' = ANY(v_missing_tables) OR 'webhook_events (E27)' = ANY(v_missing_tables) THEN
      RAISE NOTICE '  - Migration 516_webhook_governance_core.sql (E27)';
    END IF;

    IF 'risk_scores (E28)' = ANY(v_missing_tables) OR 'risk_events (E28)' = ANY(v_missing_tables) THEN
      RAISE NOTICE '  - Migration 517_risk_scoring_core.sql (E28)';
    END IF;

    RAISE NOTICE '';
    RAISE EXCEPTION 'Prerequisites not met - see errors above';
  END IF;

  RAISE NOTICE '=================================================================';
END $$;
