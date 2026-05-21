-- UNI-1594: Add missing performance indexes
-- Five tables had no indexes beyond PK, causing sequential scans
-- on dashboard and analytics queries.
-- Uses table-existence checks — some tables (experiments, experiment_results)
-- may not yet be deployed to all environments.

DO $$
BEGIN
  -- experiments — filtered by status on dashboard, sorted by created_at
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'experiments') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_experiments_founder_status ON public.experiments (founder_id, status, created_at DESC)';
  END IF;

  -- experiment_results — analytics aggregations by period
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'experiment_results') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_experiment_results_period ON public.experiment_results (experiment_id, period_date DESC)';
  END IF;

  -- credentials_vault — vault lookups by service name
  -- EXECUTE used: CREATE INDEX IF NOT EXISTS contains IF keyword which confuses PL/pgSQL parser
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'credentials_vault') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_credentials_vault_service ON public.credentials_vault (founder_id, service)';
  END IF;

  -- nexus_databases — uses owner_id (v1 schema, not yet migrated to founder_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'nexus_databases') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_nexus_databases_owner ON public.nexus_databases (owner_id, business_id)';
  END IF;

  -- connected_projects — uses owner_id (v1 schema, not yet migrated to founder_id)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connected_projects') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_connected_projects_owner ON public.connected_projects (owner_id)';
  END IF;
END $$;
