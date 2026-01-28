-- Phase 8 Week 23: Anomaly Detection Tables
-- Creates seo_anomalies table for storing detected anomalies

-- Create seo_anomalies table
CREATE TABLE IF NOT EXISTS seo_anomalies (
  anomaly_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL CHECK (anomaly_type IN (
    'HEALTH_SCORE_DROP',
    'HEALTH_SCORE_SPIKE',
    'TRAFFIC_DROP',
    'TRAFFIC_SPIKE',
    'BACKLINKS_LOST',
    'BACKLINKS_SPIKE',
    'POSITION_DROP',
    'TOXIC_BACKLINKS',
    'CRAWL_ERRORS',
    'INDEX_DROP'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metric_name TEXT NOT NULL,
  previous_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL,
  change_percent NUMERIC NOT NULL,
  threshold_exceeded NUMERIC NOT NULL,
  message TEXT NOT NULL,
  recommendations TEXT[] DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT false,
  -- Keep FK reference to auth.users (allowed in migrations)
acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for seo_anomalies
CREATE INDEX IF NOT EXISTS idx_seo_anomalies_client_id
  ON seo_anomalies(client_id);

CREATE INDEX IF NOT EXISTS idx_seo_anomalies_detected_at
  ON seo_anomalies(detected_at DESC);

CREATE INDEX IF NOT EXISTS idx_seo_anomalies_severity
  ON seo_anomalies(severity);

CREATE INDEX IF NOT EXISTS idx_seo_anomalies_unacknowledged
  ON seo_anomalies(client_id, acknowledged)
  WHERE acknowledged = false;

-- Add notification_email to seo_client_profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seo_client_profiles' AND column_name = 'notification_email'
  ) THEN
    ALTER TABLE seo_client_profiles
    ADD COLUMN notification_email TEXT;
  END IF;
END $$;

-- RLS Policies for seo_anomalies
ALTER TABLE seo_anomalies ENABLE ROW LEVEL SECURITY;

-- Staff can view anomalies for clients in their organization
CREATE POLICY seo_anomalies_select_policy ON seo_anomalies
  FOR SELECT
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM seo_client_profiles cp
      JOIN user_organizations uo ON cp.organization_id = uo.org_id
      WHERE cp.client_id = seo_anomalies.client_id
        AND uo.user_id = auth.uid()
    )
  );

-- Staff can update acknowledgment
CREATE POLICY seo_anomalies_update_policy ON seo_anomalies
  FOR UPDATE
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    EXISTS (
      SELECT 1 FROM seo_client_profiles cp
      JOIN user_organizations uo ON cp.organization_id = uo.org_id
      WHERE cp.client_id = seo_anomalies.client_id
        AND uo.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM seo_client_profiles cp
      JOIN user_organizations uo ON cp.organization_id = uo.org_id
      WHERE cp.client_id = seo_anomalies.client_id
        AND uo.user_id = auth.uid()
    )
  );

-- System can insert anomalies (service role)
CREATE POLICY seo_anomalies_insert_policy ON seo_anomalies
  FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE seo_anomalies IS 'Stores detected SEO anomalies for alerting';
COMMENT ON COLUMN seo_anomalies.severity IS 'LOW, MEDIUM, HIGH, or CRITICAL';
COMMENT ON COLUMN seo_anomalies.recommendations IS 'Array of recommended actions';
