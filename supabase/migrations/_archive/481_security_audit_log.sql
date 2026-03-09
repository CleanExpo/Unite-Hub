/**
 * Migration 481: Security Audit Log (Phase E1)
 *
 * Comprehensive audit logging system for security events:
 * - Immutable audit trail for compliance (GDPR, SOC 2, HIPAA)
 * - Tenant isolation with RLS
 * - Actor tracking (user, system, agent)
 * - IP address and user-agent tracking
 * - Metadata JSONB for extensibility
 *
 * Related to: E-Series Security & Governance Foundation
 */

-- ============================================================================
-- Security Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Event Details
  event_type text NOT NULL, -- e.g. 'auth.login', 'auth.logout', 'billing.subscription_change'
  event_action text NOT NULL, -- e.g. 'create', 'update', 'delete', 'access'

  -- Actor (who performed the action)
  actor_type text NOT NULL CHECK (actor_type IN ('user', 'system', 'agent')),
  actor_id uuid, -- user_id for users, null for system/agent
  actor_email text, -- For traceability

  -- Target (what was affected)
  resource_type text, -- e.g. 'invoice', 'api_key', 'role_assignment'
  resource_id uuid, -- ID of the affected resource

  -- Context
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Timestamp (immutable, no updated_at)
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_tenant ON security_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type ON security_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_actor_id ON security_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_resource ON security_audit_log(resource_type, resource_id);

COMMENT ON TABLE security_audit_log IS 'Immutable audit trail for security events and compliance';
COMMENT ON COLUMN security_audit_log.actor_type IS 'Type of actor: user (human), system (automated), agent (AI)';
COMMENT ON COLUMN security_audit_log.metadata IS 'Extensible JSON field for event-specific data';

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log is APPEND-ONLY: No UPDATE or DELETE policies
-- Users can only view their own tenant's audit logs
DROP POLICY IF EXISTS "Users can view their tenant audit logs" ON security_audit_log;
CREATE POLICY "Users can view their tenant audit logs"
  ON security_audit_log FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND tenant_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()
    )
  );

-- System can insert audit events (bypass RLS with service role)
DROP POLICY IF EXISTS "System can insert audit events" ON security_audit_log;
CREATE POLICY "System can insert audit events"
  ON security_audit_log FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
