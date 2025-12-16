-- Guardian Phase G33: Access Audit Trail
-- Migration: 584
-- Purpose: Log all Guardian API access attempts with tenant, user, role, endpoint, and status

-- ============================================================================
-- TABLE: guardian_access_audit
-- ============================================================================
-- Stores audit logs for Guardian API access attempts (success and failures)
-- Tenant-scoped with RLS for security
-- Best-effort logging (failures don't break primary flows)
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('guardian_viewer', 'guardian_analyst', 'guardian_admin')),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  source_ip TEXT,
  user_agent TEXT,
  meta JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary query pattern: tenant + time-based lookups
CREATE INDEX idx_guardian_access_audit_tenant_time
  ON guardian_access_audit (tenant_id, created_at DESC);

-- Query pattern: tenant + endpoint + time (for per-API analytics)
CREATE INDEX idx_guardian_access_audit_tenant_endpoint
  ON guardian_access_audit (tenant_id, endpoint, created_at DESC);

-- Query pattern: tenant + user + time (for per-user analytics)
CREATE INDEX idx_guardian_access_audit_tenant_user
  ON guardian_access_audit (tenant_id, user_id, created_at DESC);

-- Query pattern: tenant + success flag (for error rate monitoring)
CREATE INDEX idx_guardian_access_audit_tenant_success
  ON guardian_access_audit (tenant_id, success, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE guardian_access_audit ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own tenant's audit logs
CREATE POLICY tenant_select_guardian_access_audit ON guardian_access_audit
  FOR SELECT
  USING (tenant_id = auth.uid());

-- Policy: Service role can insert audit logs (for API routes)
CREATE POLICY service_insert_guardian_access_audit ON guardian_access_audit
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE guardian_access_audit IS 'Guardian G33: Audit trail for all Guardian API access attempts';
COMMENT ON COLUMN guardian_access_audit.tenant_id IS 'Tenant (founder) who made the request';
COMMENT ON COLUMN guardian_access_audit.user_id IS 'User who made the request (same as tenant_id for founders)';
COMMENT ON COLUMN guardian_access_audit.role IS 'Guardian role at time of access (viewer, analyst, admin)';
COMMENT ON COLUMN guardian_access_audit.endpoint IS 'Guardian API endpoint accessed (e.g., /api/guardian/telemetry)';
COMMENT ON COLUMN guardian_access_audit.method IS 'HTTP method (GET, POST, PUT, DELETE)';
COMMENT ON COLUMN guardian_access_audit.status_code IS 'HTTP status code returned (200, 401, 403, 500)';
COMMENT ON COLUMN guardian_access_audit.success IS 'Whether the request succeeded (true) or failed (false)';
COMMENT ON COLUMN guardian_access_audit.source_ip IS 'Client IP address (optional)';
COMMENT ON COLUMN guardian_access_audit.user_agent IS 'Client user agent (optional)';
COMMENT ON COLUMN guardian_access_audit.meta IS 'Additional context (query params, error messages, etc.)';
COMMENT ON COLUMN guardian_access_audit.created_at IS 'Timestamp of access attempt';
