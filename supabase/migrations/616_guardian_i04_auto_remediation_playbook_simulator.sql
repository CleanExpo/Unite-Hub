/**
 * Guardian I04: Auto-Remediation Playbook Simulator
 * Schema for remediation playbooks and simulation runs
 *
 * Simulation-only engine. No production Guardian data modified.
 * All metrics are aggregates (counts, scores). No PII or raw payloads stored.
 */

-- ============================================================
-- Remediation Playbooks Table
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_remediation_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Playbook identification
  name TEXT NOT NULL,
  description TEXT NULL,
  category TEXT NOT NULL DEFAULT 'guardian_core',
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Remediation config (JSON DSL)
  config JSONB NOT NULL,

  -- Audit
  created_by TEXT NULL,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Uniqueness constraint
  CONSTRAINT uq_playbook_per_tenant UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_remediation_playbooks_tenant_active
  ON guardian_remediation_playbooks(tenant_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_remediation_playbooks_tenant_category
  ON guardian_remediation_playbooks(tenant_id, category);

-- ============================================================
-- Simulation Runs Table
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_remediation_simulation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES guardian_remediation_playbooks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Execution timeline
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ NULL,

  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'running',

  -- Baseline metrics (aggregate, PII-free)
  baseline_metrics JSONB NOT NULL,

  -- Simulated metrics (aggregate, PII-free)
  simulated_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Delta metrics (percentage and absolute changes)
  delta_metrics JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Overall effect classification
  overall_effect TEXT NULL,

  -- Human-readable summary
  summary TEXT NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Validation
  CONSTRAINT status_valid CHECK (status IN ('running', 'completed', 'failed')),
  CONSTRAINT effect_valid CHECK (overall_effect IS NULL OR overall_effect IN ('positive', 'neutral', 'negative'))
);

CREATE INDEX IF NOT EXISTS idx_sim_runs_tenant_created
  ON guardian_remediation_simulation_runs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sim_runs_tenant_playbook
  ON guardian_remediation_simulation_runs(tenant_id, playbook_id);
CREATE INDEX IF NOT EXISTS idx_sim_runs_tenant_status
  ON guardian_remediation_simulation_runs(tenant_id, status);

-- ============================================================
-- RLS Policies
-- ============================================================

ALTER TABLE guardian_remediation_playbooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_playbooks" ON guardian_remediation_playbooks;
CREATE POLICY "tenant_isolation_playbooks" ON guardian_remediation_playbooks
FOR ALL USING (tenant_id = get_current_workspace_id());

ALTER TABLE guardian_remediation_simulation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_sim_runs" ON guardian_remediation_simulation_runs;
CREATE POLICY "tenant_isolation_sim_runs" ON guardian_remediation_simulation_runs
FOR ALL USING (tenant_id = get_current_workspace_id());

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE guardian_remediation_playbooks IS
  'Tenant-scoped remediation playbooks for auto-remediation simulator. Each playbook defines proposed remediation actions (rule threshold adjustments, correlation tweaks, notification suppressions) to be evaluated in a simulation-only context. Config is JSON DSL; no auto-apply.';

COMMENT ON COLUMN guardian_remediation_playbooks.config IS
  'JSON DSL describing remediation actions. Format: { actions: [ { type: string; params: {...} } ]; notes?: string }. Supported types: adjust_rule_threshold, disable_rule, adjust_correlation_window, increase_min_link_count, suppress_notification_channel.';

COMMENT ON TABLE guardian_remediation_simulation_runs IS
  'Results of remediation simulation runs. Captures baseline metrics before remediation, simulated metrics after virtual remediation application, and delta metrics (impact). All metrics are aggregates (counts, scores); no raw payloads or PII.';

COMMENT ON COLUMN guardian_remediation_simulation_runs.baseline_metrics IS
  'Aggregate metrics before remediation: { alerts, incidents, correlations, notifications, avg_risk_score }. PII-free, counts only.';

COMMENT ON COLUMN guardian_remediation_simulation_runs.simulated_metrics IS
  'Aggregate metrics after virtual remediation: same structure as baseline_metrics. Simulated using Guardian pipeline emulator; production not affected.';

COMMENT ON COLUMN guardian_remediation_simulation_runs.delta_metrics IS
  'Computed impact: { alerts_delta, alerts_pct, incidents_delta, incidents_pct, ... }. Positive values = reduction (improvement), negative = increase.';

COMMENT ON COLUMN guardian_remediation_simulation_runs.overall_effect IS
  'Classification of remediation impact: positive (improvements > threshold), neutral (±threshold), negative (degradations). Computed from delta_metrics.';
