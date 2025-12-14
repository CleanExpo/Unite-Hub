-- Migration: 076_mvp_dashboard.sql
-- Description: MVP Dashboard & UX Integration Layer - Phase 15 Week 3-4
-- Created: 2025-11-21

-- ============================================================================
-- DASHBOARD WIDGETS
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_key VARCHAR(100) NOT NULL UNIQUE, -- 'system_health', 'strategy_status', etc.
  name VARCHAR(200) NOT NULL,
  description TEXT,
  component_name VARCHAR(100) NOT NULL, -- React component name
  default_order INTEGER DEFAULT 0,
  default_size VARCHAR(20) DEFAULT 'medium', -- 'small', 'medium', 'large', 'full'
  min_role VARCHAR(50) DEFAULT 'user', -- Minimum role required to see widget
  is_active BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}', -- Default widget configuration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DASHBOARD USER PREFERENCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_user_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  widget_order JSONB DEFAULT '[]', -- Array of widget_keys in display order
  hidden_widgets VARCHAR(100)[] DEFAULT '{}', -- Widget keys to hide
  widget_sizes JSONB DEFAULT '{}', -- Override sizes per widget
  widget_configs JSONB DEFAULT '{}', -- Override configs per widget
  theme VARCHAR(20) DEFAULT 'system', -- 'light', 'dark', 'system'
  sidebar_collapsed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- ============================================================================
-- DASHBOARD NOTIFICATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success', 'action'
  title VARCHAR(200) NOT NULL,
  message TEXT,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  source VARCHAR(100), -- Which system generated it: 'leviathan', 'billing', 'strategy', etc.
  priority INTEGER DEFAULT 0, -- Higher = more urgent
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_active ON dashboard_widgets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_key ON dashboard_widgets(widget_key);

CREATE INDEX IF NOT EXISTS idx_dashboard_user_prefs_user_id ON dashboard_user_prefs(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_user_prefs_workspace_id ON dashboard_user_prefs(workspace_id);

CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_user_id ON dashboard_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_workspace_id ON dashboard_notifications(workspace_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_unread ON dashboard_notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_dashboard_notifications_created ON dashboard_notifications(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_user_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_notifications ENABLE ROW LEVEL SECURITY;

-- Widgets: Read-only for authenticated users
CREATE POLICY "dashboard_widgets_select" ON dashboard_widgets
  FOR SELECT TO authenticated
  USING (is_active = true);

-- User Preferences: Users can manage their own preferences
CREATE POLICY "dashboard_user_prefs_select" ON dashboard_user_prefs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "dashboard_user_prefs_insert" ON dashboard_user_prefs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dashboard_user_prefs_update" ON dashboard_user_prefs
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dashboard_user_prefs_delete" ON dashboard_user_prefs
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Notifications: Users can view/manage their own notifications
CREATE POLICY "dashboard_notifications_select" ON dashboard_notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "dashboard_notifications_insert" ON dashboard_notifications
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dashboard_notifications_update" ON dashboard_notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dashboard_notifications_delete" ON dashboard_notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============================================================================
-- DEFAULT WIDGETS
-- ============================================================================
INSERT INTO dashboard_widgets (widget_key, name, description, component_name, default_order, default_size, min_role, config)
VALUES
  ('system_health', 'System Health', 'Overall system health score and status', 'SystemHealthCard', 1, 'medium', 'user', '{"refreshInterval": 60000}'::jsonb),
  ('strategy_status', 'Strategy Engine', 'Long-horizon planner and strategy status', 'StrategyStatusCard', 2, 'medium', 'user', '{"showDetails": true}'::jsonb),
  ('operator_queue', 'Operator Queue', 'Current task queue and processing status', 'OperatorQueueCard', 3, 'medium', 'admin', '{"maxItems": 5}'::jsonb),
  ('indexing_health', 'Indexing Status', 'Leviathan indexing and search health', 'IndexingHealthCard', 4, 'medium', 'user', '{"showMetrics": true}'::jsonb),
  ('billing_status', 'Billing Status', 'Current plan, usage, and billing info', 'BillingStatusCard', 5, 'medium', 'user', '{"showUsage": true}'::jsonb),
  ('quick_actions', 'Quick Actions', 'Common actions and shortcuts', 'QuickActionsCard', 6, 'small', 'user', '{"actions": ["new_contact", "send_email", "create_campaign"]}'::jsonb)
ON CONFLICT (widget_key) DO NOTHING;

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_dashboard_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_dashboard_widgets_updated_at ON dashboard_widgets;
CREATE TRIGGER trigger_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_dashboard_updated_at();

DROP TRIGGER IF EXISTS trigger_dashboard_user_prefs_updated_at ON dashboard_user_prefs;
CREATE TRIGGER trigger_dashboard_user_prefs_updated_at
  BEFORE UPDATE ON dashboard_user_prefs
  FOR EACH ROW EXECUTE FUNCTION update_dashboard_updated_at();

DROP TRIGGER IF EXISTS trigger_dashboard_notifications_updated_at ON dashboard_notifications;
CREATE TRIGGER trigger_dashboard_notifications_updated_at
  BEFORE UPDATE ON dashboard_notifications
  FOR EACH ROW EXECUTE FUNCTION update_dashboard_updated_at();

-- ============================================================================
-- HELPER FUNCTION: Clean expired notifications
-- ============================================================================
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM dashboard_notifications
  WHERE expires_at IS NOT NULL AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
