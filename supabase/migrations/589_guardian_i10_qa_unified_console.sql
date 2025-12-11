/**
 * Guardian I10: Unified QA Console & I-Series Finalization
 *
 * Tenant-scoped QA feature flags and cross-I-series audit event logging.
 * Enables fine-grained control of QA capabilities and comprehensive audit trail.
 */

-- QA Feature Flags table
-- One row per tenant, controls which QA features are enabled
CREATE TABLE IF NOT EXISTS guardian_qa_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  enable_simulation BOOLEAN NOT NULL DEFAULT true,
  enable_regression BOOLEAN NOT NULL DEFAULT true,
  enable_chaos BOOLEAN NOT NULL DEFAULT false,
  enable_gatekeeper BOOLEAN NOT NULL DEFAULT false,
  enable_training BOOLEAN NOT NULL DEFAULT false,
  enable_performance BOOLEAN NOT NULL DEFAULT false,
  enable_coverage BOOLEAN NOT NULL DEFAULT true,
  enable_drift_monitor BOOLEAN NOT NULL DEFAULT true,
  enable_ai_scoring BOOLEAN NOT NULL DEFAULT false,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated_by TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- QA Audit Events table
-- Cross-I-series audit trail for all QA operations
-- Details and metadata contain only IDs, counts, severities, and labels — NO PII or raw payloads
CREATE TABLE IF NOT EXISTS guardian_qa_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id TEXT NULL,
  source TEXT NOT NULL, -- 'simulation', 'regression', 'chaos', 'gatekeeper', 'training', 'performance', 'coverage', 'qa_scheduler'
  source_id TEXT NULL, -- referenced entity id (e.g. scenario_id, regression_run_id, gate_decision_id)
  event_type TEXT NOT NULL, -- e.g. 'qa_run_started', 'qa_run_completed', 'gate_decision', 'drift_report_created', 'slo_failed'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info' | 'warning' | 'critical'
  summary TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb, -- ID/count/severity only, NO PII
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on QA feature flags
ALTER TABLE guardian_qa_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_qa_flags"
ON guardian_qa_feature_flags
FOR ALL
USING (tenant_id IN (SELECT get_user_workspaces()));

-- Enable RLS on QA audit events
ALTER TABLE guardian_qa_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_qa_audit"
ON guardian_qa_audit_events
FOR ALL
USING (tenant_id IN (SELECT get_user_workspaces()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_qa_flags_tenant ON guardian_qa_feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_qa_audit_tenant_time ON guardian_qa_audit_events(tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_audit_tenant_source ON guardian_qa_audit_events(tenant_id, source, event_type);
CREATE INDEX IF NOT EXISTS idx_qa_audit_severity ON guardian_qa_audit_events(tenant_id, severity) WHERE severity IN ('warning', 'critical');

-- Comment for clarity
COMMENT ON TABLE guardian_qa_feature_flags IS 'Tenant-scoped feature flags controlling Guardian QA module availability (I01-I09)';
COMMENT ON TABLE guardian_qa_audit_events IS 'Cross-I-series audit trail for QA operations. Details/metadata contain only IDs, counts, and labels — NO PII or raw payloads.';
COMMENT ON COLUMN guardian_qa_audit_events.details IS 'Audit details: IDs, counts, severities, labels only. Never raw payloads or PII.';
COMMENT ON COLUMN guardian_qa_audit_events.metadata IS 'Additional audit context: same restrictions apply — IDs and labels only.';
