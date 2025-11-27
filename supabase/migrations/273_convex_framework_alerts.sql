-- Migration 273: CONVEX Framework Alerts & Notifications System
-- Purpose: Create tables for alert rules, triggers, and notification delivery
-- Version: 1.0.0
-- Date: 2025-11-27

-- ============================================================================
-- TABLE 1: convex_framework_alert_rules
-- Purpose: Store alert rules for framework monitoring
-- Supports: threshold, anomaly, performance, milestone alerts
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_framework_alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL,
  workspace_id UUID NOT NULL,

  -- Alert configuration
  alert_type TEXT NOT NULL CHECK (alert_type IN ('threshold', 'anomaly', 'performance', 'milestone')),
  metric_name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'equals', 'changes_by')),
  threshold_value NUMERIC,
  change_percentage NUMERIC,

  -- Notification channels
  notification_channels TEXT[] NOT NULL DEFAULT ARRAY['email'],

  -- Rule status
  enabled BOOLEAN DEFAULT true,

  -- Metadata
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT fk_framework_id FOREIGN KEY (framework_id) REFERENCES convex_custom_frameworks(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT valid_channels CHECK (
    notification_channels && ARRAY['email', 'in-app', 'slack']
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convex_alerts_framework ON convex_framework_alert_rules(framework_id);
CREATE INDEX IF NOT EXISTS idx_convex_alerts_workspace ON convex_framework_alert_rules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_alerts_enabled ON convex_framework_alert_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_convex_alerts_type ON convex_framework_alert_rules(alert_type);
CREATE INDEX IF NOT EXISTS idx_convex_alerts_created ON convex_framework_alert_rules(created_at DESC);

-- Enable RLS
ALTER TABLE convex_framework_alert_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convex_framework_alert_rules
DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_alerts_workspace_isolation" ON convex_framework_alert_rules
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_alerts_insert" ON convex_framework_alert_rules
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_alerts_update" ON convex_framework_alert_rules
      FOR UPDATE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_alerts_delete" ON convex_framework_alert_rules
      FOR DELETE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role = 'owner'
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 2: convex_framework_alert_triggers
-- Purpose: Track when alerts are triggered
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_framework_alert_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_rule_id UUID NOT NULL,
  framework_id UUID NOT NULL,
  workspace_id UUID NOT NULL,

  -- Trigger details
  triggered_at TIMESTAMPTZ DEFAULT now(),
  current_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  condition_met BOOLEAN DEFAULT true,

  -- Notification status
  notification_sent BOOLEAN DEFAULT false,
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,

  -- Resolution tracking
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,

  -- Additional context
  trigger_context JSONB,

  -- Constraints
  CONSTRAINT fk_alert_rule_id FOREIGN KEY (alert_rule_id) REFERENCES convex_framework_alert_rules(id) ON DELETE CASCADE,
  CONSTRAINT fk_framework_id FOREIGN KEY (framework_id) REFERENCES convex_custom_frameworks(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convex_triggers_rule ON convex_framework_alert_triggers(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_convex_triggers_framework ON convex_framework_alert_triggers(framework_id);
CREATE INDEX IF NOT EXISTS idx_convex_triggers_workspace ON convex_framework_alert_triggers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_triggers_acknowledged ON convex_framework_alert_triggers(acknowledged);
CREATE INDEX IF NOT EXISTS idx_convex_triggers_resolved ON convex_framework_alert_triggers(resolved);
CREATE INDEX IF NOT EXISTS idx_convex_triggers_timestamp ON convex_framework_alert_triggers(triggered_at DESC);

-- Enable RLS
ALTER TABLE convex_framework_alert_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convex_framework_alert_triggers
DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_triggers_workspace_isolation" ON convex_framework_alert_triggers
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_triggers_insert" ON convex_framework_alert_triggers
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_triggers_update" ON convex_framework_alert_triggers
      FOR UPDATE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 3: convex_framework_alert_notifications
-- Purpose: Track notification delivery across channels
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_framework_alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_trigger_id UUID NOT NULL,
  alert_rule_id UUID NOT NULL,
  workspace_id UUID NOT NULL,

  -- Recipient info
  recipient_email TEXT,
  recipient_user_id UUID,

  -- Notification details
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in-app', 'slack')),
  subject TEXT,
  message TEXT,

  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'bounced')),
  sent_at TIMESTAMPTZ,
  delivery_error TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT fk_trigger_id FOREIGN KEY (alert_trigger_id) REFERENCES convex_framework_alert_triggers(id) ON DELETE CASCADE,
  CONSTRAINT fk_alert_rule_id FOREIGN KEY (alert_rule_id) REFERENCES convex_framework_alert_rules(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_recipient_id FOREIGN KEY (recipient_user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convex_notifications_trigger ON convex_framework_alert_notifications(alert_trigger_id);
CREATE INDEX IF NOT EXISTS idx_convex_notifications_rule ON convex_framework_alert_notifications(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_convex_notifications_workspace ON convex_framework_alert_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_notifications_channel ON convex_framework_alert_notifications(channel);
CREATE INDEX IF NOT EXISTS idx_convex_notifications_status ON convex_framework_alert_notifications(status);
CREATE INDEX IF NOT EXISTS idx_convex_notifications_created ON convex_framework_alert_notifications(created_at DESC);

-- Enable RLS
ALTER TABLE convex_framework_alert_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convex_framework_alert_notifications
DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_notifications_workspace_isolation" ON convex_framework_alert_notifications
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_notifications_insert" ON convex_framework_alert_notifications
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_notifications_update" ON convex_framework_alert_notifications
      FOR UPDATE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- Purpose: Calculate alert statistics and manage alert lifecycle
-- ============================================================================

CREATE OR REPLACE FUNCTION get_alert_stats(p_framework_id UUID, p_workspace_id UUID)
RETURNS TABLE (
  total_rules BIGINT,
  active_rules BIGINT,
  recent_triggers BIGINT,
  unacknowledged_triggers BIGINT,
  resolved_triggers BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM convex_framework_alert_rules WHERE framework_id = p_framework_id AND workspace_id = p_workspace_id)::BIGINT,
    (SELECT COUNT(*) FROM convex_framework_alert_rules WHERE framework_id = p_framework_id AND workspace_id = p_workspace_id AND enabled = true)::BIGINT,
    (SELECT COUNT(*) FROM convex_framework_alert_triggers WHERE framework_id = p_framework_id AND workspace_id = p_workspace_id AND triggered_at > NOW() - INTERVAL '24 hours')::BIGINT,
    (SELECT COUNT(*) FROM convex_framework_alert_triggers WHERE framework_id = p_framework_id AND workspace_id = p_workspace_id AND acknowledged = false AND resolved = false)::BIGINT,
    (SELECT COUNT(*) FROM convex_framework_alert_triggers WHERE framework_id = p_framework_id AND workspace_id = p_workspace_id AND resolved = true)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOGGING
-- Purpose: Track all alert rule changes
-- ============================================================================

DROP TRIGGER IF EXISTS convex_alerts_audit ON convex_framework_alert_rules;
CREATE TRIGGER convex_alerts_audit AFTER INSERT OR UPDATE OR DELETE ON convex_framework_alert_rules
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

DROP TRIGGER IF EXISTS convex_triggers_audit ON convex_framework_alert_triggers;
CREATE TRIGGER convex_triggers_audit AFTER INSERT OR UPDATE OR DELETE ON convex_framework_alert_triggers
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

DROP TRIGGER IF EXISTS convex_notifications_audit ON convex_framework_alert_notifications;
CREATE TRIGGER convex_notifications_audit AFTER INSERT OR UPDATE OR DELETE ON convex_framework_alert_notifications
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'convex_framework_alert_rules',
      'convex_framework_alert_triggers',
      'convex_framework_alert_notifications'
    )
  ) THEN
    RAISE NOTICE 'Migration 273: CONVEX alerts tables created successfully';
  ELSE
    RAISE WARNING 'Migration 273: Some tables may have failed to create';
  END IF;
END $$;

-- End of Migration 273
