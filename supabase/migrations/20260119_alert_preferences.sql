/**
 * Alert Preferences Table
 * Stores notification settings per workspace
 *
 * Features:
 * - Multi-channel support (Slack, Email, Custom Webhook)
 * - Severity threshold filtering
 * - Threat type filtering
 * - Do-not-disturb schedule (hour ranges + weekends)
 * - Workspace-scoped with RLS
 */

CREATE TABLE IF NOT EXISTS alert_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Slack Configuration
  slack_enabled BOOLEAN DEFAULT false,
  slack_webhook_url TEXT,

  -- Email Configuration
  email_enabled BOOLEAN DEFAULT false,
  email_recipients TEXT[] DEFAULT '{}',

  -- Custom Webhook Configuration
  webhook_enabled BOOLEAN DEFAULT false,
  webhook_url TEXT,

  -- Alert Filtering
  severity_threshold TEXT DEFAULT 'high' CHECK (
    severity_threshold IN ('low', 'medium', 'high', 'critical')
  ),
  threat_types TEXT[] DEFAULT '{
    "ranking_drop",
    "cwv_degradation",
    "technical_error",
    "competitor_surge",
    "security_issue",
    "indexation_problem"
  }',

  -- Do-Not-Disturb Schedule
  dnd_enabled BOOLEAN DEFAULT false,
  dnd_start_hour INTEGER DEFAULT 22 CHECK (dnd_start_hour BETWEEN 0 AND 23),
  dnd_end_hour INTEGER DEFAULT 8 CHECK (dnd_end_hour BETWEEN 0 AND 23),
  dnd_timezone TEXT DEFAULT 'UTC',
  dnd_weekends BOOLEAN DEFAULT false,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_prefs_workspace ON alert_preferences(workspace_id);

-- Row Level Security
ALTER TABLE alert_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON alert_preferences;
CREATE POLICY "tenant_isolation" ON alert_preferences
FOR ALL USING (workspace_id = get_current_workspace_id());

-- Grant access
ALTER TABLE alert_preferences GRANT SELECT, INSERT, UPDATE ON alert_preferences TO authenticated;

-- Comments
COMMENT ON TABLE alert_preferences IS 'Workspace-scoped notification preferences for SEO threat alerts';
COMMENT ON COLUMN alert_preferences.severity_threshold IS 'Minimum severity level to trigger alerts (low/medium/high/critical)';
COMMENT ON COLUMN alert_preferences.threat_types IS 'Array of threat types to monitor (can be filtered subset)';
COMMENT ON COLUMN alert_preferences.dnd_enabled IS 'Enable do-not-disturb schedule';
COMMENT ON COLUMN alert_preferences.dnd_start_hour IS 'Start hour of DND window (0-23)';
COMMENT ON COLUMN alert_preferences.dnd_end_hour IS 'End hour of DND window (0-23)';
