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
-- Only add policy if: (1) the table exists, AND (2) the policy doesn't already exist.
-- This makes the migration safe to run even when boardroom tables aren't yet applied.

DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'strategy_insights',
    'board_meetings',
    'board_meeting_notes',
    'ceo_decisions',
    'satellite_dispatches',
    'hub_satellites',
    'coach_reports',
    'social_engagements',
    'email_campaigns'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Check table exists before attempting to create policy
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) AND NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'service_role bypass'
    ) THEN
      EXECUTE format(
        'CREATE POLICY "service_role bypass" ON %I TO service_role USING (true) WITH CHECK (true)',
        tbl
      );
      RAISE NOTICE 'Added service_role bypass policy to %', tbl;
    END IF;
  END LOOP;
END $$;
