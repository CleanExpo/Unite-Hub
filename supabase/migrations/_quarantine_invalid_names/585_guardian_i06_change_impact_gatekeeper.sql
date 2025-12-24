/**
 * Guardian I06: Change Impact Gatekeeper
 * Migration: 585
 * Purpose: Add change set tracking and gate decision tables for pre-deployment validation
 *
 * Non-destructive: These tables are isolated from core Guardian runtime.
 * RLS enforced: All tables use tenant_id filtering.
 * Read-only on Guardian config: Only records changes, does not modify rules/playbooks/thresholds.
 */

-- ============================================================================
-- TABLE: guardian_change_sets
-- ============================================================================
-- Stores high-level Guardian config changes captured for gatekeeper evaluation
-- Designed for CI/CD integration and manual change tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_change_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'ci', 'api', 'script')),
  source_ref TEXT,  -- e.g., commit hash, PR id, pipeline run id
  change_type TEXT NOT NULL CHECK (change_type IN ('rules', 'playbooks', 'thresholds', 'mixed')),
  description TEXT,
  diff JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { rules: {added, removed, modified}, playbooks: {added, removed, modified}, thresholds: {added, removed, modified}, impactHints: [] }
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT valid_diff CHECK (diff IS NOT NULL)
);

-- ============================================================================
-- TABLE: guardian_gate_decisions
-- ============================================================================
-- Stores evaluation results and gate decisions for change sets
-- Tracks regression runs, QA schedules, and drift reports used in evaluation
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_gate_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  change_set_id UUID NOT NULL REFERENCES guardian_change_sets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'evaluated', 'failed')),
  decision TEXT CHECK (decision IS NULL OR decision IN ('allow', 'block', 'warn')),
  reason TEXT,
  regression_run_id UUID,  -- Reference to guardian_regression_runs (I03) if available
  qa_schedule_id UUID,     -- Reference to guardian_qa_schedules (I05) if available
  drift_report_id UUID,    -- Reference to guardian_qa_drift_reports (I05) if available
  summary JSONB,  -- { metrics, flags, selectedPacks, selectedSchedules, evaluationTime }
  error_message TEXT,
  created_by TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_guardian_change_sets_tenant_created
  ON guardian_change_sets (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_change_sets_tenant_source
  ON guardian_change_sets (tenant_id, source);

CREATE INDEX IF NOT EXISTS idx_guardian_gate_decisions_tenant_created
  ON guardian_gate_decisions (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guardian_gate_decisions_tenant_status
  ON guardian_gate_decisions (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_guardian_gate_decisions_change_set
  ON guardian_gate_decisions (change_set_id);

CREATE INDEX IF NOT EXISTS idx_guardian_gate_decisions_decision
  ON guardian_gate_decisions (tenant_id, decision);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE guardian_change_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_gate_decisions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gatekeeper_change_sets_tenant_isolation ON guardian_change_sets;
CREATE POLICY gatekeeper_change_sets_tenant_isolation
  ON guardian_change_sets
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()))
  WITH CHECK (tenant_id IN (SELECT get_user_workspaces()));

DROP POLICY IF EXISTS gatekeeper_gate_decisions_tenant_isolation ON guardian_gate_decisions;
CREATE POLICY gatekeeper_gate_decisions_tenant_isolation
  ON guardian_gate_decisions
  FOR ALL
  USING (tenant_id IN (SELECT get_user_workspaces()))
  WITH CHECK (tenant_id IN (SELECT get_user_workspaces()));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE guardian_change_sets IS 'High-level Guardian config changes (rules, playbooks, thresholds) captured for gatekeeper evaluation. Read-only snapshots, no PII.';
COMMENT ON TABLE guardian_gate_decisions IS 'Gate evaluation results and pass/fail/warn decisions. Links to regression runs, QA schedules, and drift reports used in evaluation.';
COMMENT ON COLUMN guardian_change_sets.diff IS 'Change diff: { rules: {added, removed, modified}, playbooks: {added, removed, modified}, thresholds: {added, removed, modified}, impactHints: [] }. No PII, only identifiers and counts.';
COMMENT ON COLUMN guardian_gate_decisions.status IS 'pending: awaiting evaluation; evaluated: evaluation complete; failed: evaluation error.';
COMMENT ON COLUMN guardian_gate_decisions.decision IS 'allow: proceed with deployment; block: fail pre-deployment check; warn: proceed but flag risk.';
COMMENT ON COLUMN guardian_gate_decisions.summary IS 'Evaluation summary: { metrics, flags, selectedPacks, selectedSchedules, evaluationTime }. Aggregates from regression and drift runs.';
