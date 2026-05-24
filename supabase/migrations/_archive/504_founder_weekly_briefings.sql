BEGIN;

CREATE TABLE IF NOT EXISTS founder_weekly_briefings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_starting    date NOT NULL,
  summary_html     text NOT NULL DEFAULT '',
  summary_text     text NOT NULL DEFAULT '',
  metrics          jsonb NOT NULL DEFAULT '{}',
  alerts           jsonb NOT NULL DEFAULT '[]',
  delivered_email  boolean NOT NULL DEFAULT false,
  delivered_push   boolean NOT NULL DEFAULT false,
  created_at       timestamptz DEFAULT now()
);

ALTER TABLE founder_weekly_briefings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='founder_weekly_briefings' AND policyname='briefings_owner') THEN
    CREATE POLICY briefings_owner ON founder_weekly_briefings FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='founder_weekly_briefings' AND policyname='briefings_service_role') THEN
    CREATE POLICY briefings_service_role ON founder_weekly_briefings FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_briefings_owner ON founder_weekly_briefings(owner_id);
CREATE INDEX IF NOT EXISTS idx_briefings_week ON founder_weekly_briefings(week_starting DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_briefings_owner_week ON founder_weekly_briefings(owner_id, week_starting);

COMMIT;
