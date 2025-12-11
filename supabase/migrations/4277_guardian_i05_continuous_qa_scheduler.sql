/**
 * Guardian I05: Continuous QA Scheduler & Baseline Drift Monitor
 * Migration: 4277
 *
 * Purpose:
 * - Tenant-scoped QA schedule management (cron-based regression pack execution)
 * - Baseline snapshot creation and management for drift detection
 * - Drift report generation comparing current runs against baselines
 *
 * Non-destructive:
 * - QA schedules trigger regression runs (I01-I04), never real alerts/incidents
 * - Stores only aggregate metrics (counts, ratios, trends)
 * - No raw payloads, no PII, no production table writes
 *
 * Assumptions:
 * - guardian_regression_packs exists (I03)
 * - guardian_chaos_profiles exists (I04)
 * - guardian_regression_runs exists (I03)
 * - guardian_playbook_simulation_runs exists (I04)
 * - get_user_workspaces() function exists (migration 020)
 */

-- ============================================================================
-- TABLE: guardian_qa_schedules
-- ============================================================================
-- Cron-driven QA execution configuration
-- Triggers regression packs on a schedule
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_qa_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  schedule_cron TEXT NOT NULL, -- e.g., '0 3 * * *' for daily at 3 AM UTC
  timezone TEXT NOT NULL DEFAULT 'UTC',
  pack_id UUID NOT NULL, -- REFERENCES guardian_regression_packs(id) ON DELETE CASCADE,
  chaos_profile_id UUID, -- REFERENCES guardian_chaos_profiles(id) ON DELETE SET NULL,
  simulate_playbooks BOOLEAN NOT NULL DEFAULT false,
  max_runtime_minutes INTEGER NOT NULL DEFAULT 30,

  -- Tracking
  last_run_id UUID, -- REFERENCES guardian_regression_runs(id) ON DELETE SET NULL,
  last_run_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by TEXT,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_guardian_qa_schedules_tenant_active
  ON guardian_qa_schedules(tenant_id, is_active, schedule_cron);

CREATE INDEX IF NOT EXISTS idx_guardian_qa_schedules_created
  ON guardian_qa_schedules(tenant_id, created_at DESC);

-- ============================================================================
-- TABLE: guardian_qa_baselines
-- ============================================================================
-- Reference baselines for drift detection
-- Captures aggregate metrics from regression/simulation/playbook runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_qa_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Scope identifies what this baseline represents
  scope TEXT NOT NULL, -- 'regression_pack' | 'scenario' | 'playbook'

  -- Source identifies which run type and id
  source_type TEXT NOT NULL, -- 'regression_run' | 'simulation_run' | 'playbook_simulation_run'
  source_id TEXT NOT NULL, -- UUID string, source run id

  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Aggregate metrics only (no raw payloads, no PII)
  -- Structure: { alerts: { total, bySeverity, byRule }, incidents: { total }, risk: { avgScore, maxScore }, notifications: { simulatedTotal }, playbooks: { ... } }
  metrics JSONB NOT NULL,

  comparison_window TEXT, -- e.g., 'last_4_weeks', optional descriptor
  is_reference BOOLEAN NOT NULL DEFAULT false, -- Whether this is a reference baseline for comparisons

  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_guardian_qa_baselines_tenant_reference
  ON guardian_qa_baselines(tenant_id, is_reference, captured_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_qa_baselines_source
  ON guardian_qa_baselines(tenant_id, source_type, source_id);

-- ============================================================================
-- TABLE: guardian_qa_drift_reports
-- ============================================================================
-- Drift detection reports comparing current runs against baselines
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_qa_drift_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,

  -- Link to triggering schedule (null if manual run)
  schedule_id UUID, -- REFERENCES guardian_qa_schedules(id) ON DELETE SET NULL,

  -- Baseline used for comparison
  baseline_id UUID NOT NULL, -- REFERENCES guardian_qa_baselines(id) ON DELETE CASCADE,

  -- Regression run that triggered comparison
  comparison_run_id UUID NOT NULL, -- usually guardian_regression_runs.id

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed' | 'failed'

  -- Severity of drift
  severity TEXT NOT NULL DEFAULT 'info', -- 'info' | 'warning' | 'critical'

  -- Summary metrics and flags (no raw payloads, no PII)
  -- Structure: { baselineMetrics: {...}, currentMetrics: {...}, deltas: { alertsRelative?, incidentsRelative?, ... }, flags: [...] }
  summary JSONB NOT NULL,

  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_guardian_qa_drift_reports_tenant_created
  ON guardian_qa_drift_reports(tenant_id, created_at DESC, severity);

CREATE INDEX IF NOT EXISTS idx_guardian_qa_drift_reports_schedule
  ON guardian_qa_drift_reports(tenant_id, schedule_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_qa_drift_reports_baseline
  ON guardian_qa_drift_reports(baseline_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- All tables tenant-scoped; tenants can only see their own rows

ALTER TABLE guardian_qa_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_qa_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_qa_drift_reports ENABLE ROW LEVEL SECURITY;

-- QA Schedules: Tenant isolation
DROP POLICY IF EXISTS "qa_schedules_tenant_isolation" ON guardian_qa_schedules;
CREATE POLICY "qa_schedules_tenant_isolation" ON guardian_qa_schedules
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()));

-- QA Baselines: Tenant isolation
DROP POLICY IF EXISTS "qa_baselines_tenant_isolation" ON guardian_qa_baselines;
CREATE POLICY "qa_baselines_tenant_isolation" ON guardian_qa_baselines
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()));

-- QA Drift Reports: Tenant isolation
DROP POLICY IF EXISTS "qa_drift_reports_tenant_isolation" ON guardian_qa_drift_reports;
CREATE POLICY "qa_drift_reports_tenant_isolation" ON guardian_qa_drift_reports
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE guardian_qa_schedules IS
'QA schedule configuration: cron-driven triggers for regression pack execution. Non-destructive; generates simulation runs only.';

COMMENT ON TABLE guardian_qa_baselines IS
'Baseline snapshots for drift detection: captures aggregate metrics from regression/simulation/playbook runs. No raw payloads or PII.';

COMMENT ON TABLE guardian_qa_drift_reports IS
'Drift detection reports: compare current regression runs against baselines. Identify behavioral changes with severity flags.';

COMMENT ON COLUMN guardian_qa_schedules.schedule_cron IS
'Cron expression (e.g., "0 3 * * *"). Actual scheduling is handled by external cron runner or job processor.';

COMMENT ON COLUMN guardian_qa_schedules.chaos_profile_id IS
'Optional chaos profile to inject into regression pack execution. NULL uses default/no chaos.';

COMMENT ON COLUMN guardian_qa_baselines.metrics IS
'Aggregate metrics only: {alerts: {total, bySeverity, byRule}, incidents: {total}, risk: {avgScore, maxScore}, notifications: {simulatedTotal}, playbooks: {...}}. No raw logs or PII.';

COMMENT ON COLUMN guardian_qa_baselines.is_reference IS
'Whether this baseline is used as reference for drift comparison. At most one per (tenant, scope) recommended, but not enforced here.';

COMMENT ON COLUMN guardian_qa_drift_reports.summary IS
'Summary of drift: {baselineMetrics, currentMetrics, deltas: {alertsRelative?, incidentsRelative?, ...}, flags: [...]}. No PII.';
