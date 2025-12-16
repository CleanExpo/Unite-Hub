/**
 * Phase D77: Unite Schema Drift & Auto-Migration Engine
 *
 * Schema snapshot comparison + drift detection.
 * CRITICAL: No auto-apply without simulation.
 */

-- ============================================================================
-- SCHEMA SNAPSHOTS (point-in-time DB schema capture)
-- ============================================================================

DROP TABLE IF EXISTS unite_schema_snapshots CASCADE;

CREATE TABLE unite_schema_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot jsonb NOT NULL,
  tenant_id uuid,
  captured_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_schema_snapshots_tenant ON unite_schema_snapshots(tenant_id, captured_at DESC);
CREATE INDEX idx_unite_schema_snapshots_captured ON unite_schema_snapshots(captured_at DESC);

COMMENT ON TABLE unite_schema_snapshots IS 'Point-in-time database schema snapshots';
COMMENT ON COLUMN unite_schema_snapshots.snapshot IS 'Full schema: {tables, columns, indexes, constraints, relationships}';

-- ============================================================================
-- SCHEMA DRIFT REPORTS (detected differences + recommendations)
-- ============================================================================

DROP TABLE IF EXISTS unite_schema_drift_reports CASCADE;

CREATE TABLE unite_schema_drift_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  differences jsonb NOT NULL,
  recommended_actions jsonb,
  ai_reasoning jsonb,
  tenant_id uuid,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_unite_schema_drift_reports_tenant ON unite_schema_drift_reports(tenant_id, generated_at DESC);
CREATE INDEX idx_unite_schema_drift_reports_generated ON unite_schema_drift_reports(generated_at DESC);

COMMENT ON TABLE unite_schema_drift_reports IS 'Schema drift detection reports with AI recommendations';
COMMENT ON COLUMN unite_schema_drift_reports.differences IS 'Detected diffs: {added_tables, removed_tables, modified_columns, index_changes}';
COMMENT ON COLUMN unite_schema_drift_reports.recommended_actions IS 'Migration steps: {sql_statements, risk_level, rollback_plan}';
COMMENT ON COLUMN unite_schema_drift_reports.ai_reasoning IS 'AI analysis: {impact_assessment, breaking_changes, migration_strategy}';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE unite_schema_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_schema_drift_reports ENABLE ROW LEVEL SECURITY;

-- Schema Snapshots
CREATE POLICY "Users can view schema snapshots for their tenant"
  ON unite_schema_snapshots FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage schema snapshots for their tenant"
  ON unite_schema_snapshots FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

-- Schema Drift Reports
CREATE POLICY "Users can view schema drift reports for their tenant"
  ON unite_schema_drift_reports FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);

CREATE POLICY "Users can manage schema drift reports for their tenant"
  ON unite_schema_drift_reports FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid OR tenant_id IS NULL);
