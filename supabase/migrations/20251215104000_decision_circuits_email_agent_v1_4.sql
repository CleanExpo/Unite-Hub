-- Decision Circuits Email Agent v1.4.0 Migration
-- Autonomous execution-only agent for email sending
-- Applied on top of v1.0-1.3 migrations

-- Email agent executions table (audit trail for all send attempts)
CREATE TABLE IF NOT EXISTS email_agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  circuit_execution_id TEXT NOT NULL,
  client_id UUID NOT NULL,
  recipient TEXT NOT NULL,

  -- Email content snapshot
  subject TEXT NOT NULL,
  preheader TEXT,
  html_body TEXT NOT NULL,
  text_body TEXT,
  cta_url TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Execution details
  sent BOOLEAN NOT NULL,
  provider TEXT,
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ,

  -- Retry tracking
  attempt_number INT DEFAULT 1,
  retry_count INT DEFAULT 0,
  last_error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT email_agent_executions_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_email_agent_executions_workspace
  ON email_agent_executions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_agent_executions_circuit
  ON email_agent_executions(circuit_execution_id);
CREATE INDEX IF NOT EXISTS idx_email_agent_executions_client
  ON email_agent_executions(workspace_id, client_id);
CREATE INDEX IF NOT EXISTS idx_email_agent_executions_recipient
  ON email_agent_executions(recipient);
CREATE INDEX IF NOT EXISTS idx_email_agent_executions_sent_at
  ON email_agent_executions(sent_at DESC);

-- Email agent metrics table (engagement tracking)
CREATE TABLE IF NOT EXISTS email_agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  circuit_execution_id TEXT NOT NULL,
  provider_message_id TEXT NOT NULL,
  provider TEXT NOT NULL,

  -- Deliverability metrics
  delivered BOOLEAN DEFAULT FALSE,
  bounced BOOLEAN DEFAULT FALSE,
  bounce_type TEXT,

  -- Engagement metrics
  opened BOOLEAN DEFAULT FALSE,
  clicked BOOLEAN DEFAULT FALSE,
  unsubscribed BOOLEAN DEFAULT FALSE,
  complained BOOLEAN DEFAULT FALSE,

  -- Timestamps
  delivered_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  complained_at TIMESTAMPTZ,

  -- Collection metadata
  collected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT email_agent_metrics_workspace_fk
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

CREATE INDEX IF NOT EXISTS idx_email_agent_metrics_workspace
  ON email_agent_metrics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_agent_metrics_circuit
  ON email_agent_metrics(circuit_execution_id);
CREATE INDEX IF NOT EXISTS idx_email_agent_metrics_message_id
  ON email_agent_metrics(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_email_agent_metrics_collected_at
  ON email_agent_metrics(collected_at DESC);

-- Email suppression list table (bounces, complaints, unsubscribes)
CREATE TABLE IF NOT EXISTS email_suppression_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('bounced', 'complained', 'unsubscribed')),
  bounce_type TEXT,
  suppressed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT email_suppression_unique UNIQUE (workspace_id, email, reason)
);

CREATE INDEX IF NOT EXISTS idx_email_suppression_workspace_email
  ON email_suppression_list(workspace_id, email);

-- Enable Row Level Security on all new tables
ALTER TABLE email_agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppression_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
DROP POLICY IF EXISTS "email_agent_executions_tenant_isolation" ON email_agent_executions;
CREATE POLICY "email_agent_executions_tenant_isolation" ON email_agent_executions
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "email_agent_metrics_tenant_isolation" ON email_agent_metrics;
CREATE POLICY "email_agent_metrics_tenant_isolation" ON email_agent_metrics
FOR ALL USING (workspace_id = get_current_workspace_id());

DROP POLICY IF EXISTS "email_suppression_list_tenant_isolation" ON email_suppression_list;
CREATE POLICY "email_suppression_list_tenant_isolation" ON email_suppression_list
FOR ALL USING (workspace_id = get_current_workspace_id());

-- View for email agent performance summary
CREATE OR REPLACE VIEW email_agent_performance AS
SELECT
  workspace_id,
  provider,
  COUNT(*) as total_emails,
  SUM(CASE WHEN sent THEN 1 ELSE 0 END) as successful_sends,
  SUM(retry_count) as total_retries,
  AVG(CASE WHEN sent THEN retry_count ELSE NULL END) as avg_retries_on_success,
  ROUND(
    100.0 * SUM(CASE WHEN sent THEN 1 ELSE 0 END) / NULLIF(COUNT(*), 0),
    2
  ) as success_rate
FROM email_agent_executions
GROUP BY workspace_id, provider;

-- Comments
COMMENT ON TABLE email_agent_executions IS 'Audit trail for all email agent execution attempts with full context';
COMMENT ON TABLE email_agent_metrics IS 'Engagement metrics collected from email providers after sending';
COMMENT ON TABLE email_suppression_list IS 'Suppression list for bounced, complained, and unsubscribed recipients';
COMMENT ON VIEW email_agent_performance IS 'Performance summary of email agent across providers';
