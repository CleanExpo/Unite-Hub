/**
 * Guardian I06: Recommendation Impact Tracking + Drift Detection
 *
 * Inputs (read-only):
 * - guardian_remediation_simulation_runs (I04)
 * - guardian_remediation_recommendations (I05)
 *
 * Outputs (new, append-only):
 * - guardian_remediation_recommendation_impacts
 * - guardian_remediation_drift_events
 *
 * Tenancy:
 * - workspace_id maps to workspaces.id
 * - Access enforced via get_current_workspace_id()
 *
 * Safety:
 * - Aggregate-only snapshots (delta-only)
 * - No PII
 * - No mutation of I04/I05 rows
 */

-- ============================================================
-- A) Impact snapshots
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_remediation_recommendation_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES guardian_remediation_recommendations(id) ON DELETE CASCADE,
  observed_at TIMESTAMPTZ NOT NULL,
  score_at_time INTEGER NOT NULL,
  confidence_at_time NUMERIC(3,2) NOT NULL,
  effect TEXT NOT NULL,
  metrics_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT impact_score_range CHECK (score_at_time >= 0 AND score_at_time <= 100),
  CONSTRAINT impact_confidence_range CHECK (confidence_at_time >= 0 AND confidence_at_time <= 1),
  CONSTRAINT impact_effect_valid CHECK (effect IN ('positive', 'neutral', 'negative'))
);

CREATE INDEX IF NOT EXISTS idx_rec_impacts_workspace_rec_observed
  ON guardian_remediation_recommendation_impacts(workspace_id, recommendation_id, observed_at DESC);

-- ============================================================
-- B) Drift events
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_remediation_drift_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES guardian_remediation_recommendations(id) ON DELETE CASCADE,
  detected_at TIMESTAMPTZ NOT NULL,
  drift_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT drift_type_valid CHECK (drift_type IN ('score_decay', 'confidence_drop', 'effect_flip', 'stale')),
  CONSTRAINT drift_severity_valid CHECK (severity IN ('low', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_drift_events_workspace_detected
  ON guardian_remediation_drift_events(workspace_id, detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_drift_events_workspace_type
  ON guardian_remediation_drift_events(workspace_id, drift_type);

-- ============================================================
-- RLS Policies (tenant isolation via get_current_workspace_id())
-- ============================================================

ALTER TABLE guardian_remediation_recommendation_impacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_rec_impacts" ON guardian_remediation_recommendation_impacts;
CREATE POLICY "tenant_isolation_rec_impacts" ON guardian_remediation_recommendation_impacts
FOR ALL USING (workspace_id = get_current_workspace_id());

ALTER TABLE guardian_remediation_drift_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_drift_events" ON guardian_remediation_drift_events;
CREATE POLICY "tenant_isolation_drift_events" ON guardian_remediation_drift_events
FOR ALL USING (workspace_id = get_current_workspace_id());

-- ============================================================
-- Comments
-- ============================================================

COMMENT ON TABLE guardian_remediation_recommendation_impacts IS
  'Append-only time-series snapshots of I05 recommendation score/confidence/effect and aggregate delta metrics. Used for drift detection; no enforcement.';

COMMENT ON TABLE guardian_remediation_drift_events IS
  'Append-only drift events derived from impact snapshots and simulation freshness rules. Deterministic, aggregate-only, workspace-scoped.';

