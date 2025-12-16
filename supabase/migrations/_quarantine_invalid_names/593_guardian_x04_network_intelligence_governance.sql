-- =====================================================
-- MIGRATION 593: Guardian X04 — Network Intelligence Governance
-- =====================================================
-- Tenant-scoped feature flags and governance/audit event tracking for X-series
-- Network Intelligence suite (X01–X04). Defaults are conservative (opt-in).

-- =====================================================
-- X-SERIES FEATURE FLAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS guardian_network_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Network Telemetry (X01): enable ingestion of anonymized hourly metrics
  enable_network_telemetry BOOLEAN NOT NULL DEFAULT false,
  -- Network Benchmarks (X01/X02): enable access to cohort-level benchmarks
  enable_network_benchmarks BOOLEAN NOT NULL DEFAULT false,
  -- Network Anomalies (X02): enable access to anomaly detection views
  enable_network_anomalies BOOLEAN NOT NULL DEFAULT false,
  -- Network Early Warnings (X03): enable access to pattern-based early warnings
  enable_network_early_warnings BOOLEAN NOT NULL DEFAULT false,
  -- AI Hints: enable AI-generated suggestions in Network console
  enable_ai_hints BOOLEAN NOT NULL DEFAULT false,
  -- Cohort Metadata Sharing: allow region/vertical data in cohort derivation
  enable_cohort_metadata_sharing BOOLEAN NOT NULL DEFAULT false,
  -- Audit fields
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated_by TEXT,
  -- Additional metadata (no PII)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Index for tenant lookups
  CONSTRAINT uq_x04_feature_flags_tenant UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_x04_flags_tenant ON guardian_network_feature_flags(tenant_id);

-- Enable RLS on feature flags
ALTER TABLE guardian_network_feature_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant can only see their own feature flags
DROP POLICY IF EXISTS "tenant_isolation_feature_flags" ON guardian_network_feature_flags;

CREATE POLICY "tenant_isolation_feature_flags" ON guardian_network_feature_flags
FOR ALL USING (tenant_id = get_current_workspace_id());

-- =====================================================
-- GOVERNANCE & AUDIT EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS guardian_network_governance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- When the event occurred
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Who triggered the event (user ID or system)
  actor_id TEXT,
  -- Type of governance event
  event_type TEXT NOT NULL,
  -- 'opt_in', 'opt_out', 'flags_changed', 'policy_acknowledged', 'consent_granted'
  -- Which X-series feature this concerns
  context TEXT NOT NULL,
  -- 'network_telemetry', 'benchmarks', 'anomalies', 'early_warnings', 'ai_hints', 'cohort_metadata'
  -- Event details (no PII, no raw payloads)
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- e.g., { "previous_state": false, "new_state": true, "reason": "admin_request" }
  -- Additional context
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Indexes for efficient queries
  CONSTRAINT fk_x04_governance_tenant FOREIGN KEY (tenant_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_x04_governance_tenant_date ON guardian_network_governance_events(
  tenant_id,
  occurred_at DESC,
  event_type
);

CREATE INDEX IF NOT EXISTS idx_x04_governance_event_type ON guardian_network_governance_events(event_type, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_x04_governance_context ON guardian_network_governance_events(context, occurred_at DESC);

-- Enable RLS on governance events
ALTER TABLE guardian_network_governance_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant can only see their own governance events
DROP POLICY IF EXISTS "tenant_isolation_governance_events" ON guardian_network_governance_events;

CREATE POLICY "tenant_isolation_governance_events" ON guardian_network_governance_events
FOR ALL USING (tenant_id = get_current_workspace_id());

-- =====================================================
-- DOCUMENTATION
-- =====================================================
COMMENT ON TABLE guardian_network_feature_flags IS
E'Tenant-scoped configuration for X-series Network Intelligence features. Defaults are conservative (all false). Tenants must opt-in to participate in telemetry, benchmarks, anomalies, and early warnings.';

COMMENT ON TABLE guardian_network_governance_events IS
E'Audit trail of X-series feature flag changes, opt-in/out events, and policy acknowledgments. Used for compliance, troubleshooting, and transparency.';

COMMENT ON COLUMN guardian_network_feature_flags.enable_network_telemetry IS
E'If true, tenant\'s hourly metrics are ingested into guardian_network_telemetry_hourly for aggregation and cohort analysis. Default: false (opt-in).';

COMMENT ON COLUMN guardian_network_feature_flags.enable_network_benchmarks IS
E'If true, tenant can view cohort benchmarks and compare metrics against anonymized cohorts (X01). Requires enable_network_telemetry=true. Default: false.';

COMMENT ON COLUMN guardian_network_feature_flags.enable_network_anomalies IS
E'If true, tenant can view anomaly detection results (X02) and historical anomaly patterns. Default: false (opt-in).';

COMMENT ON COLUMN guardian_network_feature_flags.enable_network_early_warnings IS
E'If true, tenant can view early-warning signals derived from pattern matching (X03). Default: false (opt-in).';

COMMENT ON COLUMN guardian_network_feature_flags.enable_ai_hints IS
E'If true, AI-generated suggestions and explanations may be shown in Network console. Default: false (conservative, AI suggestions are optional).';

COMMENT ON COLUMN guardian_network_feature_flags.enable_cohort_metadata_sharing IS
E'If true, tenant\'s region/vertical/size metadata is used to compute cohorts for benchmarks and patterns. If false, tenant is treated as global-only. Default: false.';

COMMENT ON COLUMN guardian_network_governance_events.event_type IS
E'Type of governance action: opt_in/opt_out (direct consent), flags_changed (admin/operator changed settings), policy_acknowledged (tenant reviewed docs).';

COMMENT ON COLUMN guardian_network_governance_events.context IS
E'Which X-series feature is affected by this event: network_telemetry, benchmarks, anomalies, early_warnings, ai_hints, cohort_metadata.';

COMMENT ON COLUMN guardian_network_governance_events.details IS
E'Non-PII details of the event, e.g., { "previous_state": false, "new_state": true, "reason": "compliance_requirement" }. Never includes raw payloads or tenant identifiers.';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== MIGRATION 593: X04 GOVERNANCE ===';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - guardian_network_feature_flags (tenant-scoped, RLS enabled)';
  RAISE NOTICE '  - guardian_network_governance_events (audit trail, RLS enabled)';
  RAISE NOTICE 'Default behavior: All features OPT-IN (false)';
  RAISE NOTICE '✅ Governance foundation ready for Network Intelligence';
  RAISE NOTICE '========================================';
END $$;
