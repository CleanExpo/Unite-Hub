/**
 * Guardian I08: QA Coverage Map & Blind-Spot Detector
 *
 * Defines tenant-scoped tables for coverage tracking and blind-spot detection:
 * - guardian_qa_coverage_snapshots: Point-in-time coverage indices
 * - guardian_qa_coverage_items: Coverage details for individual rules/playbooks/scenarios
 *
 * All tables use RLS to enforce tenant isolation.
 * No writes to Guardian runtime tables (read-only analytics layer).
 */

-- guardian_qa_coverage_snapshots: Point-in-time coverage indices
CREATE TABLE IF NOT EXISTS guardian_qa_coverage_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  snapshot_date TIMESTAMP NOT NULL,

  -- Aggregate coverage metrics (0.0 - 1.0)
  rules_coverage NUMERIC NOT NULL,
  playbooks_coverage NUMERIC NOT NULL,
  scenarios_coverage NUMERIC NOT NULL,
  regression_packs_coverage NUMERIC NOT NULL,
  playbook_sims_coverage NUMERIC NOT NULL,
  drills_coverage NUMERIC NOT NULL,

  -- Overall score
  overall_coverage NUMERIC NOT NULL,

  -- Blind spot counts
  critical_blind_spots_count INTEGER NOT NULL DEFAULT 0,
  high_blind_spots_count INTEGER NOT NULL DEFAULT 0,
  medium_blind_spots_count INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  total_rules INTEGER NOT NULL DEFAULT 0,
  total_playbooks INTEGER NOT NULL DEFAULT 0,
  total_scenarios INTEGER NOT NULL DEFAULT 0,
  total_regression_packs INTEGER NOT NULL DEFAULT 0,
  total_playbook_sims INTEGER NOT NULL DEFAULT 0,
  total_drills INTEGER NOT NULL DEFAULT 0,

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_qa_coverage_snapshots_tenant_date
  ON guardian_qa_coverage_snapshots(tenant_id, snapshot_date DESC);

-- Row-level security for snapshots
ALTER TABLE guardian_qa_coverage_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qa_coverage_snapshots_tenant_isolation" ON guardian_qa_coverage_snapshots;
CREATE POLICY "qa_coverage_snapshots_tenant_isolation" ON guardian_qa_coverage_snapshots
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));

-- guardian_qa_coverage_items: Coverage details for individual entities
CREATE TABLE IF NOT EXISTS guardian_qa_coverage_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  snapshot_id UUID NOT NULL REFERENCES guardian_qa_coverage_snapshots(id) ON DELETE CASCADE,

  -- Entity identification
  entity_type TEXT NOT NULL, -- 'rule' | 'playbook' | 'scenario' | 'regression_pack' | 'playbook_sim' | 'drill'
  entity_id UUID NOT NULL,
  entity_name TEXT NOT NULL,

  -- Risk classification
  risk_level TEXT NOT NULL, -- 'low' | 'medium' | 'high' | 'critical'

  -- Coverage data
  coverage_score NUMERIC NOT NULL, -- 0.0 - 1.0
  is_blind_spot BOOLEAN NOT NULL DEFAULT false,

  -- Test coverage breakdown
  tested_by_scenarios INTEGER NOT NULL DEFAULT 0,
  tested_by_regression_packs INTEGER NOT NULL DEFAULT 0,
  tested_by_playbook_sims INTEGER NOT NULL DEFAULT 0,
  tested_by_drills INTEGER NOT NULL DEFAULT 0,
  total_test_instances INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  last_tested_at TIMESTAMPTZ,
  test_frequency_days INTEGER, -- average days between tests
  consecutive_uncovered_days INTEGER, -- days since last coverage

  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qa_coverage_items_tenant_entity
  ON guardian_qa_coverage_items(tenant_id, entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_qa_coverage_items_blind_spots
  ON guardian_qa_coverage_items(tenant_id, is_blind_spot, risk_level)
  WHERE is_blind_spot = true;

CREATE INDEX IF NOT EXISTS idx_qa_coverage_items_snapshot
  ON guardian_qa_coverage_items(snapshot_id, risk_level DESC);

-- Row-level security for items
ALTER TABLE guardian_qa_coverage_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "qa_coverage_items_tenant_isolation" ON guardian_qa_coverage_items;
CREATE POLICY "qa_coverage_items_tenant_isolation" ON guardian_qa_coverage_items
FOR ALL USING (tenant_id IN (SELECT get_user_workspaces()));

-- Summary view for current snapshot per tenant
CREATE OR REPLACE VIEW guardian_qa_coverage_current AS
SELECT
  s.id,
  s.tenant_id,
  s.snapshot_date,
  s.overall_coverage,
  s.critical_blind_spots_count,
  s.high_blind_spots_count,
  s.medium_blind_spots_count,
  s.total_rules,
  s.total_playbooks,
  s.total_scenarios,
  s.total_regression_packs,
  s.total_playbook_sims,
  s.total_drills,
  s.created_at
FROM guardian_qa_coverage_snapshots s
WHERE (s.tenant_id, s.created_at) IN (
  SELECT tenant_id, MAX(created_at)
  FROM guardian_qa_coverage_snapshots
  GROUP BY tenant_id
);

-- Blind spots detail view
CREATE OR REPLACE VIEW guardian_qa_coverage_blind_spots AS
SELECT
  i.tenant_id,
  i.entity_type,
  i.entity_id,
  i.entity_name,
  i.risk_level,
  i.coverage_score,
  i.last_tested_at,
  i.consecutive_uncovered_days,
  i.metadata,
  s.snapshot_date
FROM guardian_qa_coverage_items i
JOIN guardian_qa_coverage_snapshots s ON i.snapshot_id = s.id
WHERE i.is_blind_spot = true
ORDER BY i.risk_level DESC, i.consecutive_uncovered_days DESC;
