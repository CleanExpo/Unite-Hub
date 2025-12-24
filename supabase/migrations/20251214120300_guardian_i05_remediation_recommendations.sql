/**
 * Guardian I05 – Remediation Effectiveness Scoring + Recommendation Engine
 *
 * Source: quarantined legacy file `guardian_i05_remediation_recommendations.sql`
 * Idempotency:
 * - CREATE TABLE/INDEX IF NOT EXISTS
 * - DROP POLICY IF EXISTS before CREATE POLICY
 */

-- ============================================================
-- Recommendations Table
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_remediation_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES guardian_remediation_playbooks(id) ON DELETE CASCADE,
  simulation_run_id UUID NOT NULL REFERENCES guardian_remediation_simulation_runs(id) ON DELETE CASCADE,

  score NUMERIC NOT NULL,
  confidence NUMERIC NOT NULL,
  effect TEXT NOT NULL,
  rationale TEXT NOT NULL,
  metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT rec_score_range CHECK (score >= 0 AND score <= 100),
  CONSTRAINT rec_confidence_range CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT rec_effect_valid CHECK (effect IN ('positive', 'neutral', 'negative')),
  CONSTRAINT uq_rec_per_run UNIQUE (workspace_id, simulation_run_id)
);

CREATE INDEX IF NOT EXISTS idx_remediation_recs_by_workspace
  ON guardian_remediation_recommendations(workspace_id);

CREATE INDEX IF NOT EXISTS idx_remediation_recs_by_workspace_score
  ON guardian_remediation_recommendations(workspace_id, score DESC);

-- ============================================================
-- RLS Policies (tenant isolation via get_current_workspace_id())
-- ============================================================

ALTER TABLE guardian_remediation_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_remediation_recs" ON guardian_remediation_recommendations;
CREATE POLICY "tenant_isolation_remediation_recs" ON guardian_remediation_recommendations
FOR ALL USING (workspace_id = get_current_workspace_id());

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE guardian_remediation_recommendations IS
  'Deterministic, aggregate-only remediation recommendations derived from completed I04 simulation runs. Workspace-scoped; no raw events/payloads/PII.';

COMMENT ON COLUMN guardian_remediation_recommendations.metrics_snapshot IS
  'Aggregate-only snapshot of delta metrics used for scoring (counts/scores/percentages only). No raw events or identifiers.';

