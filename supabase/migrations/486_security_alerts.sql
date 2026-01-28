/**
 * Migration 486: Security Alerts (Phase E6)
 *
 * Security alert system:
 * - Severity levels (info, low, medium, high, critical)
 * - Alert types (auth anomaly, webhook failure, resource limit, etc.)
 * - Resolution workflow
 * - Metadata for alert context
 *
 * Related to: E-Series Security & Governance Foundation
 */

CREATE TABLE IF NOT EXISTS security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  alert_type text NOT NULL, -- e.g. 'auth_anomaly', 'webhook_failure', 'rate_limit_exceeded'
  severity text NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
  title text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_tenant ON security_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_alerts_unresolved ON security_alerts(is_resolved) WHERE is_resolved = false;

COMMENT ON TABLE security_alerts IS 'Security alerts for monitoring and incident response';
COMMENT ON COLUMN security_alerts.severity IS 'Alert severity: info, low, medium, high, critical';

ALTER TABLE security_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their tenant alerts" ON security_alerts;
CREATE POLICY "Users can view their tenant alerts"
  ON security_alerts FOR SELECT
  USING (auth.uid() IS NOT NULL AND tenant_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their tenant alerts" ON security_alerts;
CREATE POLICY "Users can update their tenant alerts"
  ON security_alerts FOR UPDATE
  USING (auth.uid() IS NOT NULL AND tenant_id IN (
    SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "System can create alerts" ON security_alerts;
CREATE POLICY "System can create alerts"
  ON security_alerts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
