-- Migration 174: Evolution QA & Regression Guard
-- Phase 131: Validates evolution tasks don't degrade performance, safety, or alignment

-- Regression checks table
CREATE TABLE IF NOT EXISTS evolution_regression_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  task_id UUID,
  check_type TEXT NOT NULL CHECK (check_type IN ('pre_execution', 'post_execution', 'periodic')),
  baseline_metrics JSONB NOT NULL,
  current_metrics JSONB NOT NULL,
  regressions_detected JSONB DEFAULT '[]',
  core_kpis_impacted BOOLEAN DEFAULT false,
  blocked BOOLEAN DEFAULT false,
  block_reason TEXT,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_regression_checks_tenant ON evolution_regression_checks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_regression_checks_task ON evolution_regression_checks(task_id);
CREATE INDEX IF NOT EXISTS idx_regression_checks_blocked ON evolution_regression_checks(blocked);

-- RLS
ALTER TABLE evolution_regression_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view regression checks" ON evolution_regression_checks;
CREATE POLICY "Users can view regression checks" ON evolution_regression_checks
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert regression checks" ON evolution_regression_checks;
CREATE POLICY "Users can insert regression checks" ON evolution_regression_checks
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
