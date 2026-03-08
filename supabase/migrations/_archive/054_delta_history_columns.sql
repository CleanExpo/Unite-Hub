-- Migration 054: Delta & History Timeline Columns
-- Phase 8 Week 21: Delta Engine & History Intelligence
--
-- Adds columns to seo_audit_history for delta tracking and comparison.

-- ============================================
-- Add delta tracking columns to seo_audit_history
-- ============================================

-- Previous audit reference (for delta calculation)
ALTER TABLE seo_audit_history
ADD COLUMN IF NOT EXISTS previous_audit_id UUID REFERENCES seo_audit_history(audit_id);

-- Delta summary (JSONB for quick access without full delta file)
ALTER TABLE seo_audit_history
ADD COLUMN IF NOT EXISTS delta_summary JSONB DEFAULT '{}'::jsonb;

-- Add index for delta queries
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_previous_audit
ON seo_audit_history(previous_audit_id);

-- Add index for client timeline queries
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_client_created
ON seo_audit_history(client_id, created_at DESC);

-- Add index for delta summary trend queries
CREATE INDEX IF NOT EXISTS idx_seo_audit_history_delta_trend
ON seo_audit_history((delta_summary->>'overall_trend'));

-- ============================================
-- Add backlink and entity score columns (for Week 22)
-- ============================================

ALTER TABLE seo_audit_history
ADD COLUMN IF NOT EXISTS backlink_score INTEGER CHECK (backlink_score >= 0 AND backlink_score <= 100);

ALTER TABLE seo_audit_history
ADD COLUMN IF NOT EXISTS entity_alignment_score INTEGER CHECK (entity_alignment_score >= 0 AND entity_alignment_score <= 100);

-- ============================================
-- Create schedule_log table (for Week 23)
-- ============================================

CREATE TABLE IF NOT EXISTS schedule_log (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('WEEKLY_SNAPSHOT', 'MONTHLY_FULL_AUDIT', 'ANOMALY_CHECK')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED')) DEFAULT 'PENDING',
  result_audit_id UUID REFERENCES seo_audit_history(audit_id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy for schedule_log
ALTER TABLE schedule_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's schedule logs"
  ON schedule_log FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Index for schedule queries
CREATE INDEX IF NOT EXISTS idx_schedule_log_client_status
ON schedule_log(client_id, status, scheduled_at);

-- ============================================
-- Create client_schedules table (for Week 23)
-- ============================================

CREATE TABLE IF NOT EXISTS client_schedules (
  schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  job_type TEXT NOT NULL CHECK (job_type IN ('WEEKLY_SNAPSHOT', 'MONTHLY_FULL_AUDIT', 'ANOMALY_CHECK')),
  frequency TEXT NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY')),
  enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  -- Keep FK reference to auth.users (allowed in migrations)
created_by UUID NOT NULL REFERENCES auth.users(id),
  client_consent BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, job_type)
);

-- Add RLS policy for client_schedules
ALTER TABLE client_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's schedules"
  ON client_schedules FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their organization's schedules"
  ON client_schedules FOR ALL
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Index for schedule lookups
CREATE INDEX IF NOT EXISTS idx_client_schedules_next_run
ON client_schedules(next_run_at, enabled) WHERE enabled = true;

-- ============================================
-- Create strategy_signoffs table (for Week 24)
-- ============================================

CREATE TABLE IF NOT EXISTS strategy_signoffs (
  signoff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  audit_id UUID NOT NULL REFERENCES seo_audit_history(audit_id) ON DELETE CASCADE,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED', 'MODIFIED')),
  notes TEXT,
  -- Keep FK reference to auth.users (allowed in migrations)
decided_by UUID NOT NULL REFERENCES auth.users(id),
  decided_at TIMESTAMPTZ DEFAULT NOW(),
  action_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy for strategy_signoffs
ALTER TABLE strategy_signoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's signoffs"
  ON strategy_signoffs FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create signoffs for their organization"
  ON strategy_signoffs FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

-- Index for signoff queries
CREATE INDEX IF NOT EXISTS idx_strategy_signoffs_client_audit
ON strategy_signoffs(client_id, audit_id);

CREATE INDEX IF NOT EXISTS idx_strategy_signoffs_decided_by
ON strategy_signoffs(decided_by, decided_at DESC);

-- ============================================
-- Create email_log table (for Week 23)
-- ============================================

CREATE TABLE IF NOT EXISTS email_log (
  email_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES seo_client_profiles(client_id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('WEEKLY_SNAPSHOT', 'ANOMALY_ALERT', 'MONTHLY_REVIEW', 'ONBOARDING', 'CUSTOM')),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('SENT', 'FAILED', 'BOUNCED')) DEFAULT 'SENT',
  provider TEXT,
  message_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add RLS policy for email_log
ALTER TABLE email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's email logs"
  ON email_log FOR SELECT
  USING (
    client_id IN (
      SELECT client_id FROM seo_client_profiles
      WHERE organization_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      )
    )
  );

-- Index for email log queries
CREATE INDEX IF NOT EXISTS idx_email_log_client_sent
ON email_log(client_id, sent_at DESC);

-- ============================================
-- Function to auto-update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to client_schedules
DROP TRIGGER IF EXISTS update_client_schedules_updated_at ON client_schedules;
CREATE TRIGGER update_client_schedules_updated_at
  BEFORE UPDATE ON client_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON COLUMN seo_audit_history.previous_audit_id IS 'Reference to the previous audit for delta calculation';
COMMENT ON COLUMN seo_audit_history.delta_summary IS 'JSONB summary of changes from previous audit (trend, wins, losses)';
COMMENT ON COLUMN seo_audit_history.backlink_score IS 'Backlink profile health score (0-100), Pro/Enterprise only';
COMMENT ON COLUMN seo_audit_history.entity_alignment_score IS 'Entity alignment with target niche (0-100), Pro/Enterprise only';

COMMENT ON TABLE schedule_log IS 'Log of all scheduled job executions';
COMMENT ON TABLE client_schedules IS 'Per-client scheduling configuration';
COMMENT ON TABLE strategy_signoffs IS 'Human signoff decisions on automated recommendations';
COMMENT ON TABLE email_log IS 'Log of all automated emails sent to clients';
