-- =====================================================================
-- Phase D59: Notification & Incident Center
-- =====================================================================
-- Tables: unite_notifications, unite_notification_prefs, unite_incidents
--
-- Purpose:
-- - Multi-channel notification system
-- - User notification preferences
-- - Incident management and tracking
-- - AI-powered incident triage
--
-- Key Concepts:
-- - Channel-based notifications (email, sms, push, slack, etc.)
-- - User-level and tenant-level notifications
-- - Quiet hours and digest preferences
-- - Incident lifecycle management
-- - Uses RLS for tenant/user isolation
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08
-- Migration: 487

-- =====================================================================
-- 1. Tables
-- =====================================================================

-- Notifications table
CREATE TABLE IF NOT EXISTS unite_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,

  -- Notification details
  channel text NOT NULL, -- 'email', 'sms', 'push', 'slack', 'in_app'
  type text NOT NULL, -- 'info', 'warning', 'error', 'success', 'alert'
  title text NOT NULL,
  body text,
  data jsonb, -- Additional notification data

  -- Severity
  severity text DEFAULT 'info', -- 'info', 'low', 'medium', 'high', 'critical'

  -- State
  read_at timestamptz,
  archived_at timestamptz,

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS unite_notification_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid NOT NULL,

  -- Channel preferences
  channels jsonb NOT NULL, -- {"email": true, "sms": false, "push": true, ...}

  -- Quiet hours
  quiet_hours jsonb, -- {"start": "22:00", "end": "08:00", "timezone": "America/New_York"}

  -- Digest settings
  digest_enabled boolean DEFAULT false,
  digest_frequency text DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'

  -- AI profile
  ai_profile jsonb, -- AI-powered notification preferences

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS unite_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,

  -- Incident details
  source text NOT NULL, -- 'manual', 'system', 'monitoring', 'webhook'
  category text NOT NULL, -- 'outage', 'performance', 'security', 'data', 'other'
  status text NOT NULL DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'closed'
  severity text NOT NULL, -- 'low', 'medium', 'high', 'critical'
  title text NOT NULL,
  description text,

  -- Metadata
  metadata jsonb, -- Additional incident data
  ai_summary jsonb, -- AI-generated incident summary and recommendations

  -- Timestamps
  opened_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid
);

-- =====================================================================
-- 2. Indexes
-- =====================================================================

-- Notifications
CREATE INDEX IF NOT EXISTS idx_unite_notifications_tenant_user
  ON unite_notifications(tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unite_notifications_channel
  ON unite_notifications(tenant_id, channel, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_unite_notifications_unread
  ON unite_notifications(tenant_id, user_id, read_at)
  WHERE read_at IS NULL;

-- Notification preferences
CREATE UNIQUE INDEX IF NOT EXISTS idx_unite_notification_prefs_user
  ON unite_notification_prefs(tenant_id, user_id);

-- Incidents
CREATE INDEX IF NOT EXISTS idx_unite_incidents_tenant_status
  ON unite_incidents(tenant_id, status, severity);

CREATE INDEX IF NOT EXISTS idx_unite_incidents_opened
  ON unite_incidents(tenant_id, opened_at DESC);

-- =====================================================================
-- 3. RLS Policies
-- =====================================================================

ALTER TABLE unite_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_notification_prefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_incidents ENABLE ROW LEVEL SECURITY;

-- Notifications (tenant + user isolation)
DROP POLICY IF EXISTS "tenant_user_isolation" ON unite_notifications;
CREATE POLICY "tenant_user_isolation" ON unite_notifications
  USING (
    (tenant_id IS NULL AND user_id = auth.uid()) OR
    (tenant_id = current_setting('app.tenant_id', true)::uuid AND user_id = auth.uid())
  );

-- Notification preferences (tenant + user isolation)
DROP POLICY IF EXISTS "tenant_user_isolation" ON unite_notification_prefs;
CREATE POLICY "tenant_user_isolation" ON unite_notification_prefs
  USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid AND
    user_id = auth.uid()
  );

-- Incidents (tenant isolation)
DROP POLICY IF EXISTS "tenant_isolation" ON unite_incidents;
CREATE POLICY "tenant_isolation" ON unite_incidents
  USING (
    tenant_id IS NULL OR
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- =====================================================================
-- 4. Helper Functions
-- =====================================================================

/**
 * Get unread notification count
 */
CREATE OR REPLACE FUNCTION unite_get_unread_notification_count(
  p_tenant_id uuid,
  p_user_id uuid
) RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT count(*)::integer INTO v_count
  FROM unite_notifications
  WHERE tenant_id = p_tenant_id
    AND user_id = p_user_id
    AND read_at IS NULL
    AND archived_at IS NULL;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql STABLE;

/**
 * Get incident summary
 */
CREATE OR REPLACE FUNCTION unite_get_incident_summary(
  p_tenant_id uuid
) RETURNS TABLE(
  total_incidents bigint,
  open_incidents bigint,
  critical_incidents bigint,
  avg_resolution_hours numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    count(*) AS total_incidents,
    count(*) FILTER (WHERE status IN ('open', 'investigating')) AS open_incidents,
    count(*) FILTER (WHERE severity = 'critical') AS critical_incidents,
    avg(
      EXTRACT(EPOCH FROM (resolved_at - opened_at)) / 3600
    )::numeric(10,2) AS avg_resolution_hours
  FROM unite_incidents
  WHERE tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION unite_get_unread_notification_count IS 'Get count of unread notifications for a user';
COMMENT ON FUNCTION unite_get_incident_summary IS 'Get incident summary statistics';
