-- =====================================================
-- MIGRATION 594: Guardian X05 — Network Lifecycle & Compliance
-- =====================================================
-- Tenant-scoped retention policies and global lifecycle audit for X01–X04 artifacts.
-- Enables configurable data retention with privacy-friendly defaults and cleanup tracking.

-- =====================================================
-- RETENTION POLICIES TABLE (TENANT-SCOPED)
-- =====================================================
CREATE TABLE IF NOT EXISTS guardian_network_retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  -- X01: Hourly telemetry retention (days)
  telemetry_retention_days INTEGER NOT NULL DEFAULT 90,
  -- X01: Daily aggregate retention (days)
  aggregates_retention_days INTEGER NOT NULL DEFAULT 365,
  -- X02: Anomaly signals retention (days)
  anomalies_retention_days INTEGER NOT NULL DEFAULT 180,
  -- X02: Benchmark snapshots retention (days)
  benchmarks_retention_days INTEGER NOT NULL DEFAULT 365,
  -- X03: Early warnings retention (days)
  early_warnings_retention_days INTEGER NOT NULL DEFAULT 365,
  -- X04: Governance events retention (days)
  governance_retention_days INTEGER NOT NULL DEFAULT 730,
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Constraint: days must be within reasonable bounds
  CONSTRAINT check_retention_bounds CHECK (
    telemetry_retention_days >= 30
    AND telemetry_retention_days <= 3650
    AND aggregates_retention_days >= 30
    AND aggregates_retention_days <= 3650
    AND anomalies_retention_days >= 30
    AND anomalies_retention_days <= 3650
    AND benchmarks_retention_days >= 30
    AND benchmarks_retention_days <= 3650
    AND early_warnings_retention_days >= 30
    AND early_warnings_retention_days <= 3650
    AND governance_retention_days >= 30
    AND governance_retention_days <= 3650
  )
);

CREATE INDEX IF NOT EXISTS idx_x05_retention_tenant ON guardian_network_retention_policies(tenant_id);

-- Enable RLS on retention policies
ALTER TABLE guardian_network_retention_policies ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant can only see their own retention policy
DROP POLICY IF EXISTS "tenant_isolation_retention_policies" ON guardian_network_retention_policies;

CREATE POLICY "tenant_isolation_retention_policies" ON guardian_network_retention_policies
FOR ALL USING (tenant_id = get_current_workspace_id());

-- =====================================================
-- LIFECYCLE AUDIT LOG (GLOBAL, WITH TENANT SCOPE)
-- =====================================================
CREATE TABLE IF NOT EXISTS guardian_network_lifecycle_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Scope: which X-series artifact category was affected
  scope TEXT NOT NULL,
  -- 'telemetry', 'aggregates', 'anomalies', 'benchmarks', 'early_warnings', 'governance', 'patterns'
  -- Action: what operation was performed
  action TEXT NOT NULL,
  -- 'delete', 'soft_delete', 'policy_update', 'dry_run'
  -- Which tenant was affected (NULL for global operations like pattern cleanup)
  tenant_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  -- How many items were affected by this operation
  items_affected BIGINT NOT NULL DEFAULT 0,
  -- Optional: date range of deleted data
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  -- Operation details (no PII or raw payloads)
  detail TEXT,
  -- Additional metadata (no sensitive data)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_x05_lifecycle_scope_date ON guardian_network_lifecycle_audit(scope, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_x05_lifecycle_tenant_date ON guardian_network_lifecycle_audit(
  tenant_id,
  occurred_at DESC
) WHERE tenant_id IS NOT NULL;

-- Enable RLS on lifecycle audit
ALTER TABLE guardian_network_lifecycle_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant can see their own lifecycle events + global (NULL tenant) events
DROP POLICY IF EXISTS "tenant_isolation_lifecycle_audit" ON guardian_network_lifecycle_audit;

CREATE POLICY "tenant_isolation_lifecycle_audit" ON guardian_network_lifecycle_audit
FOR SELECT USING (tenant_id = get_current_workspace_id() OR tenant_id IS NULL);

-- =====================================================
-- DOCUMENTATION
-- =====================================================
COMMENT ON TABLE guardian_network_retention_policies IS
E'Tenant-scoped retention configuration for X-series data. Defaults are privacy-friendly (shorter retention preferred). Tenants can customize retention windows per data category.';

COMMENT ON TABLE guardian_network_lifecycle_audit IS
E'Immutable append-only audit log of X-series lifecycle operations (deletes, policy updates, cleanup runs). Used for compliance, observability, and troubleshooting.';

COMMENT ON COLUMN guardian_network_retention_policies.telemetry_retention_days IS
E'How many days to retain X01 hourly telemetry data. Default 90 days (3 months).';

COMMENT ON COLUMN guardian_network_retention_policies.aggregates_retention_days IS
E'How many days to retain X01 daily aggregates/benchmarks. Default 365 days (1 year).';

COMMENT ON COLUMN guardian_network_retention_policies.anomalies_retention_days IS
E'How many days to retain X02 anomaly signals. Default 180 days (6 months).';

COMMENT ON COLUMN guardian_network_retention_policies.benchmarks_retention_days IS
E'How many days to retain X02 benchmark snapshots. Default 365 days (1 year).';

COMMENT ON COLUMN guardian_network_retention_policies.early_warnings_retention_days IS
E'How many days to retain X03 early warning signals. Default 365 days (1 year). Applies to all statuses.';

COMMENT ON COLUMN guardian_network_retention_policies.governance_retention_days IS
E'How many days to retain X04 governance events (audit trail). Default 730 days (2 years) for compliance.';

COMMENT ON COLUMN guardian_network_lifecycle_audit.scope IS
E'Which X-series category was affected: telemetry, aggregates, anomalies, benchmarks, early_warnings, governance, patterns.';

COMMENT ON COLUMN guardian_network_lifecycle_audit.action IS
E'Type of lifecycle operation: delete (permanent removal), dry_run (inspection only), policy_update (retention config changed).';

COMMENT ON COLUMN guardian_network_lifecycle_audit.tenant_id IS
E'Tenant affected by this operation (NULL for global operations like pattern cleanup).';

COMMENT ON COLUMN guardian_network_lifecycle_audit.items_affected IS
E'Number of rows/items deleted or affected by this lifecycle operation.';

COMMENT ON COLUMN guardian_network_lifecycle_audit.detail IS
E'Human-readable summary of the operation (no PII, no raw payloads). E.g., "deleted telemetry older than 90 days".';

-- =====================================================
-- VERIFICATION
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '=== MIGRATION 594: X05 LIFECYCLE ===';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - guardian_network_retention_policies (tenant-scoped, RLS enabled)';
  RAISE NOTICE '  - guardian_network_lifecycle_audit (global audit trail, RLS enabled)';
  RAISE NOTICE 'Default retention: 90d telemetry, 365d aggregates/benchmarks/warnings, 180d anomalies, 730d governance';
  RAISE NOTICE '✅ Data lifecycle foundation ready for X-series cleanup';
  RAISE NOTICE '========================================';
END $$;
