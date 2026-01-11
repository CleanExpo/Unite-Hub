/**
 * Alert Delivery Log Table
 * Audit trail for all alert delivery attempts
 *
 * Features:
 * - Per-threat tracking
 * - Per-channel status (sent/failed/skipped)
 * - Error message storage
 * - Recipient tracking
 * - Workspace-scoped with RLS
 */

CREATE TABLE IF NOT EXISTS alert_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Threat Reference
  threat_id TEXT NOT NULL,

  -- Channel Information
  channel TEXT NOT NULL CHECK (
    channel IN ('slack', 'email', 'webhook', 'websocket')
  ),
  recipient TEXT,

  -- Delivery Status
  status TEXT NOT NULL CHECK (
    status IN ('sent', 'failed', 'skipped')
  ),
  error_message TEXT,

  -- Audit
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_delivery_workspace ON alert_delivery_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_delivery_threat ON alert_delivery_log(threat_id);
CREATE INDEX IF NOT EXISTS idx_delivery_channel ON alert_delivery_log(channel);
CREATE INDEX IF NOT EXISTS idx_delivery_status ON alert_delivery_log(status);
CREATE INDEX IF NOT EXISTS idx_delivery_timestamp ON alert_delivery_log(sent_at DESC);

-- Row Level Security
ALTER TABLE alert_delivery_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON alert_delivery_log;
CREATE POLICY "tenant_isolation" ON alert_delivery_log
FOR ALL USING (workspace_id = get_current_workspace_id());

-- Grant access
ALTER TABLE alert_delivery_log GRANT SELECT, INSERT ON alert_delivery_log TO authenticated;

-- Comments
COMMENT ON TABLE alert_delivery_log IS 'Audit trail for alert delivery attempts (Slack, email, webhook, WebSocket)';
COMMENT ON COLUMN alert_delivery_log.threat_id IS 'Reference to seo_threats.id';
COMMENT ON COLUMN alert_delivery_log.channel IS 'Delivery channel: slack, email, webhook, or websocket';
COMMENT ON COLUMN alert_delivery_log.recipient IS 'Email address, Slack webhook URL, or recipient details';
COMMENT ON COLUMN alert_delivery_log.status IS 'Delivery status: sent, failed, or skipped';
COMMENT ON COLUMN alert_delivery_log.error_message IS 'Error details if status is failed';
