-- UNI-1594: Add missing performance indexes
-- Five tables had no indexes beyond PK, causing sequential scans
-- on dashboard and analytics queries.

-- experiments — filtered by status on dashboard, sorted by created_at
CREATE INDEX IF NOT EXISTS idx_experiments_founder_status
  ON public.experiments (founder_id, status, created_at DESC);

-- experiment_results — analytics aggregations by period
CREATE INDEX IF NOT EXISTS idx_experiment_results_period
  ON public.experiment_results (experiment_id, period_date DESC);

-- credentials_vault — vault lookups by service name
CREATE INDEX IF NOT EXISTS idx_credentials_vault_service
  ON public.credentials_vault (founder_id, service);

-- nexus_databases — page database queries
CREATE INDEX IF NOT EXISTS idx_nexus_databases_page
  ON public.nexus_databases (founder_id, page_id);

-- connected_projects — project sync queries
CREATE INDEX IF NOT EXISTS idx_connected_projects_founder
  ON public.connected_projects (founder_id);
