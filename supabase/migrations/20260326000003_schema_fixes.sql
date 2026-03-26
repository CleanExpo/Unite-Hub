-- supabase/migrations/20260326000003_schema_fixes.sql
-- Schema fixes from CodeX deep audit (26/03/2026)
-- Fixes: social_engagements missing columns, email_campaigns status constraint,
--        service_role RLS bypass policies for cron-accessed tables.

-- ── social_engagements ────────────────────────────────────────────────────────
-- engagement-monitor cron crashes because content_hash column is missing
ALTER TABLE social_engagements ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE social_engagements ADD COLUMN IF NOT EXISTS external_id  TEXT;

-- ── email_campaigns ───────────────────────────────────────────────────────────
-- Campaign send fails with CHECK constraint violation on 'partial' status
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS sent_count   INTEGER NOT NULL DEFAULT 0;
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS failed_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE email_campaigns DROP CONSTRAINT IF EXISTS email_campaigns_status_check;
ALTER TABLE email_campaigns ADD CONSTRAINT email_campaigns_status_check
  CHECK (status IN ('draft','scheduled','sending','partial','sent','failed','cancelled'));

-- ── service_role RLS bypass policies ─────────────────────────────────────────
-- Cron routes use createServiceClient() which authenticates as service_role.
-- Without TO service_role policies, writes are silently blocked by RLS.
-- Only add if the table exists and doesn't already have a service_role policy.

DO $$
BEGIN
  -- strategy_insights
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'strategy_insights' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON strategy_insights TO service_role USING (true) WITH CHECK (true)';
  END IF;

  -- board_meetings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'board_meetings' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON board_meetings TO service_role USING (true) WITH CHECK (true)';
  END IF;

  -- board_meeting_notes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'board_meeting_notes' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON board_meeting_notes TO service_role USING (true) WITH CHECK (true)';
  END IF;

  -- ceo_decisions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ceo_decisions' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON ceo_decisions TO service_role USING (true) WITH CHECK (true)';
  END IF;

  -- satellite_dispatches
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'satellite_dispatches' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON satellite_dispatches TO service_role USING (true) WITH CHECK (true)';
  END IF;

  -- hub_satellites
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hub_satellites' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON hub_satellites TO service_role USING (true) WITH CHECK (true)';
  END IF;

  -- coach_reports
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'coach_reports' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON coach_reports TO service_role USING (true) WITH CHECK (true)';
  END IF;

  -- social_engagements
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'social_engagements' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON social_engagements TO service_role USING (true) WITH CHECK (true)';
  END IF;

  -- email_campaigns
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'email_campaigns' AND policyname = 'service_role bypass'
  ) THEN
    EXECUTE 'CREATE POLICY "service_role bypass" ON email_campaigns TO service_role USING (true) WITH CHECK (true)';
  END IF;
END $$;
