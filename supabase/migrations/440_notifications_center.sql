-- Migration 440: System Notifications Center (Phase E25)
-- Tenant-scoped notifications for alerts and escalations

-- Drop existing table if it exists (clean slate)
DROP TABLE IF EXISTS notifications CASCADE;

-- Notification type
DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM (
    'info',
    'success',
    'warning',
    'error',
    'alert',
    'security',
    'compliance',
    'incident',
    'policy',
    'rate_limit',
    'system',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notification priority
DO $$ BEGIN
  CREATE TYPE notification_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Specific user or NULL for all
  type notification_type NOT NULL,
  priority notification_priority NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- Optional link to relevant resource
  link_text TEXT, -- Optional link text
  read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  source TEXT, -- Source of notification (e.g., "policy_engine", "rate_limiter")
  source_id TEXT, -- ID of source entity
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_tenant_unread ON notifications(tenant_id, read, created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read, created_at DESC);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_read_own ON notifications
  FOR SELECT
  USING (
    tenant_id = auth.uid() OR
    user_id = auth.uid()
  );

CREATE POLICY notifications_write_own ON notifications
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY notifications_update_own ON notifications
  FOR UPDATE
  USING (
    tenant_id = auth.uid() OR
    user_id = auth.uid()
  );

-- Drop existing functions if they exist (drop all overloaded variants)
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_notification CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS mark_notification_read CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS mark_notification_dismissed CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS mark_all_read CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_notification_statistics CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DROP FUNCTION IF EXISTS cleanup_old_notifications CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Function: Create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_tenant_id UUID,
  p_user_id UUID,
  p_type notification_type,
  p_priority notification_priority,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_link_text TEXT DEFAULT NULL,
  p_source TEXT DEFAULT NULL,
  p_source_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO notifications (
    tenant_id,
    user_id,
    type,
    priority,
    title,
    message,
    link,
    link_text,
    source,
    source_id,
    metadata
  ) VALUES (
    p_tenant_id,
    p_user_id,
    p_type,
    p_priority,
    p_title,
    p_message,
    p_link,
    p_link_text,
    p_source,
    p_source_id,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(
  p_notification_id UUID,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET read = TRUE,
      read_at = now(),
      updated_at = now()
  WHERE id = p_notification_id
    AND (user_id = p_user_id OR tenant_id = p_user_id)
    AND read = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark notification as dismissed
CREATE OR REPLACE FUNCTION mark_notification_dismissed(
  p_notification_id UUID,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE notifications
  SET dismissed = TRUE,
      dismissed_at = now(),
      updated_at = now()
  WHERE id = p_notification_id
    AND (user_id = p_user_id OR tenant_id = p_user_id)
    AND dismissed = FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Mark all notifications as read
CREATE OR REPLACE FUNCTION mark_all_read(
  p_tenant_id UUID,
  p_user_id UUID
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = TRUE,
      read_at = now(),
      updated_at = now()
  WHERE (tenant_id = p_tenant_id OR user_id = p_user_id)
    AND read = FALSE;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get notification statistics
CREATE OR REPLACE FUNCTION get_notification_statistics(
  p_tenant_id UUID,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_total INTEGER;
  v_unread INTEGER;
  v_read INTEGER;
  v_dismissed INTEGER;
  v_by_type JSONB;
  v_by_priority JSONB;
BEGIN
  -- Count by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE read = FALSE AND dismissed = FALSE),
    COUNT(*) FILTER (WHERE read = TRUE),
    COUNT(*) FILTER (WHERE dismissed = TRUE)
  INTO v_total, v_unread, v_read, v_dismissed
  FROM notifications
  WHERE tenant_id = p_tenant_id OR user_id = p_user_id;

  -- Count by type
  SELECT jsonb_object_agg(type, count)
  INTO v_by_type
  FROM (
    SELECT type::TEXT, COUNT(*) as count
    FROM notifications
    WHERE tenant_id = p_tenant_id OR user_id = p_user_id
    GROUP BY type
  ) t;

  -- Count by priority
  SELECT jsonb_object_agg(priority, count)
  INTO v_by_priority
  FROM (
    SELECT priority::TEXT, COUNT(*) as count
    FROM notifications
    WHERE tenant_id = p_tenant_id OR user_id = p_user_id
    GROUP BY priority
  ) t;

  RETURN jsonb_build_object(
    'total', COALESCE(v_total, 0),
    'unread', COALESCE(v_unread, 0),
    'read', COALESCE(v_read, 0),
    'dismissed', COALESCE(v_dismissed, 0),
    'by_type', COALESCE(v_by_type, '{}'::jsonb),
    'by_priority', COALESCE(v_by_priority, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cleanup old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications() RETURNS void AS $$
BEGIN
  -- Delete dismissed notifications older than 30 days
  DELETE FROM notifications
  WHERE dismissed = TRUE
    AND dismissed_at < now() - interval '30 days';

  -- Delete read notifications older than 90 days
  DELETE FROM notifications
  WHERE read = TRUE
    AND read_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_read TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_dismissed TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_read TO authenticated;
GRANT EXECUTE ON FUNCTION get_notification_statistics TO authenticated;

-- Trigger to update notifications.updated_at
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notification_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_timestamp();

COMMENT ON FUNCTION cleanup_old_notifications() IS 'Run periodically via cron to delete old notifications. Call: SELECT cleanup_old_notifications();';
